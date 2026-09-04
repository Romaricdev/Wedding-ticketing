import { PublicGallery } from "@/components/gallery/public-gallery";
import { getPublicEventGallery } from "@/server/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const gallery = await getPublicEventGallery();
  return (
    <PublicGallery
      eventName={gallery?.eventName ?? "notre mariage"}
      groups={gallery?.groups ?? []}
    />
  );
}
