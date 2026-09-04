import { Download, Heart, Images, Sparkles } from "lucide-react";
import Link from "next/link";

import type { GalleryGroupView, GalleryPhotoView } from "@/types/gallery";

const ALBUM_PREVIEW_COUNT = 6;

export function PublicGallery({
  eventName,
  groups,
}: {
  eventName: string;
  groups: GalleryGroupView[];
}) {
  const photoCount = groups.reduce((total, group) => total + group.photos.length, 0);
  const heroPhoto = groups[0]?.photos[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff9ef] text-[#651a24]">
      <header className="relative z-20 border-b border-[#d8af67]/25 bg-[#fffaf2]/85 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-tight text-[#9e651f]"
          >
            V&amp;P
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7a3825] transition hover:text-[#ad661d]"
          >
            <Heart className="size-3.5" aria-hidden="true" />
            Retour à la célébration
          </Link>
        </div>
      </header>
      <section className="relative isolate border-b border-[#d8af67]/30 bg-[#7d1f2b] px-5 py-14 text-[#fff7e9] sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute -right-28 -top-28 size-[29rem] rounded-full border-[48px] border-[#d5a55e]/30" />
        <div className="pointer-events-none absolute -bottom-32 left-[14%] size-72 rounded-full bg-[#c76a24]/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[#eac475]">
              <span className="h-px w-12 bg-current/70" />
              <Sparkles className="size-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.31em]">
                Nos souvenirs
              </p>
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-[.95] sm:text-6xl lg:text-7xl">
              Les instants que nous garderons à jamais.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#ffeac6]/85 sm:text-lg">
              Retrouvez et téléchargez les images de {eventName}, classées pour revivre
              chaque moment de notre célébration.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#f7d99b]">
              <span className="border border-[#d5a55e]/50 px-3 py-1.5">
                {photoCount} souvenir{photoCount > 1 ? "s" : ""}
              </span>
              <span className="text-[#fff4de]/75">
                Téléchargement libre pour nos invités
              </span>
            </div>
          </div>
          {heroPhoto ? (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-3 border border-[#eac475]/50" />
              <div className="relative aspect-[4/3] overflow-hidden bg-[#5a1620] shadow-[0_28px_70px_rgba(35,7,11,.38)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto.imageUrl}
                  alt={heroPhoto.caption || heroPhoto.filename}
                  className="size-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3d0d16]/90 via-[#3d0d16]/20 to-transparent px-5 pb-5 pt-14">
                  <p className="font-serif text-xl">
                    {heroPhoto.caption || "Un souvenir précieux"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {groups.length ? (
        <nav
          className="sticky top-0 z-10 border-b border-[#d8af67]/25 bg-[#fff9ef]/95 px-5 py-3 backdrop-blur sm:px-8"
          aria-label="Albums de la galerie"
        >
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
            <span className="shrink-0 py-2 pr-2 text-xs font-semibold uppercase tracking-[.18em] text-[#a36a25]">
              Albums
            </span>
            {groups.map((group) => (
              <a
                key={group.id ?? "uncategorized"}
                href={`#gallery-category-${group.id ?? "uncategorized"}`}
                className="shrink-0 rounded-full border border-[#d8af67]/35 px-3 py-1.5 text-sm text-[#783126] transition hover:border-[#8f2731] hover:bg-[#8f2731] hover:text-[#fff9ef]"
              >
                {group.name}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
      <section className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute left-0 top-28 size-40 rounded-full border border-[#d8af67]/20" />
        {groups.length ? (
          <div className="relative space-y-20">
            {groups.map((group) => {
              const previewPhotos = group.photos.slice(0, ALBUM_PREVIEW_COUNT);
              const remainingPhotos = group.photos.slice(ALBUM_PREVIEW_COUNT);
              return (
                <section
                  key={group.id ?? "uncategorized"}
                  aria-labelledby={`gallery-category-${group.id ?? "uncategorized"}`}
                >
                  <div className="mb-8 flex items-end gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#ad7026]">
                        Album · {group.photos.length} photo
                        {group.photos.length > 1 ? "s" : ""}
                      </p>
                      <h2
                        id={`gallery-category-${group.id ?? "uncategorized"}`}
                        className="mt-2 font-serif text-4xl text-[#70212a] sm:text-5xl"
                      >
                        {group.name}
                      </h2>
                    </div>
                    <div className="mb-2 h-px flex-1 bg-[#d8af67]/45" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {previewPhotos.map((photo, index) => (
                      <GalleryPhotoCard
                        key={photo.id}
                        photo={photo}
                        featured={index === 0}
                      />
                    ))}
                  </div>
                  {remainingPhotos.length ? (
                    <details className="group mt-5 border border-[#d8af67]/35 bg-[#fffdf8]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#7d2b26] marker:hidden">
                        <span>
                          Afficher les {remainingPhotos.length} autre
                          {remainingPhotos.length > 1 ? "s" : ""} photo
                          {remainingPhotos.length > 1 ? "s" : ""} de cet album
                        </span>
                        <span className="text-lg font-normal text-[#ad7026] transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <div className="grid gap-4 border-t border-[#d8af67]/25 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {remainingPhotos.map((photo) => (
                          <GalleryPhotoCard key={photo.id} photo={photo} />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="relative mx-auto flex max-w-xl flex-col items-center border border-[#d8af67]/40 bg-[#fffdf8] px-6 py-16 text-center shadow-[0_16px_40px_rgba(99,39,25,.08)]">
            <span className="absolute -top-4 flex size-9 items-center justify-center rounded-full bg-[#8b2630] text-[#ffe7b1]">
              <Images className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-2 font-serif text-3xl">Les souvenirs arrivent bientôt</h2>
            <p className="mt-3 leading-7 text-[#704a3d]">
              Les photos de cette belle célébration seront ajoutées ici prochainement.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function GalleryPhotoCard({
  photo,
  featured = false,
}: {
  photo: GalleryPhotoView;
  featured?: boolean;
}) {
  return (
    <figure
      className={`group relative overflow-hidden bg-[#efdcbf] shadow-[0_14px_32px_rgba(99,39,25,.12)] ${featured ? "sm:col-span-2 lg:row-span-2" : ""}`}
    >
      <div className={featured ? "aspect-[16/10] lg:aspect-[4/3]" : "aspect-[4/3]"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={photo.caption || photo.filename}
          loading="lazy"
          className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 flex translate-y-1 items-end justify-between gap-3 bg-gradient-to-t from-[#3c0d16]/90 via-[#3c0d16]/45 to-transparent px-4 pb-4 pt-16 text-[#fff9ef] opacity-100 transition duration-300 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
        <span className="min-w-0 truncate font-serif text-lg">
          {photo.caption || "Souvenir de notre célébration"}
        </span>
        <a
          href={photo.downloadUrl}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f3d591]/70 bg-[#fff9ef]/10 text-[#fff9ef] transition hover:bg-[#fff9ef] hover:text-[#7a1b29]"
          aria-label={`Télécharger ${photo.caption || photo.filename}`}
          title="Télécharger la photo"
        >
          <Download className="size-4" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}
