export interface GalleryPhoto {
  id: string;
  uri: string;
  createdAt: number;
}

let galleryPhotos: GalleryPhoto[] = [];
const listeners: Set<() => void> = new Set();

export function getGalleryPhotos(): GalleryPhoto[] {
  return galleryPhotos;
}

export function addGalleryPhoto(uri: string): { photo: GalleryPhoto; isNew: boolean } {
  const existing = galleryPhotos.find((photo) => photo.uri === uri);
  if (existing) {
    return { photo: existing, isNew: false };
  }

  const newPhoto: GalleryPhoto = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
    uri,
    createdAt: Date.now(),
  };
  galleryPhotos = [newPhoto, ...galleryPhotos];
  listeners.forEach((listener) => listener());
  return { photo: newPhoto, isNew: true };
}

export function deleteGalleryPhotos(ids: string[]): void {
  const idSet = new Set(ids);
  galleryPhotos = galleryPhotos.filter((photo) => !idSet.has(photo.id));
  listeners.forEach((listener) => listener());
}

export function subscribeGallery(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
