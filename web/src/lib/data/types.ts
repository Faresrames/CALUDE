// Tipos do domínio. Espelham replica/schema.sql (camelCase aqui, snake_case no banco).

export type GalleryStatus = "draft" | "sent" | "in_progress" | "submitted" | "expired" | "delivered" | "archived";

export type Photographer = {
  id: string;
  name: string;
  businessName: string | null;
  email: string;
  watermarkText: string | null;
  createdAt: string;
};

export type Client = {
  id: string;
  photographerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type Gallery = {
  id: string;
  photographerId: string;
  clientId: string | null;
  title: string;
  eventDate: string | null; // YYYY-MM-DD
  accessToken: string;
  passwordHash: string | null;
  packageSize: number;
  allowExtras: boolean;
  extraPriceCents: number;
  currency: "BRL";
  deadlineAt: string | null; // ISO UTC
  allowComments: boolean;
  watermarkOn: boolean;
  status: GalleryStatus;
  sentAt: string | null;
  firstOpenedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Photo = {
  id: string;
  galleryId: string;
  photographerId: string;
  originalFilename: string;
  basename: string;
  folder: string | null;
  position: number;
  previewKey: string;
  thumbKey: string;
  width: number | null;
  height: number | null;
  bytes: number;
  photographerPick: boolean;
  createdAt: string;
};

export type Selection = {
  id: string;
  galleryId: string;
  photoId: string;
  selected: boolean;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  galleryId: string;
  photoId: string | null;
  author: "client" | "photographer";
  body: string;
  createdAt: string;
};

export type GallerySummary = Gallery & {
  clientName: string | null;
  photoCount: number;
  selectedCount: number;
  coverKey: string | null;
};

export type NewGalleryInput = {
  title: string;
  eventDate: string | null;
  clientName: string;
  clientEmail: string | null;
  packageSize: number;
  allowExtras: boolean;
  extraPriceCents: number;
  deadlineAt: string | null;
  password: string | null;
  allowComments: boolean;
  watermarkOn: boolean;
};

export type NewPhotoInput = {
  originalFilename: string;
  previewKey: string;
  thumbKey: string;
  width: number;
  height: number;
  bytes: number;
  folder?: string | null;
};

export type SelectionState = { count: number; selected: boolean; favorited: boolean };

/** Erros de regra de negócio. Os mesmos códigos que o banco levanta em replica/schema.sql. */
export type DataErrorCode =
  | "not_found"
  | "gallery_locked"
  | "gallery_expired"
  | "package_full"
  | "comments_off"
  | "invalid";

export class DataError extends Error {
  constructor(public code: DataErrorCode, message?: string) {
    super(message ?? code);
  }
}

/** O contrato que a camada real (Supabase) vai implementar no /replica-backend. */
export interface DataLayer {
  findOrCreatePhotographer(email: string, name: string): Promise<Photographer>;
  getPhotographer(id: string): Promise<Photographer | null>;

  listGalleries(photographerId: string, opts?: { q?: string; status?: GalleryStatus }): Promise<GallerySummary[]>;
  createGallery(photographerId: string, input: NewGalleryInput): Promise<Gallery>;
  getGallery(photographerId: string, galleryId: string): Promise<GallerySummary | null>;
  getGalleryByToken(token: string): Promise<GallerySummary | null>;
  sendGallery(photographerId: string, galleryId: string): Promise<Gallery>;
  reopenGallery(photographerId: string, galleryId: string, deadlineAt: string | null): Promise<Gallery>;
  updateDeadline(photographerId: string, galleryId: string, deadlineAt: string | null): Promise<Gallery>;
  markOpened(galleryId: string): Promise<void>;

  listPhotos(galleryId: string): Promise<Photo[]>;
  existingBasenames(photographerId: string, galleryId: string): Promise<string[]>;
  addPhotos(photographerId: string, galleryId: string, photos: NewPhotoInput[]): Promise<Photo[]>;

  listSelections(galleryId: string): Promise<Selection[]>;
  setSelection(galleryId: string, photoId: string, patch: { selected?: boolean; favorited?: boolean }): Promise<SelectionState>;
  submitSelection(galleryId: string): Promise<{ total: number; inPackage: number; extras: number; extrasCents: number }>;
  exportSelection(photographerId: string, galleryId: string): Promise<{ basenames: string[]; favorites: string[] }>;

  listComments(galleryId: string): Promise<Comment[]>;
  addComment(galleryId: string, input: { photoId: string | null; author: Comment["author"]; body: string }): Promise<Comment>;
}
