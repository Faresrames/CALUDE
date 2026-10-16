import { a11y, expect, login, noHorizontalScroll, test } from "./fixtures";

test.describe("Lançamento: página de vendas, privacidade, termos, plano", () => {
  for (const [path, heading] of [["/", /não falha no dia que importa/], ["/privacidade", /Política de privacidade/], ["/termos", /Termos de uso/]] as const) {
    test(`${path} acessível e sem rolagem lateral no celular`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await a11y(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await noHorizontalScroll(page);
    });
  }

  test("botão leva ao cadastro; preços vêm dos planos reais; sem prova inventada", async ({ page }) => {
    await page.goto("/");
    for (const t of ["R$ 29,00", "R$ 59,00", "R$ 109,00", "5.000 fotos ativas"]) await expect(page.getByText(t).first()).toBeVisible();
    await expect(page.getByText(/depoimento|confiam|avaliação|estrelas|\+\d+ fotógrafos/i)).toHaveCount(0);
    await page.getByRole("link", { name: "Testar 14 dias grátis" }).first().click();
    await page.waitForURL("**/entrar");
  });

  test("tela de Plano mostra o uso de fotos e o ciclo anual", async ({ page }) => {
    await login(page);
    await page.goto("/gerenciador/plano");
    await expect(page.getByText("Você usa 0 de 30.000 fotos ativas.")).toBeVisible();
    await page.getByRole("radio", { name: "Anual (2 meses grátis)" }).check();
    await expect(page.getByText("R$ 590,00")).toBeVisible();
    await a11y(page);
  });
});

test("imagem social aponta para o endereço público e abre", async ({ page, request }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(/^http:\/\/localhost:3460\/opengraph-image/); // APP_URL do teste
  expect((await request.get(new URL(og!).pathname + new URL(og!).search)).status()).toBe(200);
});
