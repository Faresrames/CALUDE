import { a11y, choose, db, expect, login, readyGallery, test } from "./fixtures";
import type { Page } from "@playwright/test";

const crc16 = (s: string) => {
  let c = 0xffff;
  for (const b of Buffer.from(s)) { c ^= b << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; }
  return c.toString(16).toUpperCase().padStart(4, "0");
};

async function setPix(page: Page) {
  await page.goto("/gerenciador/configuracoes");
  await page.getByLabel("Tipo de chave").selectOption("email");
  await page.getByLabel("Chave PIX").fill("pix@estudio.com");
  await page.getByLabel("Nome de quem recebe").fill("Estúdio Teste");
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Salvo." })).toBeVisible();
}

async function submitAll(c: Page, token: string, names: string[]) {
  await c.goto(`/g/${token}`);
  for (const n of names) await choose(c, n);
  await c.goto(`/g/${token}/revisar`);
  await c.getByRole("button", { name: `Enviar ${names.length} fotos` }).click();
  await c.waitForURL("**/enviada");
}

const SIX = ["IMG_1", "IMG_2", "IMG_3", "IMG_4", "IMG_5", "IMG_6"];

test.describe("F03 fotos extras e PIX", () => {
  test("F03-H1 caminho feliz: extras, QR válido, fotógrafo confirma, cliente vê", async ({ page, browser }) => {
    await login(page);
    await setPix(page);
    const { id, token } = await readyGallery(page, { packageSize: 4, price: "25,00" });
    const c = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await c.goto(`/g/${token}`);
    for (const n of SIX) await choose(c, n);
    await expect(c.getByText("+2 extras · R$ 50,00")).toBeVisible();
    await c.goto(`/g/${token}/revisar`);
    await expect(c.getByText("2 · R$ 50,00")).toBeVisible();
    await c.getByRole("button", { name: "Enviar 6 fotos" }).click();
    await c.getByRole("link", { name: "Ver pagamento" }).click();
    await expect(c.getByAltText("QR Code do PIX")).toBeVisible();
    await a11y(c); // S15
    const payload = await c.getByLabel("PIX copia e cola").inputValue();
    expect(payload).toContain("540550.00");
    expect(payload).toContain("pix@estudio.com");
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));

    await page.goto(`/gerenciador/galerias/${id}`);
    await page.getByRole("button", { name: "Confirmar que recebi" }).click();
    await expect(page.getByText("Pago", { exact: true })).toBeVisible();
    await c.reload();
    await expect(c.getByText("Pagamento confirmado")).toBeVisible();
  });

  test("F03-E1 fotógrafo sem chave PIX: cliente recebe aviso", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page, { packageSize: 4 });
    const c = await (await browser.newContext()).newPage();
    await submitAll(c, token, SIX);
    await c.goto(`/g/${token}/pagamento`);
    await expect(c.getByText(/ainda não cadastrou uma chave PIX/)).toBeVisible();
  });

  test("F03-E2 reabrir e enviar menos: pedido antigo cancelado, novo valor", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page, { packageSize: 4 });
    const c = await (await browser.newContext()).newPage();
    await submitAll(c, token, SIX);
    await page.goto(`/gerenciador/galerias/${id}`);
    await page.getByRole("button", { name: "Reabrir" }).click();
    await expect(page.getByText("Escolhendo")).toBeVisible();
    await c.goto(`/g/${token}`);
    await c.getByRole("button", { name: "Desmarcar IMG_6" }).click();
    await c.getByRole("button", { name: "Selecionar IMG_6" }).waitFor();
    await c.goto(`/g/${token}/revisar`);
    await c.getByRole("button", { name: "Enviar 5 fotos" }).click();
    await c.waitForURL("**/enviada");
    const orders = await db`select status, amount_cents from orders where gallery_id = ${id} order by created_at`;
    expect(orders.map((o) => `${o.status}:${o.amount_cents}`)).toEqual(["canceled:5000", "pending:2500"]);
  });

  test("F03-N1 sem extras: a foto além do pacote é recusada", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page, { packageSize: 2, extras: false });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    await choose(c, "IMG_1");
    await choose(c, "IMG_2");
    await c.getByRole("button", { name: "Selecionar IMG_3" }).click();
    await expect(c.getByText("O pacote está completo. Desmarque uma foto para escolher outra.")).toBeVisible();
    await expect(c.getByRole("button", { name: "Selecionar IMG_3" })).toBeVisible();
    const [{ n }] = await db`select count(*)::int as n from selections where gallery_id = ${id} and selected`;
    expect(n).toBe(2);
  });
});
