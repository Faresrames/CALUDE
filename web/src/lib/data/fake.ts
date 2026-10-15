// Camada de dados FALSA: guarda tudo em web/.data/db.json.
// Mesmas funções e mesmas regras do banco real (replica/schema.sql), para o
// /replica-backend trocar por Supabase sem mexer em nenhuma tela.
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { hashPassword } from "./password";
import { seed } from "./seed";
import {
  DataError,
  type Client,
  type Comment,
  type DataLayer,
  type Gallery,
  type GallerySummary,
  type Photo,
  type Photographer,
  type Selection,
} from "./types";

export type FakeDb = {
  photographers: Photographer[];
  clients: Client[];
  galleries: Gallery[];
  photos: Photo[];
  selections: Selection[];
  comments: Comment[];
};

export const DATA_DIR = join(process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "db.json");

// Em produção o Next empacota cada rota separado: estado em variável de módulo
// viraria uma cópia por rota (e uma apagaria a escrita da outra). Fica no globalThis.
type Store = { db: Promise<FakeDb> | null; queue: Promise<unknown> };
const store: Store = ((globalThis as { __fakeStore?: Store }).__fakeStore ??= { db: null, queue: Promise.resolve() });

function load(): Promise<FakeDb> {
  store.db ??= (async () => {
    try {
      return JSON.parse(await readFile(DB_FILE, "utf8")) as FakeDb;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; // arquivo corrompido: não sobrescreve
      const fresh = await seed();
      await persist(fresh);
      return fresh;
    }
  })();
  return store.db;
}

async function persist(db: FakeDb) {
  await mkdir(dirname(DB_FILE), { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 1));
  await rename(tmp, DB_FILE);
}

/** Leitura simples. */
async function read<T>(fn: (db: FakeDb) => T): Promise<T> {
  return fn(await load());
}

/** Escrita em fila: uma de cada vez, como a transação + "for update" do banco. */
function write<T>(fn: (db: FakeDb) => T): Promise<T> {
  const run = store.queue.then(async () => {
    const db = await load();
    const out = fn(db);
    await persist(db);
    return out;
  });
  store.queue = run.catch(() => undefined);
  return run;
}

const now = () => new Date().toISOString();
const token = () => randomBytes(18).toString("base64url");

/** Prazo vencido vira "expired" na leitura (o job do cron faz isso no real). */
function effective(g: Gallery): Gallery {
  if (g.deadlineAt && (g.status === "sent" || g.status === "in_progress") && new Date(g.deadlineAt) < new Date()) {
    return { ...g, status: "expired" };
  }
  return g;
}

function summarize(db: FakeDb, g: Gallery): GallerySummary {
  const photos = db.photos.filter((p) => p.galleryId === g.id).sort((a, b) => a.position - b.position);
  return {
    ...effective(g),
    clientName: db.clients.find((c) => c.id === g.clientId)?.name ?? null,
    photoCount: photos.length,
    selectedCount: db.selections.filter((s) => s.galleryId === g.id && s.selected).length,
    coverKey: photos[0]?.thumbKey ?? null,
  };
}

function ownGallery(db: FakeDb, photographerId: string, galleryId: string) {
  const g = db.galleries.find((x) => x.id === galleryId && x.photographerId === photographerId);
  if (!g) throw new DataError("not_found");
  return g;
}

