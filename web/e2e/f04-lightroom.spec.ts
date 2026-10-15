import { choose, expect, login, readyGallery, test } from "./fixtures";

test.describe("F04 lista para o Lightroom", () => {
  test("F04-H1 lista na ordem e CSV com favorita", async ({ page, browser, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await login(page);
    const { id, token } = await readyGallery(page, { packageSize: 3 });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    for (const n of ["IMG_5", "IMG_2", "IMG_3"]) await choose(c, n);
    await c.getByRole("button", { name: "Favoritar IMG_2" }).click();
    await c.getByRole("button", { name: "Tirar IMG_2 das favoritas" }).waitFor();
    await c.goto(`/g/${token}/revisar`);
    await c.getByRole("button", { name: "Enviar 3 fotos" }).click();
    await c.waitForURL("**/enviada");
    await page.goto(`/gerenciador/galerias/${id}`);
    await expect(page.getByLabel("Nomes das fotos escolhidas")).toHaveValue("IMG_2, IMG_3, IMG_5");
    await page.getByRole("button", { name: "Copiar 3 nomes" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("IMG_2, IMG_3, IMG_5");
    const csv = await (await page.request.get(`/api/galleries/${id}/export?format=csv`)).text();
    expect(csv.split("\n")).toEqual(["arquivo,favorita", "IMG_2,sim", "IMG_3,nao", "IMG_5,nao"]);
  });

  test("F04-E1 e F04-E2: nomes com vírgula, espaço, acento e '=' não quebram nem viram fórmula", async ({ page, browser }) => {
    await login(page);
    const names = ["Noiva, véu (1).jpg", "=1+1.jpg", "Ção.jpg"];
    const { id, token } = await readyGallery(page, { packageSize: 3, photos: names });
    const c = await (await browser.newContext()).newPage();
    await c.goto(`/g/${token}`);
    for (const n of names.map((x) => x.replace(/\.jpg$/, ""))) {
      await c.getByRole("button", { name: `Selecionar ${n}`, exact: true }).click();
      await c.getByRole("button", { name: `Desmarcar ${n}`, exact: true }).waitFor();
    }
    await c.goto(`/g/${token}/revisar`);
    await c.getByRole("button", { name: "Enviar 3 fotos" }).click();
    await c.waitForURL("**/enviada");
    const csv = await (await page.request.get(`/api/galleries/${id}/export?format=csv`)).text();
    const rows = csv.split("\n");
    expect(rows).toHaveLength(4);
    expect(rows).toContain('"Noiva, véu (1)",nao');
    expect(rows).toContain("'=1+1,nao");
    await page.goto(`/gerenciador/galerias/${id}`);
    await expect(page.getByText(/vírgula/)).toBeVisible(); // avisa que esse nome atrapalha o filtro do Lightroom
  });
});
