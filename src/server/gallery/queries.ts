import { EventStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createGalleryImageUrl } from "@/server/gallery/storage";
import type {
  GalleryCategoryView,
  GalleryGroupView,
  GalleryPhotoView,
} from "@/types/gallery";

export type {
  GalleryCategoryView,
  GalleryGroupView,
  GalleryPhotoView,
} from "@/types/gallery";

async function mapPhoto(photo: {
  id: string;
  categoryId: string | null;
  caption: string | null;
  originalFilename: string;
  storagePath: string;
  createdAt: Date;
}): Promise<GalleryPhotoView> {
  const [imageUrl, downloadUrl] = await Promise.all([
    createGalleryImageUrl({ path: photo.storagePath }),
    createGalleryImageUrl({
      path: photo.storagePath,
      filename: photo.originalFilename,
    }),
  ]);
  return {
    id: photo.id,
    categoryId: photo.categoryId,
    caption: photo.caption,
    filename: photo.originalFilename,
    createdAt: photo.createdAt.toISOString(),
    imageUrl,
    downloadUrl,
  };
}

export async function getPublicEventGallery(): Promise<{
  eventName: string;
  groups: GalleryGroupView[];
} | null> {
  const event = await prisma.event.findFirst({
    where: { status: { not: EventStatus.ARCHIVED } },
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      galleryCategories: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          photos: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              categoryId: true,
              caption: true,
              originalFilename: true,
              storagePath: true,
              createdAt: true,
            },
          },
        },
      },
      galleryPhotos: {
        where: { isPublished: true, categoryId: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          categoryId: true,
          caption: true,
          originalFilename: true,
          storagePath: true,
          createdAt: true,
        },
      },
    },
  });
  if (!event) return null;
  const categoryGroups = await Promise.all(
    event.galleryCategories.map(async (category) => ({
      id: category.id,
      name: category.name,
      photos: await Promise.all(category.photos.map(mapPhoto)),
    })),
  );
  const uncategorized = await Promise.all(event.galleryPhotos.map(mapPhoto));
  return {
    eventName: event.name,
    groups: [
      ...categoryGroups.filter((group) => group.photos.length),
      ...(uncategorized.length
        ? [{ id: null, name: "Autres souvenirs", photos: uncategorized }]
        : []),
    ],
  };
}

export async function getAdminEventGallery(eventId: string): Promise<{
  photos: GalleryPhotoView[];
  categories: GalleryCategoryView[];
}> {
  const [photos, categories] = await Promise.all([
    prisma.galleryPhoto.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        categoryId: true,
        caption: true,
        originalFilename: true,
        storagePath: true,
        createdAt: true,
      },
    }),
    prisma.galleryCategory.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, _count: { select: { photos: true } } },
    }),
  ]);
  return {
    photos: await Promise.all(photos.map(mapPhoto)),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      photoCount: category._count.photos,
    })),
  };
}
