"use client";

import {
  Download,
  ExternalLink,
  FolderPlus,
  Images,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import {
  createGalleryCategoryAction,
  deleteGalleryCategoryAction,
  deleteGalleryPhotoAction,
  setGalleryPhotoCategoryAction,
  uploadGalleryPhotoAction,
} from "@/server/gallery/actions";
import type { GalleryCategoryView, GalleryPhotoView } from "@/types/gallery";

export function GalleryManager({
  initialPhotos,
  initialCategories,
}: {
  initialPhotos: GalleryPhotoView[];
  initialCategories: GalleryCategoryView[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhotoView | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<GalleryCategoryView | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  const selectFiles = (nextFiles: File[]) => setFiles(nextFiles);
  const removeSelectedFile = (index: number) =>
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  const visiblePhotos =
    activeCategory === "all"
      ? initialPhotos
      : initialPhotos.filter(
          (photo) => (photo.categoryId ?? "uncategorized") === activeCategory,
        );

  const upload = () => {
    if (!files.length) {
      toast({ title: "Sélectionnez au moins une photo", variant: "error" });
      return;
    }
    startTransition(async () => {
      const errors: string[] = [];
      let originalSize = 0;
      let storedSize = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("caption", caption);
        formData.set("categoryId", categoryId);
        const result = await uploadGalleryPhotoAction(formData);
        if (result.error) errors.push(`${file.name} : ${result.error}`);
        originalSize += result.originalSize ?? 0;
        storedSize += result.storedSize ?? 0;
      }
      if (errors.length) {
        toast({ title: "Import partiel", description: errors[0], variant: "error" });
        return;
      }
      setFiles([]);
      setCaption("");
      setCategoryId("");
      if (uploadRef.current) uploadRef.current.value = "";
      router.refresh();
      toast({
        title:
          files.length > 1
            ? "Photos ajoutées à la galerie"
            : "Photo ajoutée à la galerie",
        description:
          originalSize > storedSize
            ? `Optimisées de ${(originalSize / 1024 / 1024).toFixed(1)} Mo à ${(storedSize / 1024 / 1024).toFixed(1)} Mo, puis publiées.`
            : "Elles sont maintenant visibles depuis la page publique.",
        variant: "success",
      });
    });
  };

  const remove = () => {
    if (!photoToDelete) return;
    startTransition(async () => {
      const result = await deleteGalleryPhotoAction(photoToDelete.id);
      if (result.error) {
        toast({
          title: "Suppression impossible",
          description: result.error,
          variant: "error",
        });
      } else {
        toast({ title: "Photo supprimée", variant: "success" });
        router.refresh();
      }
      setPhotoToDelete(null);
    });
  };

  const createCategory = () => {
    startTransition(async () => {
      const result = await createGalleryCategoryAction(categoryName);
      if (result.error) {
        toast({
          title: "Création impossible",
          description: result.error,
          variant: "error",
        });
        return;
      }
      setCategoryName("");
      router.refresh();
      toast({ title: "Catégorie créée", variant: "success" });
    });
  };

  const removeCategory = () => {
    if (!categoryToDelete) return;
    startTransition(async () => {
      const result = await deleteGalleryCategoryAction(categoryToDelete.id);
      if (result.error) {
        toast({
          title: "Suppression impossible",
          description: result.error,
          variant: "error",
        });
      } else {
        toast({
          title: "Catégorie supprimée",
          description: "Ses photos ont été déplacées vers les souvenirs non classés.",
          variant: "success",
        });
      }
      setCategoryToDelete(null);
      router.refresh();
    });
  };

  const updatePhotoCategory = (photoId: string, nextCategoryId: string) => {
    startTransition(async () => {
      const result = await setGalleryPhotoCategoryAction({
        photoId,
        categoryId: nextCategoryId || null,
      });
      if (result.error)
        toast({
          title: "Classement impossible",
          description: result.error,
          variant: "error",
        });
      else {
        toast({ title: "Photo classée", variant: "success" });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Galerie photos"
        description="Ajoutez les souvenirs de l’événement. Les invités peuvent les consulter et les télécharger depuis la galerie publique."
        actions={
          <Link
            href="/galerie"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition hover:bg-surface-subtle"
          >
            Voir la galerie publique{" "}
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <Surface className="p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <FolderPlus className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-text">Albums de la galerie</h2>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Créez les catégories qui structureront aussi l’affichage de la galerie
              publique.
            </p>
          </div>
          <div className="flex w-full gap-2 lg:max-w-md">
            <Input
              value={categoryName}
              maxLength={100}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ex. Cérémonie civile"
              aria-label="Nom de la catégorie"
            />
            <Button
              size="sm"
              loading={pending}
              onClick={createCategory}
              icon={<FolderPlus className="size-4" />}
            >
              Ajouter
            </Button>
          </div>
        </div>
        {initialCategories.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {initialCategories.map((category) => (
              <div
                key={category.id}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-subtle py-1 pl-2 pr-1 text-sm text-text"
              >
                <span>
                  {category.name}{" "}
                  <span className="text-xs text-text-muted">
                    ({category.photoCount})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(category)}
                  className="inline-flex size-7 items-center justify-center rounded text-danger hover:bg-danger-subtle"
                  aria-label={`Supprimer la catégorie ${category.name}`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Aucun album pour le moment. Les photos resteront dans « Autres souvenirs »
            tant qu’elles ne sont pas classées.
          </p>
        )}
      </Surface>
      <Surface className="p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
            <Upload className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Ajouter des photos</h2>
            <p className="mt-1 text-sm text-text-muted">
              JPG, PNG ou WebP, jusqu’à 15 Mo à l’import. Chaque photo publiée est
              limitée à 5 Mo grâce à une optimisation haute qualité.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFiles(Array.from(event.dataTransfer.files));
            }}
            className={`flex min-h-40 flex-col items-center justify-center border border-dashed px-5 text-center transition ${dragging ? "border-primary bg-primary-subtle" : "border-border bg-surface-subtle/50 hover:border-primary/50"}`}
          >
            <Input
              ref={uploadRef}
              id="gallery-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}
              className="sr-only"
            />
            <Upload className="size-6 text-primary" aria-hidden="true" />
            <Label
              htmlFor="gallery-files"
              className="mt-3 cursor-pointer text-sm font-semibold text-text"
            >
              Déposez vos photos ici ou choisissez-les
            </Label>
            <p className="mt-1 text-xs text-text-muted">
              JPG, PNG ou WebP · 15 Mo maximum à l’import
            </p>
            {files.length ? (
              <p className="mt-3 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                {files.length} photo{files.length > 1 ? "s" : ""} prête
                {files.length > 1 ? "s" : ""} à publier
              </p>
            ) : null}
          </div>
          <div className="grid content-center gap-4 border border-border bg-surface-subtle/40 p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gallery-category">Classer dans l’album</Label>
              <select
                id="gallery-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
              >
                <option value="">Autres souvenirs</option>
                {initialCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="gallery-caption">Légende facultative</Label>
              <Input
                id="gallery-caption"
                value={caption}
                maxLength={240}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Ex. Cérémonie civile"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                className="w-full sm:w-auto"
                loading={pending}
                onClick={upload}
                icon={<Upload className="size-4" />}
              >
                Publier dans la galerie
              </Button>
            </div>
          </div>
        </div>
        {previews.length ? (
          <div className="mt-5 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text">
                  Aperçu avant publication
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Vérifiez votre sélection avant de l’ajouter à la galerie publique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  if (uploadRef.current) uploadRef.current.value = "";
                }}
                className="text-xs font-medium text-text-muted hover:text-danger"
              >
                Tout retirer
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {previews.map((preview, index) => (
                <div
                  key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                  className="group relative overflow-hidden rounded-md border border-border bg-surface-subtle"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={`Aperçu de ${preview.file.name}`}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-text/75 text-white opacity-100 shadow-sm transition hover:bg-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Retirer ${preview.file.name}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                  <div className="border-t border-border bg-surface px-2 py-2">
                    <p
                      className="truncate text-xs font-medium text-text"
                      title={preview.file.name}
                    >
                      {preview.file.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {(preview.file.size / 1024 / 1024).toFixed(1)} Mo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Surface>
      {initialPhotos.length ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-semibold text-text">Photos publiées</h2>
              <p className="mt-1 text-sm text-text-muted">
                Retrouvez, classez et gérez chaque image de votre galerie.
              </p>
            </div>
            <p className="text-sm font-medium text-text-muted">
              {visiblePhotos.length} photo{visiblePhotos.length > 1 ? "s" : ""}
            </p>
          </div>
          <div
            className="flex gap-2 overflow-x-auto border-b border-border pb-3"
            role="tablist"
            aria-label="Filtrer les photos par album"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-muted hover:bg-primary-subtle hover:text-text"}`}
            >
              Toutes ({initialPhotos.length})
            </button>
            {initialCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${activeCategory === category.id ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-muted hover:bg-primary-subtle hover:text-text"}`}
              >
                {category.name} ({category.photoCount})
              </button>
            ))}
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "uncategorized"}
              onClick={() => setActiveCategory("uncategorized")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${activeCategory === "uncategorized" ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-muted hover:bg-primary-subtle hover:text-text"}`}
            >
              Sans album
            </button>
          </div>
          {visiblePhotos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePhotos.map((photo) => (
                <Surface key={photo.id} className="group overflow-hidden shadow-sm">
                  <div className="aspect-[4/3] bg-surface-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || photo.filename}
                      className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {photo.caption || photo.filename}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                        }).format(new Date(photo.createdAt))}
                      </p>
                      <select
                        value={photo.categoryId ?? ""}
                        disabled={pending}
                        onChange={(event) =>
                          updatePhotoCategory(photo.id, event.target.value)
                        }
                        className="mt-2 h-8 max-w-full rounded border border-border bg-surface px-2 text-xs text-text-muted outline-none focus:border-focus"
                      >
                        <option value="">Autres souvenirs</option>
                        {initialCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={photo.downloadUrl}
                        className="inline-flex size-9 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-subtle hover:text-text"
                        aria-label={`Télécharger ${photo.caption || photo.filename}`}
                        title="Télécharger"
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(photo)}
                        className="inline-flex size-9 items-center justify-center rounded-md text-danger transition hover:bg-danger-subtle"
                        aria-label={`Supprimer ${photo.caption || photo.filename}`}
                        title="Supprimer"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Images className="size-6" aria-hidden="true" />}
              title="Aucune photo dans cet album"
              description="Choisissez un autre album ou classez une photo existante ici."
            />
          )}
        </section>
      ) : (
        <EmptyState
          icon={<Images className="size-6" aria-hidden="true" />}
          title="La galerie est encore vide"
          description="Importez les premières photos de l’événement pour les partager avec vos invités."
        />
      )}
      <ConfirmDialog
        open={Boolean(photoToDelete)}
        title="Supprimer cette photo ?"
        description="Elle ne sera plus visible ni téléchargeable depuis la galerie publique."
        confirmLabel="Supprimer la photo"
        onConfirm={remove}
        onCancel={() => setPhotoToDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Supprimer cet album ?"
        description="Les photos qui y sont classées seront conservées et déplacées vers « Autres souvenirs » sur la galerie publique."
        confirmLabel="Supprimer l’album"
        onConfirm={removeCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
