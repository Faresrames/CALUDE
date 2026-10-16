// Tipos do domínio. Espelham replica/schema.sql (camelCase aqui, snake_case no banco).

export type GalleryStatus = "draft" | "sent" | "in_progress" | "submitted" | "expired" | "delivered" | "archived";

export type Photographer = {
  id: string;
  name: string;
  businessName: string | null;
  email: string;
  watermarkText: string | null;
  /** PNG da marca d'água no storage; se existir, é usado no lugar do texto */
  watermarkKey: string | null;
  watermarkOpacity: number; // 0–100
  watermarkPosition: WatermarkPosition;
  pixKey: string | null;
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random" | null;
  pixMerchantName: string | null;
  pixMerchantCity: string | null;
  createdAt: string;
};

export type WatermarkPosition = "center" | "tiled" | "bottom-right";

export type PhotographerPatch = Partial<Pick<Photographer,
  "name" | "businessName" | "watermarkText" | "watermarkKey" | "watermarkOpacity" | "watermarkPosition"
  | "pixKey" | "pixKeyType" | "pixMerchantName" | "pixMerchantCity">>;

// ── álbum ──
export type AlbumStatus = "pending" | "changes_requested" | "approved";
export type AlbumComment = { id: string; spreadId: string; x: number | null; y: number | null; author: "client" | "photographer"; body: string; createdAt: string };
export type AlbumSpread = { id: string; position: number; imageKey: string; width: number | null; height: number | null; comments: AlbumComment[] };
export type AlbumVersion = { id: string; number: number; status: AlbumStatus; note: string | null; decidedAt: string | null; createdAt: string; spreads: AlbumSpread[] };
export type Album = { id: string; galleryId: string; photographerId: string; title: string; createdAt: string; versions: AlbumVersion[] };
export type AlbumSummary = {
  id: string; galleryId: string; title: string; galleryTitle: string; clientName: string | null;
  latest: { number: number; status: AlbumStatus } | null;
};

export type Order = {
  id: string;
  galleryId: string;
  photographerId: string;
  extrasCount: number;
  unitPriceCents: number;
  amountCents: number;
  currency: "BRL";
  method: "pix_manual" | "pix" | "card";
  status: "pending" | "paid" | "expired" | "canceled" | "refunded";
  paidAt: string | null;
  createdAt: string;
};

export type Plan = "trial" | "starter" | "pro" | "studio";
export type Subscription = {
  photographerId: string;
  plan: Plan;
  status: "trialing" | "active" | "past_due" | "canceled";
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  provider: "asaas" | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
};

export type ReminderTarget = {
  galleryId: string;
  title: string;
  accessToken: string;
  deadlineAt: string | null;
  clientName: string | null;
  clientEmail: string;
  studioName: string;
  kind: "reminder" | "deadline_tomorrow";
};

export type ExpiredGallery = { galleryId: string; title: string; photographerEmail: string; clientName: string | null };

export type NotificationKind = "gallery_sent" | "reminder" | "deadline_tomorrow" | "submitted" | "order_paid" | "album_ready" | "album_decided" | "delivered" | "expired";

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
  clientEmail: string | null;
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
  | "plan_inactive"
  | "album_locked"
  | "invalid";

export class DataError extends Error {
  constructor(public code: DataErrorCode, message?: string) {
    super(message ?? code);
  }
}

/** O contrato que a camada real (Supabase) vai implementar no /replica-backend. */
export interface DataLayer {
  /** Cria o perfil (e o teste de 14 dias) no primeiro login; depois só devolve. */
  ensurePhotographer(id: string, email: string, name: string): Promise<Photographer>;
  getPhotographer(id: string): Promise<Photographer | null>;
  getPhotographerByEmail(email: string): Promise<Photographer | null>;
  updatePhotographer(id: string, patch: PhotographerPatch): Promise<Photographer>;
  /** Apaga a conta e tudo dela. Devolve as chaves de arquivos para apagar no storage. */
  deletePhotographer(id: string): Promise<string[]>;

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
  /** Finaliza; se houver extras, cria o pedido de pagamento na mesma transação. */
  submitSelection(galleryId: string): Promise<{ total: number; inPackage: number; extras: number; extrasCents: number; order: Order | null }>;
  exportSelection(photographerId: string, galleryId: string): Promise<{ basenames: string[]; favorites: string[] }>;

  getOrderForGallery(galleryId: string): Promise<Order | null>;
  confirmOrder(photographerId: string, orderId: string): Promise<Order>;
  expireStaleOrders(olderThanHours: number): Promise<number>;

  getSubscription(photographerId: string): Promise<Subscription>;
  linkSubscription(photographerId: string, plan: Plan, customerId: string, subscriptionId: string): Promise<void>;
  updateSubscriptionByProvider(providerSubscriptionId: string, patch: Partial<Pick<Subscription, "status" | "plan" | "currentPeriodEnd">>): Promise<Subscription | null>;
  /** true se o evento é novo; false se já foi processado (webhook repetido). */
  recordWebhookEvent(provider: string, eventId: string, type: string): Promise<boolean>;

  reminderTargets(now: Date): Promise<ReminderTarget[]>;
  expireOverdueGalleries(now: Date): Promise<ExpiredGallery[]>;
  /** Registra um envio; false se já houve um igual hoje (não manda de novo). */
  claimNotification(galleryId: string, kind: NotificationKind, channel: "email", recipient: string): Promise<string | null>;
  finishNotification(id: string, error: string | null): Promise<void>;

  listAlbums(photographerId: string): Promise<AlbumSummary[]>;
  createAlbum(photographerId: string, galleryId: string, title: string): Promise<{ id: string }>;
  /** Álbum com todas as versões (mais nova primeiro), lâminas e comentários. */
  getAlbum(photographerId: string, albumId: string): Promise<Album | null>;
  /** Para o cliente: o álbum da galeria, só com a versão mais nova. */
  getAlbumForGallery(galleryId: string): Promise<Album | null>;
  addAlbumVersion(photographerId: string, albumId: string, input: { note: string | null; spreads: { imageKey: string; width: number; height: number }[] }): Promise<AlbumVersion>;
  /** Comentário do cliente num ponto (x,y de 0 a 1) ou na lâmina toda; só na versão mais nova ainda sem decisão. */
  addSpreadComment(galleryId: string, spreadId: string, input: { x: number | null; y: number | null; body: string }): Promise<AlbumComment>;
  decideAlbumVersion(galleryId: string, versionId: string, decision: "approved" | "changes_requested"): Promise<AlbumVersion>;

  listComments(galleryId: string): Promise<Comment[]>;
  addComment(galleryId: string, input: { photoId: string | null; author: Comment["author"]; body: string }): Promise<Comment>;
}
