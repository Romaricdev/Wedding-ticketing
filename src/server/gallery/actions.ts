"use server";

import { randomUUID } from "node:crypto";
import { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import {
  MAX_GALLERY_IMAGE_BYTES,
  optimizeGalleryImage,
} from "@/server/gallery/image-optimizer";
import {
  buildGalleryStoragePath,
  ensureGalleryBucket,
  isAllowedGalleryImageType,
  removeGalleryImage,
  uploadGalleryImage,
} from "@/server/gallery/storage";

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

function refreshGallery() {
  revalidatePath("/galerie");
  revalidatePath("/admin/galerie");
}

export async function uploadGalleryPhotoAction(
  formData: FormData,
): Promise<{ error?: string; originalSize?: number; storedSize?: number }> {
  const file = formData.get("file");
  const captionEntry = formData.get("caption");
  const categoryEntry = formData.get("categoryId");
  const caption =
    typeof captionEntry === "string" ? captionEntry.trim().slice(0, 240) : "";
  const categoryId =
    typeof categoryEntry === "string" && categoryEntry ? categoryEntry : null;
  if (!(file instanceof File) || file.size === 0)
    return { error: "Sélectionnez une photo." };
  const sourceMimeType = file.type;
  if (!isAllowedGalleryImageType(sourceMimeType)) {
    return { error: "Utilisez une image JPG, PNG ou WebP." };
  }
  if (file.size > MAX_UPLOAD_SIZE)
    return { error: "Chaque photo source est limitée à 15 Mo." };

  try {
    const eventUser = await requireAdmin();
    if (categoryId) {
      const category = await prisma.galleryCategory.findFirst({
        where: { id: categoryId, eventId: eventUser.eventId },
        select: { id: true },
      });
      if (!category) return { error: "La catégorie sélectionnée est introuvable." };
    }
    const image = await optimizeGalleryImage({
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: sourceMimeType,
      filename: file.name,
    });
    if (image.bytes.byteLength > MAX_GALLERY_IMAGE_BYTES) {
      return { error: "La photo dépasse la limite de 5 Mo après optimisation." };
    }
    const id = randomUUID();
    const storagePath = buildGalleryStoragePath(eventUser.eventId, id, image.mimeType);
    await ensureGalleryBucket();
    await uploadGalleryImage({
      path: storagePath,
      bytes: image.bytes,
      mimeType: image.mimeType,
    });
    await prisma.$transaction(async (tx) => {
      await tx.galleryPhoto.create({
        data: {
          id,
          eventId: eventUser.eventId,
          storageBucket: "event-gallery",
          storagePath,
          originalFilename: image.filename.slice(0, 255),
          mimeType: image.mimeType,
          byteSize: image.bytes.byteLength,
          caption: caption || null,
          categoryId,
        },
      });
      await tx.auditLog.create({
        data: {
          eventId: eventUser.eventId,
          actorUserId: eventUser.id,
          action: AuditAction.GALLERY_PHOTO_UPLOADED,
          entityType: "gallery_photo",
          entityId: id,
          afterData: {
            filename: image.filename,
            originalByteSize: file.size,
            storedByteSize: image.bytes.byteLength,
            optimized: image.optimized,
          },
        },
      });
    });
    refreshGallery();
    return { originalSize: file.size, storedSize: image.bytes.byteLength };
  } catch (error) {
    if (error instanceof Error && error.message.includes("sous 5 Mo")) {
      return {
        error:
          "Cette photo est trop détaillée pour atteindre 5 Mo. Réduisez-la légèrement puis réessayez.",
      };
    }
    return { error: "L’import de la photo a échoué. Réessayez dans un instant." };
  }
}

export async function createGalleryCategoryAction(
  name: string,
): Promise<{ error?: string }> {
  const normalizedName = name.trim().replaceAll(/\s+/g, " ");
  if (!normalizedName) return { error: "Renseignez un nom de catégorie." };
  if (normalizedName.length > 100)
    return { error: "Le nom est limité à 100 caractères." };
  try {
    const eventUser = await requireAdmin();
    const lastCategory = await prisma.galleryCategory.findFirst({
      where: { eventId: eventUser.eventId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const category = await prisma.galleryCategory.create({
      data: {
        eventId: eventUser.eventId,
        name: normalizedName,
        sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
      },
    });
    await prisma.auditLog.create({
      data: {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.EVENT_UPDATED,
        entityType: "gallery_category",
        entityId: category.id,
        afterData: { name: category.name },
      },
    });
    refreshGallery();
    return {};
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Une catégorie porte déjà ce nom." };
    }
    return { error: "La catégorie n’a pas pu être créée." };
  }
}

export async function deleteGalleryCategoryAction(
  categoryId: string,
): Promise<{ error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const category = await prisma.galleryCategory.findFirst({
      where: { id: categoryId, eventId: eventUser.eventId },
      select: { id: true, name: true },
    });
    if (!category) return { error: "Cette catégorie n’existe plus." };
    await prisma.$transaction(async (tx) => {
      await tx.galleryPhoto.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: null },
      });
      await tx.galleryCategory.delete({ where: { id: category.id } });
      await tx.auditLog.create({
        data: {
          eventId: eventUser.eventId,
          actorUserId: eventUser.id,
          action: AuditAction.EVENT_UPDATED,
          entityType: "gallery_category",
          entityId: category.id,
          beforeData: { name: category.name },
        },
      });
    });
    refreshGallery();
    return {};
  } catch {
    return { error: "La catégorie n’a pas pu être supprimée." };
  }
}

export async function setGalleryPhotoCategoryAction(params: {
  photoId: string;
  categoryId: string | null;
}): Promise<{ error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const photo = await prisma.galleryPhoto.findFirst({
      where: { id: params.photoId, eventId: eventUser.eventId },
      select: { id: true },
    });
    if (!photo) return { error: "Cette photo n’existe plus." };
    if (params.categoryId) {
      const category = await prisma.galleryCategory.findFirst({
        where: { id: params.categoryId, eventId: eventUser.eventId },
        select: { id: true },
      });
      if (!category) return { error: "La catégorie sélectionnée est introuvable." };
    }
    await prisma.galleryPhoto.update({
      where: { id: photo.id },
      data: { categoryId: params.categoryId },
    });
    refreshGallery();
    return {};
  } catch {
    return { error: "Le classement de la photo n’a pas pu être mis à jour." };
  }
}

export async function deleteGalleryPhotoAction(
  photoId: string,
): Promise<{ error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const photo = await prisma.galleryPhoto.findFirst({
      where: { id: photoId, eventId: eventUser.eventId },
      select: { id: true, storagePath: true, originalFilename: true },
    });
    if (!photo) return { error: "Cette photo n’existe plus." };

    await prisma.$transaction(async (tx) => {
      await tx.galleryPhoto.delete({ where: { id: photo.id } });
      await tx.auditLog.create({
        data: {
          eventId: eventUser.eventId,
          actorUserId: eventUser.id,
          action: AuditAction.GALLERY_PHOTO_DELETED,
          entityType: "gallery_photo",
          entityId: photo.id,
          beforeData: { filename: photo.originalFilename },
        },
      });
    });
    await removeGalleryImage(photo.storagePath);
    refreshGallery();
    return {};
  } catch {
    return { error: "La photo n’a pas pu être supprimée." };
  }
}
