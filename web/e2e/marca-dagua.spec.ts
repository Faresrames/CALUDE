import { a11y, createGallery, db, expect, jpegs, login, test, upload } from "./fixtures";

test.describe("Marca d'água com logo", () => {
  test("logo PNG no canto, 100%: sai na foto enviada no lugar certo", async ({ page }) => {
    const email = await login(page);
    await page.goto("/gerenciador/configuracoes");
    await expect(page.getByRole("img", { name: "Prévia da marca d’água numa foto de exemplo" })).toBeVisible();
    await page.getByRole("radio", { name: "Logo (PNG)" }).check();
    // logo vermelho opaco 200x100
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas"); c.width = 200; c.height = 100;
      const x = c.getContext("2d")!; x.fillStyle = "rgb(255,0,0)"; x.fillRect(0, 0, 200, 100);
      return c.toDataURL("image/png").split(",")[1];
    });
    await page.getByLabel("Arquivo do logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    await expect(page.getByRole("button", { name: "Salvar marca d’água" })).toBeEnabled();
    await page.getByLabel(/Opacidade/).fill("100");
    await page.getByLabel("Posição").selectOption("bottom-right");
    await page.getByRole("button", { name: "Salvar marca d’água" }).click();
    await expect(page.getByText("Marca d’água salva.")).toBeVisible();
    await a11y(page);
    const [p] = await db`select watermark_key, watermark_opacity, watermark_position from photographers where email = ${email}`;
    expect(p.watermark_key).toMatch(/^w\/.+\.png$/);
    expect([p.watermark_opacity, p.watermark_position]).toEqual([100, "bottom-right"]);

    // PNG que não é PNG é recusado
    await page.getByLabel("Arquivo do logo").setInputFiles({ name: "logo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") });
    await expect(page.getByText(/Use um arquivo PNG/)).toBeVisible();

    // foto azul: o canto inferior direito tem que ficar vermelho, o resto azul
    const id = await createGallery(page);
    await expect(page.getByText("com o seu logo")).toBeVisible();
    const blue = await page.evaluate(() => {
      const c = document.createElement("canvas"); c.width = 1200; c.height = 800;
      const x = c.getContext("2d")!; x.fillStyle = "rgb(0,0,255)"; x.fillRect(0, 0, 1200, 800);
      return c.toDataURL("image/jpeg", 0.95).split(",")[1];
    });
    await upload(page, [{ name: "AZUL.jpg", mimeType: "image/jpeg", buffer: Buffer.from(blue, "base64") }]);
    await page.goto(`/gerenciador/galerias/${id}`);
    const src = await page.getByRole("button", { name: "Abrir AZUL" }).locator("img").getAttribute("src");
    const px = await page.evaluate(async (u) => {
      const img = new Image(); img.src = u!; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext("2d")!; x.drawImage(img, 0, 0);
      const at = (fx: number, fy: number) => [...x.getImageData(Math.round(fx * c.width), Math.round(fy * c.height), 1, 1).data.slice(0, 3)];
      return { corner: at(0.9, 0.9), topLeft: at(0.1, 0.1), center: at(0.5, 0.5) };
    }, src);
    expect(px.corner[0]).toBeGreaterThan(200); expect(px.corner[2]).toBeLessThan(60);   // vermelho
    expect(px.topLeft[2]).toBeGreaterThan(200); expect(px.topLeft[0]).toBeLessThan(60); // azul
    expect(px.center[2]).toBeGreaterThan(200);
  });

  test("texto continua funcionando como padrão", async ({ page }) => {
    await login(page, undefined, "Estúdio Texto");
    const id = await createGallery(page);
    await expect(page.getByText("com a marca “Estúdio Texto”")).toBeVisible();
    await upload(page, await jpegs(page, ["T.jpg"]));
    const [{ n }] = await db`select count(*)::int as n from photos where gallery_id = ${id}`;
    expect(n).toBe(1);
  });
});
