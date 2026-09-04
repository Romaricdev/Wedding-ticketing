export type GalleryPhotoView = {
  id: string;
  categoryId: string | null;
  caption: string | null;
  filename: string;
  createdAt: string;
  imageUrl: string;
  downloadUrl: string;
};

export type GalleryCategoryView = {
  id: string;
  name: string;
  photoCount: number;
};

export type GalleryGroupView = {
  id: string | null;
  name: string;
  photos: GalleryPhotoView[];
};
