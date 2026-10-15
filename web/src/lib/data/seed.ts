// Dados de exemplo para o modo demonstração. Fotos são SVGs gerados aqui.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FakeDb } from "./fake";

export const DEMO_EMAIL = "demo@exemplo.com";

const tones = [
  ["#d9c7b0", "#8c6f56"], ["#c9d3cf", "#55706a"], ["#e8d6cf", "#a3685c"], ["#d4cfe0", "#6b628a"],
  ["#efe3c8", "#b08a3c"], ["#cfd8e3", "#4f6a8a"], ["#e2d4d9", "#8a5268"], ["#d7dcc8", "#6c7a45"],
];

function svg(i: number, w: number, h: number) {
  const [a, b] = tones[i % tones.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * (0.3 + (i % 3) * 0.2)}" cy="${h * 0.45}" r="${h * 0.22}" fill="#fff" fill-opacity=".18"/><text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="${h * 0.05}" fill="#fff" fill-opacity=".6">EXEMPLO · DSC_${2000 + i}</text></svg>`;
}

export async function seed(): Promise<FakeDb> {
  const dir = join(process.cwd(), ".data", "storage");
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const photographerId = randomUUID();
  const clientId = randomUUID();
  const galleryId = randomUUID();
  const db: FakeDb = {
    photographers: [
      { id: photographerId, name: "Estúdio Demo", businessName: "Estúdio Demo Fotografia", email: DEMO_EMAIL,
        watermarkText: "Estúdio Demo", createdAt: iso(now) },
    ],
    clients: [
      { id: clientId, photographerId, name: "Ana Souza", email: "ana@exemplo.com", phone: null, createdAt: iso(now) },
    ],
    galleries: [
      {
        id: galleryId, photographerId, clientId, title: "Casamento Ana & Pedro", eventDate: "2026-10-10",
        accessToken: "demo-ana-pedro", passwordHash: null, packageSize: 10, allowExtras: true, extraPriceCents: 2500,
        currency: "BRL", deadlineAt: iso(new Date(now.getTime() + 7 * 864e5)), allowComments: true, watermarkOn: true,
        status: "sent", sentAt: iso(now), firstOpenedAt: null, submittedAt: null, createdAt: iso(now), updatedAt: iso(now),
      },
    ],
    photos: [],
    selections: [],
    comments: [],
  };
  await mkdir(join(dir, "seed"), { recursive: true });
  for (let i = 0; i < 24; i++) {
    const [w, h] = i % 5 === 3 ? [800, 1200] : [1200, 800];
    const preview = `seed/${galleryId}-${i}-p.svg`;
    const thumb = `seed/${galleryId}-${i}-t.svg`;
    await writeFile(join(dir, preview), svg(i, w, h));
    await writeFile(join(dir, thumb), svg(i, w / 3, h / 3));
    db.photos.push({
      id: randomUUID(), galleryId, photographerId, originalFilename: `DSC_${2000 + i}.jpg`, basename: `DSC_${2000 + i}`,
      folder: i < 8 ? "Making of" : i < 16 ? "Cerimônia" : "Festa", position: i + 1, previewKey: preview, thumbKey: thumb,
      width: w, height: h, bytes: 0, photographerPick: i === 4 || i === 13, createdAt: iso(now),
    });
  }
  return db;
}
