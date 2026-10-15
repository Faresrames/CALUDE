// Base de todas as specs: falha com erro no console ou resposta 5xx; helpers de login, galeria, banco e axe.
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { E2E_DB } from "../playwright.config";

export const db = postgres(E2E_DB, { max: 2, onnotice: () => {} });

type Guard = { allowConsole: RegExp[] };

export const test = base.extend<{ guard: Guard }>({
  guard: [async ({ page }, use) => {
    const guard: Guard = { allowConsole: [] };
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // respostas 4xx esperadas de API (o Chrome loga "Failed to load resource"): a spec confere o status por conta própria
      if (/Failed to load resource: the server responded with a status of 4\d\d/.test(t)) return;
      if (guard.allowConsole.some((r) => r.test(t))) return;
      problems.push(`console: ${t}`);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} em ${r.url()}`); });
    await use(guard);
    expect(problems, problems.join("\n")).toEqual([]);
  }, { auto: true }],
});
export { expect };

let n = 0;
export const uniq = (prefix: string) => `${prefix}${Date.now().toString(36)}${n++}`;

export async function login(page: Page, email = `${uniq("foto")}@teste.com`, name = "Estúdio Teste") {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Seu nome ou do estúdio").fill(name);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/gerenciador");
  return email;
}

type GalleryOpts = { title?: string; client?: string; clientEmail?: string; packageSize?: number; extras?: boolean; price?: string; password?: string; deadline?: string };

/** Cria a galeria pelo formulário; devolve o id. Fica na tela de envio. */
export async function createGallery(page: Page, o: GalleryOpts = {}) {
  await page.goto("/gerenciador/galerias/nova");
  await page.getByLabel("Nome da galeria").fill(o.title ?? "Casamento Teste");
  await page.getByLabel("Nome do cliente").fill(o.client ?? "Ana");
  if (o.clientEmail) await page.getByLabel("E-mail do cliente").fill(o.clientEmail);
  await page.getByLabel("Fotos no pacote").fill(String(o.packageSize ?? 4));
  if (o.extras === false) await page.getByRole("switch", { name: "Permitir fotos extras" }).click();
  else await page.getByLabel("Preço por foto extra (R$)").fill(o.price ?? "25,00");
  if (o.password) await page.getByLabel("Senha do link").fill(o.password);
  if (o.deadline) await page.getByLabel("Prazo para escolher").fill(o.deadline);
  await page.getByRole("button", { name: "Criar e subir fotos" }).click();
  await page.waitForURL("**/enviar");
  return page.url().split("/").at(-2)!;
}

/** JPEGs reais gerados no navegador. */
export async function jpegs(page: Page, names: string[]) {
  const data = await page.evaluate(async (count) => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const c = document.createElement("canvas"); c.width = 900; c.height = i % 3 === 0 ? 1200 : 600;
      const x = c.getContext("2d")!; x.fillStyle = `hsl(${i * 47},45%,55%)`; x.fillRect(0, 0, c.width, c.height);
      out.push(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    }
    return out;
  }, names.length);
  return names.map((name, i) => ({ name, mimeType: "image/jpeg", buffer: Buffer.from(data[i], "base64") }));
}

export async function upload(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) {
  await page.locator('input[type="file"]').setInputFiles(files);
  await page.getByRole("link", { name: "Continuar para a galeria" }).waitFor({ timeout: 60_000 });
}

/** Galeria pronta e liberada; devolve id e token do link do cliente. */
export async function readyGallery(page: Page, o: GalleryOpts & { photos?: string[] } = {}) {
  const id = await createGallery(page, o);
  await upload(page, await jpegs(page, o.photos ?? ["IMG_1.jpg", "IMG_2.jpg", "IMG_3.jpg", "IMG_4.jpg", "IMG_5.jpg", "IMG_6.jpg"]));
  await page.goto(`/gerenciador/galerias/${id}`);
  await page.getByRole("button", { name: "Liberar para o cliente" }).click();
  await page.getByRole("link", { name: "Ver como cliente" }).waitFor();
  const [g] = await db<{ accessToken: string }[]>`select access_token as "accessToken" from galleries where id = ${id}`;
  return { id, token: g.accessToken };
}

export async function choose(page: Page, name: string) {
  await page.getByRole("button", { name: `Selecionar ${name}` }).click();
  await page.getByRole("button", { name: `Desmarcar ${name}` }).waitFor();
}

export async function a11y(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")})`)).toEqual([]);
}

export async function noHorizontalScroll(page: Page) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(w).toBeLessThanOrEqual(page.viewportSize()!.width);
}

export function outbox(): { to: string; subject: string; text: string }[] {
  const f = ".data-e2e/outbox.jsonl";
  return existsSync(f) ? readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
}
