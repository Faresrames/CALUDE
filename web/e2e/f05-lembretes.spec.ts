import { db, expect, login, outbox, readyGallery, test } from "./fixtures";

test.describe("F05 lembretes de prazo", () => {
  test("F05-H1, F05-E1 e F05-N1: último dia vai uma vez; sem segredo é 401", async ({ page, request }) => {
    await login(page);
    const { id } = await readyGallery(page, { clientEmail: "lembrete@teste.com" });
    await db`update galleries set deadline_at = now() + interval '12 hours' where id = ${id}`;
    expect((await request.get("/api/cron/run")).status()).toBe(401);
    expect((await request.get("/api/cron/run", { headers: { authorization: "Bearer errado" } })).status()).toBe(401);
    const run = async () => (await request.get("/api/cron/run", { headers: { authorization: "Bearer e2e-cron" } })).json();
    await run();
    await run();
    const mails = outbox().filter((m) => m.to === "lembrete@teste.com" && m.subject.startsWith("Último dia"));
    expect(mails).toHaveLength(1);
    expect(mails[0].text).toContain("O que você já marcou continua salvo.");
  });
});
