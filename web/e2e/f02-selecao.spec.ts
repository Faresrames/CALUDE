import type { Page } from "@playwright/test";
import { a11y, choose, createGallery, db, expect, login, noHorizontalScroll, outbox, readyGallery, test } from "./fixtures";

async function counterText(page: Page) {
  return (await page.getByRole("status").filter({ hasText: "fotos do pacote" }).innerText()).split("\n")[0];
}

test.describe("F02 cliente escolhe as fotos", () => {
  test("F02-H1 caminho feliz: escolher, revisar, enviar; fotógrafo avisado", async ({ page, browser }) => {
    const email = await login(page);
    const { id, token } = await readyGallery(page, { packageSize: 4 });
    const c = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await c.goto(`/g/${token}`);
    await a11y(c); // S12
    for (const n of ["IMG_1", "IMG_2", "IMG_3", "IMG_4"]) await choose(c, n);
    expect(await counterText(c)).toBe("4 de 4 fotos do pacote");
    await c.getByRole("button", { name: "Abrir IMG_2" }).click();
    await expect(c.getByRole("dialog")).toBeVisible();
    await a11y(c); // S13
    await c.keyboard.press("Escape");
    await c.getByRole("link", { name: "Revisar e enviar" }).click();
    await a11y(c); // S14
    await c.getByRole("button", { name: "Enviar 4 fotos" }).click();
    await expect(c.getByRole("heading", { name: "Seleção enviada!" })).toBeVisible();
    await a11y(c); // S16
    await c.goto(`/g/${token}`);
    await expect(c.getByText("Sua seleção já foi enviada")).toBeVisible();
    await expect(c.getByRole("button", { name: /^Selecionar / })).toHaveCount(0);
    const [g] = await db`select status from galleries where id = ${id}`;
    expect(g.status).toBe("submitted");
    expect(outbox().some((m) => m.to === email && m.subject === "Seleção recebida: Casamento Teste")).toBe(true);
  });

  test("F02-E1 duplo clique no mesmo círculo: tela e servidor terminam iguais", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page);
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    for (let i = 0; i < 3; i++) {
      await c.getByRole("button", { name: /^(Selecionar|Desmarcar) IMG_1$/ }).dblclick();
      await c.getByRole("button", { name: /^(Selecionar|Desmarcar) IMG_1$/ }).click();
    }
    await c.waitForTimeout(1500);
    const uiSelected = (await c.getByRole("button", { name: /^(Selecionar|Desmarcar) IMG_1$/ }).getAttribute("aria-pressed")) === "true";
    const [s] = await db`select coalesce(bool_or(s.selected), false) as sel from photos p left join selections s on s.photo_id = p.id where p.gallery_id = ${id} and p.basename = 'IMG_1'`;
    expect(uiSelected).toBe(s.sel);
    const [{ n }] = await db`select count(*)::int as n from selections where gallery_id = ${id} and selected`;
    expect(await counterText(c)).toBe(`${n} de 4 fotos do pacote`);
  });

  test("F02-E2 duas abas ao mesmo tempo: contador certo nas duas", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page);
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    const b = await ctx.newPage();
    await a.goto(`/g/${token}`);
    await b.goto(`/g/${token}`);
    await choose(a, "IMG_1");
    await choose(a, "IMG_2");
    await choose(b, "IMG_3");
    expect(await counterText(b)).toBe("3 de 4 fotos do pacote");
    await b.reload();
    await expect(b.getByRole("button", { name: "Desmarcar IMG_1" })).toBeVisible();
  });

  test("F02-E3 sem internet: volta ao estado anterior e avisa", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page);
    const ctx = await browser.newContext();
    const c = await ctx.newPage();
    await c.goto(`/g/${token}`);
    await ctx.setOffline(true);
    await c.getByRole("button", { name: "Selecionar IMG_1" }).click();
    await expect(c.getByText(/Sem conexão/)).toBeVisible();
    await expect(c.getByRole("button", { name: "Selecionar IMG_1" })).toBeVisible();
    await ctx.setOffline(false);
  });

  test("F02-E4 e F02-E5: recarregar e voltar da revisão mantêm a seleção", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page);
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    for (const n of ["IMG_1", "IMG_2", "IMG_3"]) await choose(c, n);
    await c.reload();
    expect(await counterText(c)).toBe("3 de 4 fotos do pacote");
    await c.getByRole("link", { name: "Revisar e enviar" }).click();
    await c.waitForURL("**/revisar");
    await c.goBack();
    await expect(c.getByRole("button", { name: "Desmarcar IMG_3" })).toBeVisible();
    expect(await counterText(c)).toBe("3 de 4 fotos do pacote");
  });

  test("F02-E6 prazo vence com a página aberta: clique recusado com a mensagem do prazo", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page);
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    await db`update galleries set deadline_at = now() - interval '1 minute' where id = ${id}`;
    await c.getByRole("button", { name: "Selecionar IMG_1" }).click();
    await expect(c.getByText(/prazo para escolher terminou/i)).toBeVisible();
    await expect(c.getByRole("button", { name: "Selecionar IMG_1" })).toBeVisible();
  });

  test("F02-E7 duplo clique em Enviar: um envio só", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page, { packageSize: 2 });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    for (const n of ["IMG_1", "IMG_2", "IMG_3"]) await choose(c, n);
    await c.goto(`/g/${token}/revisar`);
    await c.getByRole("button", { name: "Enviar 3 fotos" }).dblclick();
    await expect(c.getByRole("heading", { name: "Seleção enviada!" })).toBeVisible();
    const [{ n }] = await db`select count(*)::int as n from orders where gallery_id = ${id}`;
    expect(n).toBe(1);
  });

  test("F02-E8 e F02-E9: comentário com emoji, acento e HTML aparece como texto; longo é recusado", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page);
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    await c.getByRole("button", { name: "Abrir IMG_1" }).click();
    const text = "Linda! 😍 Ção <b>oi</b><img src=x onerror=alert(1)>";
    await c.getByLabel("Escrever comentário").fill(text);
    await c.getByRole("button", { name: "Enviar" }).click();
    await expect(c.getByRole("dialog").getByText(text, { exact: true })).toBeVisible();
    await expect(c.locator("b", { hasText: "oi" })).toHaveCount(0);
    const r = await c.request.post(`/api/g/${token}/comments`, { data: { photoId: null, body: "x".repeat(2001) } });
    expect(r.status()).toBe(400);
  });

  test("F02-E10 cliente em outro fuso: prazo mostrado sem ambiguidade", async ({ page, browser }) => {
    await login(page);
    const tomorrow = new Date(Date.now() + 2 * 864e5).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const { token } = await readyGallery(page, { deadline: tomorrow });
    const c = await (await browser.newContext({ timezoneId: "America/Manaus" })).newPage();
    await c.goto(`/g/${token}`);
    await expect(c.getByText(/Prazo: .*23:59.*Brasília/)).toBeVisible();
  });

  test("F02-E11 escolher e enviar só com o teclado", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page, { packageSize: 1 });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    let label: string | null = null;
    for (let i = 0; i < 40 && !label?.startsWith("Selecionar "); i++) {
      await c.keyboard.press("Tab");
      label = await c.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? null);
    }
    await c.keyboard.press("Enter");
    await c.getByRole("button", { name: label!.replace("Selecionar", "Desmarcar") }).waitFor();
    await c.getByRole("link", { name: "Revisar e enviar" }).focus();
    await c.keyboard.press("Enter");
    await c.waitForURL("**/revisar");
    await c.getByRole("button", { name: "Enviar 1 foto" }).focus();
    await c.keyboard.press("Enter");
    await expect(c.getByRole("heading", { name: "Seleção enviada!" })).toBeVisible();
  });

  test("F02-E12 celular: nenhuma tela do cliente rola para o lado", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page, { title: "Casamento com um nome bem comprido para testar a quebra de linha 💍" });
    const c = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    for (const path of [`/g/${token}`, `/g/${token}/revisar`]) {
      await c.goto(path);
      await noHorizontalScroll(c);
    }
  });

  test("F02-N1 e F02-N2: link inexistente e galeria em rascunho dão 404", async ({ page }) => {
    expect((await page.goto("/g/naoexiste123"))?.status()).toBe(404);
    await login(page);
    const id = await createGallery(page);
    const [g] = await db`select access_token from galleries where id = ${id}`;
    expect((await page.goto(`/g/${g.access_token}`))?.status()).toBe(404);
  });

  test("F02-N3 senha errada e limite de tentativas", async ({ page, browser }) => {
    await login(page);
    const { token } = await readyGallery(page, { password: "1234" });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    await a11y(c); // S11
    expect((await c.request.get(`/api/g/${token}/comments`)).status()).toBe(404);
    await c.getByLabel("Senha da galeria").fill("errada");
    await c.getByRole("button", { name: "Ver as fotos" }).click();
    await expect(c.getByText("Senha incorreta.")).toBeVisible();
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await c.request.post(`/api/g/${token}/unlock`, { data: { password: "x" } })).status());
    expect(codes.slice(0, 4)).toEqual([401, 401, 401, 401]);
    expect(codes[4]).toBe(429);
  });

  test("F02-N4 mexer depois de enviar: 409 com mensagem", async ({ page, browser }) => {
    await login(page);
    const { id, token } = await readyGallery(page);
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    await choose(c, "IMG_1");
    await c.goto(`/g/${token}/revisar`);
    await c.getByRole("button", { name: "Enviar 1 foto" }).click();
    await c.waitForURL("**/enviada");
    const [p] = await db`select id from photos where gallery_id = ${id} and basename = 'IMG_1'`;
    const r = await c.request.put(`/api/g/${token}/selections/${p.id}`, { data: { selected: false } });
    expect(r.status()).toBe(409);
    expect((await r.json()).message).toMatch(/já foi enviada/);
  });
});
