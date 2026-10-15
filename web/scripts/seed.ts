// Dados de exemplo para desenvolvimento local (NÃO rode em produção).
// Cria demo@exemplo.com com uma galeria de 24 fotos geradas (SVG) no storage em disco.
import { randomUUID } from "node:crypto";
import { closeSql, sql } from "../src/lib/data/db";
import { pgData as data } from "../src/lib/data/postgres";
import { diskStorage } from "../src/lib/storage/disk";

if (process.env.NODE_ENV === "production") throw new Error("seed não roda em produção");

const tones = [["#d9c7b0", "#8c6f56"], ["#c9d3cf", "#55706a"], ["#e8d6cf", "#a3685c"], ["#d4cfe0", "#6b628a"], ["#efe3c8", "#b08a3c"], ["#cfd8e3", "#4f6a8a"]];
const svg = (i: number, w: number, h: number) => {
  const [a, b] = tones[i % tones.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="${h * 0.05}" fill="#fff" fill-opacity=".6">EXEMPLO DSC_${2000 + i}</text></svg>`;
};

const email = "demo@exemplo.com";
let p = await data.getPhotographerByEmail(email);
if (!p) {
  const [u] = await sql()<{ id: string }[]>`insert into auth.users (id, email) values (gen_random_uuid(), ${email}) returning id`;
  p = await data.ensurePhotographer(u.id, email, "Estúdio Demo");
  await data.updatePhotographer(p.id, { businessName: "Estúdio Demo Fotografia", pixKeyType: "email", pixKey: "pix@exemplo.com", pixMerchantName: "Estudio Demo", pixMerchantCity: "Sao Paulo" });
}
const g = await data.createGallery(p.id, {
  title: "Casamento Ana & Pedro", eventDate: "2026-10-10", clientName: "Ana Souza", clientEmail: "ana@exemplo.com",
  packageSize: 10, allowExtras: true, extraPriceCents: 2500, deadlineAt: new Date(Date.now() + 7 * 864e5).toISOString(),
  password: null, allowComments: true, watermarkOn: true,
});
const photos = [];
for (let i = 0; i < 24; i++) {
  const [w, h] = i % 5 === 3 ? [800, 1200] : [1200, 800];
  const stem = `g/${g.id}/${randomUUID()}`;
  await diskStorage.put(`${stem}-p.svg`, Buffer.from(svg(i, w, h)));
  await diskStorage.put(`${stem}-t.svg`, Buffer.from(svg(i, w / 3, h / 3)));
  photos.push({ originalFilename: `DSC_${2000 + i}.jpg`, previewKey: `${stem}-p.svg`, thumbKey: `${stem}-t.svg`, width: w, height: h, bytes: 0,
    folder: i < 8 ? "Making of" : i < 16 ? "Cerimônia" : "Festa" });
}
await data.addPhotos(p.id, g.id, photos);
await data.sendGallery(p.id, g.id);
console.log(`ok: entre com ${email}; link do cliente: /g/${g.accessToken}`);
await closeSql();
