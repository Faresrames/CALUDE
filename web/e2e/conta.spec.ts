import { a11y, db, expect, login, test } from "./fixtures";

test.describe("Conta e plano", () => {
  test("C-H1 PIX validado; apagar conta pede confirmação e apaga tudo", async ({ page }) => {
    const email = await login(page);
    await page.goto("/gerenciador/configuracoes");
    await a11y(page); // S08
    await page.getByLabel("Tipo de chave").selectOption("cpf");
    await page.getByLabel("Chave PIX").fill("123");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Chave PIX inválida para o tipo escolhido.")).toBeVisible();
    await page.getByLabel(`Digite ${email} para confirmar`).fill("outro@x.com");
    await page.getByRole("button", { name: "Apagar minha conta" }).click();
    await expect(page.getByText("Digite o seu e-mail exatamente para confirmar.")).toBeVisible();
    await page.getByLabel(`Digite ${email} para confirmar`).fill(email);
    await page.getByRole("button", { name: "Apagar minha conta" }).click();
    await page.waitForURL("**/entrar");
    const [{ n }] = await db`select (select count(*) from photographers where email = ${email}) + (select count(*) from auth.users where email = ${email}) as n`;
    expect(Number(n)).toBe(0);
  });

  test("C-E1 teste grátis vencido bloqueia galeria nova", async ({ page }) => {
    const email = await login(page);
    await page.goto("/gerenciador/plano");
    await expect(page.getByText(/Teste grátis: 14 dias restantes/)).toBeVisible();
    await a11y(page); // S10
    await db`update subscriptions set trial_ends_at = now() - interval '1 day' where photographer_id = (select id from photographers where email = ${email})`;
    await page.goto("/gerenciador/galerias/nova");
    await page.getByLabel("Nome da galeria").fill("Bloqueada");
    await page.getByLabel("Nome do cliente").fill("Ana");
    await page.getByLabel("Preço por foto extra (R$)").fill("10");
    await page.getByRole("button", { name: "Criar e subir fotos" }).click();
    await expect(page.getByText(/teste grátis acabou/)).toBeVisible();
  });
});
