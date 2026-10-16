import { a11y, db, expect, jpegs, login, noHorizontalScroll, outbox, readyGallery, test } from "./fixtures";
import type { Page } from "@playwright/test";

async function publish(page: Page, albumId: string, names: string[], note: string) {
  await page.goto(`/gerenciador/albuns/${albumId}`);
  await page.getByLabel(/Lâminas \(JPEG ou PNG/).setInputFiles(await jpegs(page, names));
  await page.getByLabel("Recado para o cliente (opcional)").fill(note);
  await page.getByRole("button", { name: /^Publicar versão/ }).click();
  await expect(page.getByText(/Versão \d publicada/)).toBeVisible({ timeout: 30_000 });
}

test.describe("F06 aprovação de álbum", () => {
  test("F06-H1 publicar, comentar num ponto, pedir ajustes, nova versão, aprovar", async ({ page, browser }) => {
    const email = await login(page);
    const { id: galleryId, token } = await readyGallery(page, { clientEmail: "album-cliente@teste.com" });

    await page.goto("/gerenciador/albuns");
    await a11y(page); // S09 lista
    await page.getByLabel("Galeria").selectOption(galleryId);
    await page.getByLabel("Nome do álbum").fill("Álbum 30x30");
    await page.getByRole("button", { name: "Criar álbum" }).click();
    await page.waitForURL(/\/gerenciador\/albuns\/[0-9a-f-]{36}$/);
    const albumId = page.url().split("/").pop()!;
    await a11y(page); // S09 álbum vazio
    await publish(page, albumId, ["01.jpg", "02.jpg", "03.jpg"], "Primeira diagramação");
    await expect(page.getByText("Esperando o cliente").first()).toBeVisible();
    expect(outbox().some((m) => m.to === "album-cliente@teste.com" && m.subject === "Álbum para revisar: Casamento Teste")).toBe(true);

    // cliente
    const c = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await c.goto(`/g/${token}`);
    await c.getByRole("link", { name: /Seu álbum está pronto para revisar/ }).click();
    await c.waitForURL("**/album");
    await expect(c.getByText("Recado do fotógrafo: Primeira diagramação", { exact: false })).toBeVisible();
    await a11y(c); // S17
    await noHorizontalScroll(c);
    await expect.poll(() => c.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))).toBe(true);
    const marker = c.getByRole("button", { name: "Marcar um ponto em Página 2" });
    await marker.scrollIntoViewIfNeeded();
    const box = (await marker.boundingBox())!;
    await c.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await c.getByLabel("Comentário neste ponto").fill("Trocar esta foto pela do beijo");
    await c.getByRole("button", { name: "Salvar comentário" }).click();
    await expect(c.getByText("Trocar esta foto pela do beijo")).toBeVisible();
    await c.getByRole("button", { name: "Comentar a lâmina toda" }).first().click();
    await c.getByLabel("Comentário sobre a lâmina toda").fill("Página 1 mais clara");
    await c.getByRole("button", { name: "Salvar comentário" }).click();
    await expect(c.getByText("Página 1 mais clara")).toBeVisible();
    // teclado: Enter no marcador abre comentário no centro
    await c.getByRole("button", { name: "Marcar um ponto em Página 3" }).focus();
    await c.keyboard.press("Enter");
    await c.getByLabel("Comentário neste ponto").fill("Centralizar");
    await c.keyboard.press("Tab");
    await c.keyboard.press("Enter");
    await expect(c.getByText("Centralizar")).toBeVisible();
    const pins = await db`select pos_x, pos_y from comments where album_spread_id is not null and gallery_id = ${galleryId} order by created_at`;
    expect(pins.map((r) => [r.pos_x === null ? null : Math.round(r.pos_x * 100), r.pos_y === null ? null : Math.round(r.pos_y * 100)]))
      .toEqual([[25, 50], [null, null], [50, 50]]);

    await c.getByRole("button", { name: "Pedir ajustes" }).click();
    await expect(c.getByText(/Você pediu ajustes/)).toBeVisible();
    await expect(c.getByRole("button", { name: /^Marcar um ponto/ })).toHaveCount(0);
    const [sp] = await db`select s.id from album_spreads s join album_versions v on v.id = s.version_id join albums a on a.id = v.album_id where a.id = ${albumId} limit 1`;
    const late = await c.request.post(`/api/g/${token}/album/comments`, { data: { spreadId: sp.id, x: null, y: null, body: "tarde" } });
    expect(late.status()).toBe(409);
    expect(outbox().some((m) => m.to === email && m.subject === "Ajustes no álbum: Casamento Teste")).toBe(true);

    // fotógrafo vê os pinos e publica a v2
    await page.goto(`/gerenciador/albuns/${albumId}`);
    await expect(page.getByText("Ajustes pedidos").first()).toBeVisible();
    await expect(page.getByText("Trocar esta foto pela do beijo")).toBeVisible();
    await publish(page, albumId, ["01.jpg", "02.jpg"], "Troquei a foto da página 2");

    await c.goto(`/g/${token}/album`);
    await expect(c.getByRole("heading", { name: /versão 2/ })).toBeVisible();
    await expect(c.getByText("Trocar esta foto pela do beijo")).toHaveCount(0); // só a versão nova
    await c.getByRole("button", { name: "Aprovar álbum" }).click();
    await c.getByRole("button", { name: "Sim, aprovar" }).click();
    await expect(c.getByText(/Você aprovou esta versão/)).toBeVisible();

    await page.goto(`/gerenciador/albuns/${albumId}`);
    await expect(page.getByText(/Versão 2 aprovada/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Publicar versão/ })).toHaveCount(0);
    await page.goto("/gerenciador/albuns");
    await expect(page.getByText("Aprovado")).toBeVisible();
  });

  test("F06-E1 pedir ajustes sem comentário fica desligado; outro fotógrafo não abre o álbum", async ({ page, browser }) => {
    await login(page);
    const { id: galleryId, token } = await readyGallery(page);
    await page.goto("/gerenciador/albuns");
    await page.getByLabel("Galeria").selectOption(galleryId);
    await page.getByRole("button", { name: "Criar álbum" }).click();
    await page.waitForURL(/\/gerenciador\/albuns\/[0-9a-f-]{36}$/);
    const albumId = page.url().split("/").pop()!;
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}/album`);
    await expect(c.getByText("O álbum ainda não está pronto.")).toBeVisible();
    await publish(page, albumId, ["01.jpg"], "");
    await c.reload();
    await expect(c.getByRole("button", { name: "Pedir ajustes" })).toBeDisabled();
    const other = await (await browser.newContext()).newPage();
    await login(other);
    expect((await other.goto(`/gerenciador/albuns/${albumId}`))?.status()).toBe(404);
    const r = await other.request.post(`/api/albums/${albumId}/uploads`, { data: { count: 1 } });
    expect(r.status()).toBe(404);
  });
});
