import { a11y, createGallery, db, expect, jpegs, login, noHorizontalScroll, outbox, readyGallery, test, upload } from "./fixtures";

test.describe("F01 fotógrafo cria e envia a galeria", () => {
  test("F01-H1 caminho feliz: criar, subir, liberar, e-mail ao cliente", async ({ page }) => {
    await page.goto("/gerenciador");
    await expect(page).toHaveURL(/\/entrar$/);
    await a11y(page); // S01
    await login(page);
    await expect(page.getByText("Nenhuma galeria ainda")).toBeVisible();
    await a11y(page); // S02 vazio
    await page.getByRole("link", { name: "Nova galeria" }).first().click();
    await a11y(page); // S03
    const id = await createGallery(page, { clientEmail: "cliente-h1@teste.com" });
    await a11y(page); // S04
    await upload(page, await jpegs(page, ["IMG_1.jpg", "IMG_2.jpg", "IMG_3.jpg", "IMG_4.jpg", "IMG_5.jpg", "IMG_6.jpg"]));
    await expect(page.getByRole("status").filter({ hasText: "6 de 6 enviadas" })).toBeVisible();
    await page.getByRole("link", { name: "Continuar para a galeria" }).click();
    await page.getByRole("button", { name: "Liberar para o cliente" }).click();
    await expect(page.getByText("Aguardando cliente")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copiar link" })).toBeVisible();
    await a11y(page); // S05
    const [g] = await db`select access_token from galleries where id = ${id}`;
    const mail = outbox().find((m) => m.to === "cliente-h1@teste.com");
    expect(mail?.subject).toBe("Escolha suas fotos: Casamento Teste");
    expect(mail?.text).toContain(`/g/${g.access_token}`);
    await page.goto("/gerenciador");
    await a11y(page); // S02 com galeria
  });

  test("F01-E1 campos vazios: erros e nada criado", async ({ page }) => {
    const email = await login(page);
    await page.goto("/gerenciador/galerias/nova");
    await page.getByLabel("Fotos no pacote").fill("");
    await page.getByRole("button", { name: "Criar e subir fotos" }).click();
    await expect(page.getByText("Dê um nome para a galeria.")).toBeVisible();
    await expect(page.getByText("Quem vai escolher as fotos?")).toBeVisible();
    await expect(page.getByText("Um número entre 1 e 5000.")).toBeVisible();
    await a11y(page);
    const [{ n }] = await db`select count(*)::int as n from galleries g join photographers p on p.id = g.photographer_id where p.email = ${email}`;
    expect(n).toBe(0);
  });

  test("F01-E2 título de 120 caracteres com emoji e acentos, também no celular", async ({ page }) => {
    await login(page);
    const title = ("Casamento 💍 Conceição & João — " + "x".repeat(200)).slice(0, 120);
    const id = await createGallery(page, { title });
    const [g] = await db`select title from galleries where id = ${id}`;
    expect(g.title).toBe(title);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/gerenciador", `/gerenciador/galerias/${id}`, `/gerenciador/galerias/${id}/enviar`]) {
      await page.goto(path);
      await noHorizontalScroll(page);
    }
  });

  test("F01-E3 duplo clique em Criar gera uma galeria só", async ({ page }) => {
    const email = await login(page);
    await page.goto("/gerenciador/galerias/nova");
    await page.getByLabel("Nome da galeria").fill("Duplo clique");
    await page.getByLabel("Nome do cliente").fill("Ana");
    await page.getByLabel("Preço por foto extra (R$)").fill("25");
    await page.getByRole("button", { name: "Criar e subir fotos" }).dblclick();
    await page.waitForURL("**/enviar");
    await page.waitForTimeout(1000);
    const [{ n }] = await db`select count(*)::int as n from galleries g join photographers p on p.id = g.photographer_id where p.email = ${email}`;
    expect(n).toBe(1);
  });

  test("F01-E4 e F01-E5: reenvio pula repetidas; RAW e HEIC recusados", async ({ page }) => {
    await login(page);
    const id = await createGallery(page);
    const files = await jpegs(page, ["A.jpg", "B.jpg"]);
    await upload(page, [...files, { name: "C.CR3", mimeType: "application/octet-stream", buffer: Buffer.from("raw") },
      { name: "D.HEIC", mimeType: "image/heic", buffer: Buffer.from("heic") }]);
    await expect(page.getByText("Use JPEG ou PNG")).toHaveCount(2);
    await page.reload();
    await upload(page, files);
    const [{ n }] = await db`select count(*)::int as n from photos where gallery_id = ${id}`;
    expect(n).toBe(2);
  });

  test("F01-E6 sessão expirada no meio do envio: pede para entrar de novo", async ({ page, context }) => {
    await login(page);
    const id = await createGallery(page);
    await context.clearCookies();
    await page.locator('input[type="file"]').setInputFiles(await jpegs(page, ["X.jpg"]));
    await expect(page.getByText(/entre de novo/i).first()).toBeVisible({ timeout: 20_000 });
    const [{ n }] = await db`select count(*)::int as n from photos where gallery_id = ${id}`;
    expect(n).toBe(0);
  });

  test("F01-E7 galeria vazia não pode ser liberada", async ({ page }) => {
    await login(page);
    const id = await createGallery(page);
    await page.goto(`/gerenciador/galerias/${id}`);
    await expect(page.getByRole("button", { name: "Liberar para o cliente" })).toBeDisabled();
    await expect(page.getByText("Suba as fotos antes de liberar.")).toBeVisible();
  });

  test("F01-E8 outro fotógrafo não vê a galeria nem pela API", async ({ page, browser }) => {
    await login(page);
    const { id } = await readyGallery(page);
    const other = await (await browser.newContext()).newPage();
    await login(other);
    const res = await other.goto(`/gerenciador/galerias/${id}`);
    expect(res?.status()).toBe(404);
    for (const [method, path] of [["GET", "export"], ["POST", "send"], ["POST", "uploads"], ["POST", "reopen"]] as const) {
      const r = await other.request.fetch(`/api/galleries/${id}/${path}`, { method, data: path === "uploads" ? { files: [{ name: "x.jpg" }] } : {} });
      expect(r.status(), path).toBe(404);
    }
    await other.close();
  });

  test("F01-E9 criar galeria só com o teclado", async ({ page }) => {
    await login(page);
    await page.goto("/gerenciador/galerias/nova");
    // só Tab, digitar e Enter (o campo de data tem 3 paradas no Chrome: dia, mês, ano)
    const tabTo = async (label: string) => {
      for (let i = 0; i < 30; i++) {
        const name = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          return el?.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent ?? el.textContent : el?.textContent ?? null;
        });
        if (name?.trim() === label) return;
        await page.keyboard.press("Tab");
      }
      throw new Error(`Tab não chegou em ${label}`);
    };
    await tabTo("Nome da galeria");
    await page.keyboard.type("Teclado");
    await tabTo("Nome do cliente");
    await page.keyboard.type("Bia");
    await tabTo("Preço por foto extra (R$)");
    await page.keyboard.type("10");
    await tabTo("Criar e subir fotos");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/enviar");
  });

  test("F01-N1 e F01-N2: prazo no passado e preço inválido recusados", async ({ page }) => {
    await login(page);
    await page.goto("/gerenciador/galerias/nova");
    await page.getByLabel("Nome da galeria").fill("Prazo");
    await page.getByLabel("Nome do cliente").fill("Ana");
    await page.getByLabel("Preço por foto extra (R$)").fill("abc");
    await page.getByLabel("Prazo para escolher").fill("2020-01-01");
    await page.getByRole("button", { name: "Criar e subir fotos" }).click();
    await expect(page.getByText("Escolha uma data a partir de hoje.")).toBeVisible();
    await expect(page.getByText(/Informe o valor de cada foto extra/)).toBeVisible();
  });
});