function basenameOf(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

export const fakeData: DataLayer = {
  async findOrCreatePhotographer(email, name) {
    const e = email.trim().toLowerCase();
    return write((db) => {
      let p = db.photographers.find((x) => x.email === e);
      if (!p) {
        p = { id: randomUUID(), name, businessName: null, email: e, watermarkText: name, createdAt: now() };
        db.photographers.push(p);
      }
      return p;
    });
  },

  getPhotographer: (id) => read((db) => db.photographers.find((p) => p.id === id) ?? null),

  listGalleries: (photographerId, opts = {}) =>
    read((db) => {
      const q = opts.q?.trim().toLowerCase();
      return db.galleries
        .filter((g) => g.photographerId === photographerId)
        .map((g) => summarize(db, g))
        .filter((g) => (opts.status ? g.status === opts.status : g.status !== "archived"))
        .filter((g) => !q || g.title.toLowerCase().includes(q) || g.clientName?.toLowerCase().includes(q))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }),

  createGallery: (photographerId, input) =>
    write((db) => {
      if (!input.title.trim() || input.packageSize < 0 || input.extraPriceCents < 0) throw new DataError("invalid");
      const client: Client = {
        id: randomUUID(), photographerId, name: input.clientName.trim(), email: input.clientEmail?.trim() || null,
        phone: null, createdAt: now(),
      };
      db.clients.push(client);
      const g: Gallery = {
        id: randomUUID(), photographerId, clientId: client.id, title: input.title.trim(), eventDate: input.eventDate,
        accessToken: token(), passwordHash: input.password ? hashPassword(input.password) : null,
        packageSize: input.packageSize, allowExtras: input.allowExtras, extraPriceCents: input.extraPriceCents,
        currency: "BRL", deadlineAt: input.deadlineAt, allowComments: input.allowComments, watermarkOn: input.watermarkOn,
        status: "draft", sentAt: null, firstOpenedAt: null, submittedAt: null, createdAt: now(), updatedAt: now(),
      };
      db.galleries.push(g);
      return g;
    }),

  getGallery: (photographerId, galleryId) =>
    read((db) => {
      const g = db.galleries.find((x) => x.id === galleryId && x.photographerId === photographerId);
      return g ? summarize(db, g) : null;
    }),

  getGalleryByToken: (t) =>
    read((db) => {
      const g = db.galleries.find((x) => x.accessToken === t);
      return g ? summarize(db, g) : null;
    }),

  sendGallery: (photographerId, galleryId) =>
    write((db) => {
      const g = ownGallery(db, photographerId, galleryId);
      if (!db.photos.some((p) => p.galleryId === g.id)) throw new DataError("invalid", "Galeria sem fotos");
      if (g.status === "draft") Object.assign(g, { status: "sent", sentAt: now(), updatedAt: now() });
      return g;
    }),

  reopenGallery: (photographerId, galleryId, deadlineAt) =>
    write((db) => {
      const g = ownGallery(db, photographerId, galleryId);
      Object.assign(g, { status: "in_progress", submittedAt: null, deadlineAt, updatedAt: now() });
      return g;
    }),

  updateDeadline: (photographerId, galleryId, deadlineAt) =>
    write((db) => {
      const g = ownGallery(db, photographerId, galleryId);
      Object.assign(g, { deadlineAt, updatedAt: now() });
      if (g.status === "expired") g.status = "in_progress";
      return g;
    }),

  markOpened: (galleryId) =>
    write((db) => {
      const g = db.galleries.find((x) => x.id === galleryId);
      if (g && !g.firstOpenedAt) g.firstOpenedAt = now();
    }),

  listPhotos: (galleryId) =>
    read((db) => db.photos.filter((p) => p.galleryId === galleryId).sort((a, b) => a.position - b.position)),

  existingBasenames: (photographerId, galleryId) =>
    read((db) => {
      ownGallery(db, photographerId, galleryId);
      return db.photos.filter((p) => p.galleryId === galleryId).map((p) => p.basename);
    }),

  addPhotos: (photographerId, galleryId, inputs) =>
    write((db) => {
      ownGallery(db, photographerId, galleryId);
      const existing = db.photos.filter((p) => p.galleryId === galleryId);
      const names = new Set(existing.map((p) => p.basename));
      let position = existing.reduce((m, p) => Math.max(m, p.position), 0);
      const added: Photo[] = [];
      for (const i of inputs) {
        const basename = basenameOf(i.originalFilename);
        if (names.has(basename)) continue; // unique (gallery_id, basename)
        names.add(basename);
        const p: Photo = {
          id: randomUUID(), galleryId, photographerId, originalFilename: i.originalFilename, basename,
          folder: i.folder ?? null, position: ++position, previewKey: i.previewKey, thumbKey: i.thumbKey,
          width: i.width, height: i.height, bytes: i.bytes, photographerPick: false, createdAt: now(),
        };
        db.photos.push(p);
        added.push(p);
      }
      return added;
    }),

  listSelections: (galleryId) => read((db) => db.selections.filter((s) => s.galleryId === galleryId)),

  setSelection: (galleryId, photoId, patch) =>
    write((db) => {
      const raw = db.galleries.find((g) => g.id === galleryId);
      if (!raw || !db.photos.some((p) => p.id === photoId && p.galleryId === galleryId)) throw new DataError("not_found");
      const g = effective(raw);
      // mesmas regras do trigger guard_gallery_open()
      if (g.status === "expired") throw new DataError("gallery_expired");
      if (g.status !== "sent" && g.status !== "in_progress") throw new DataError("gallery_locked");
      const mine = db.selections.filter((s) => s.galleryId === galleryId);
      let s = mine.find((x) => x.photoId === photoId);
      const willSelect = patch.selected ?? s?.selected ?? false;
      if (willSelect && !s?.selected && !g.allowExtras) {
        const others = mine.filter((x) => x.selected && x.photoId !== photoId).length;
        if (others >= g.packageSize) throw new DataError("package_full");
      }
      if (!s) {
        s = { id: randomUUID(), galleryId, photoId, selected: false, favorited: false, createdAt: now(), updatedAt: now() };
        db.selections.push(s);
      }
      if (patch.selected !== undefined) s.selected = patch.selected;
      if (patch.favorited !== undefined) s.favorited = patch.favorited;
      s.updatedAt = now();
      if (raw.status === "sent") Object.assign(raw, { status: "in_progress", updatedAt: now() });
      return {
        count: db.selections.filter((x) => x.galleryId === galleryId && x.selected).length,
        selected: s.selected,
        favorited: s.favorited,
      };
    }),

  submitSelection: (galleryId) =>
    write((db) => {
      const raw = db.galleries.find((g) => g.id === galleryId);
      if (!raw) throw new DataError("not_found");
      const g = effective(raw);
      if (g.status === "expired") throw new DataError("gallery_expired");
      if (g.status !== "sent" && g.status !== "in_progress") throw new DataError("gallery_locked");
      const total = db.selections.filter((s) => s.galleryId === galleryId && s.selected).length;
      if (total === 0) throw new DataError("invalid", "Nenhuma foto selecionada");
      const inPackage = Math.min(total, g.packageSize);
      const extras = total - inPackage;
      Object.assign(raw, { status: "submitted", submittedAt: now(), updatedAt: now() });
      return { total, inPackage, extras, extrasCents: extras * g.extraPriceCents };
    }),

  exportSelection: (photographerId, galleryId) =>
    read((db) => {
      ownGallery(db, photographerId, galleryId);
      const photos = db.photos.filter((p) => p.galleryId === galleryId).sort((a, b) => a.position - b.position);
      const sel = new Map(db.selections.filter((s) => s.galleryId === galleryId).map((s) => [s.photoId, s]));
      return {
        basenames: photos.filter((p) => sel.get(p.id)?.selected).map((p) => p.basename),
        favorites: photos.filter((p) => sel.get(p.id)?.favorited).map((p) => p.basename),
      };
    }),

  listComments: (galleryId) =>
    read((db) => db.comments.filter((c) => c.galleryId === galleryId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))),

  addComment: (galleryId, input) =>
    write((db) => {
      const g = db.galleries.find((x) => x.id === galleryId);
      if (!g) throw new DataError("not_found");
      if (!g.allowComments) throw new DataError("comments_off");
      const body = input.body.trim();
      if (!body || body.length > 2000) throw new DataError("invalid");
      if (input.photoId && !db.photos.some((p) => p.id === input.photoId && p.galleryId === galleryId)) {
        throw new DataError("not_found");
      }
      const c: Comment = { id: randomUUID(), galleryId, photoId: input.photoId, author: input.author, body, createdAt: now() };
      db.comments.push(c);
      return c;
    }),
};
