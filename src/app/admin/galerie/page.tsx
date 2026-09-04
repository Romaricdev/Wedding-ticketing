import { GalleryManager } from "@/components/admin/gallery/gallery-manager";
import { requireAdmin } from "@/server/auth";
import { getAdminEventGallery } from "@/server/gallery";

export default async function AdminGalleryPage() {
  const eventUser = await requireAdmin();
  const gallery = await getAdminEventGallery(eventUser.eventId);
  return (
    <GalleryManager
      initialPhotos={gallery.photos}
      initialCategories={gallery.categories}
    />
  );
}
