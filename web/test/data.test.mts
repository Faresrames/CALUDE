// Testes de integração da camada de dados num Postgres de verdade.
// Uso: TEST_DATABASE_URL=postgres://postgres@localhost:54330/app_test npm test
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { after, before, describe, test } from "node:test";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Defina TEST_DATABASE_URL (um banco descartável: ele é apagado)");
process.env.DATABASE_URL = url;

const { sql, closeSql } = await import("../src/lib/data/db");
const { pgData: data } = await import("../src/lib/data/postgres");
const { DataError } = await import("../src/lib/data/types");
const { applyAsaasEvent } = await import("../src/lib/billing/webhook");

const code = async (p: Promise<unknown>) => {
  try { await p; return "ok"; } catch (e) { if (e instanceof DataError) return e.code; throw e; }
};

async function photographer(email: string) {
  const [u] = await sql()<{ id: string }[]>`insert into auth.users (id, email) values (gen_random_uuid(), ${email}) returning id`;
  return data.ensurePhotographer(u.id, email, email.split("@")[0]);
}

const base = {
  title: "Casamento", eventDate: "2026-10-10", clientName: "Ana", clientEmail: "ana@x.com", packageSize: 2, allowExtras: true,
  extraPriceCents: 2500, deadlineAt: null, password: null, allowComments: true, watermarkOn: true,
};
const photos = (n: number, prefix = "IMG") =>
  Array.from({ length: n }, (_, i) => ({ originalFilename: `${prefix}_${i}.jpg`, previewKey: `k/${prefix}${i}p`, thumbKey: `k/${prefix}${i}t`, width: 10, height: 10, bytes: 100 }));

async function sentGallery(pid: string, over: Partial<typeof base> = {}, n = 4) {
  const g = await data.createGallery(pid, { ...base, ...over });
  await data.addPhotos(pid, g.id, photos(n));
  await data.sendGallery(pid, g.id);
  return { g, ph: await data.listPhotos(g.id) };
}

before(async () => {
  await sql().unsafe(`drop schema public cascade; create schema public; drop schema if exists auth cascade;`);
  execFileSync("node", ["scripts/migrate.mjs"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
});
after(closeSql);

describe("fotógrafo e plano", () => {
  test("primeiro login cria perfil e teste de 14 dias; segundo não duplica", async () => {
    const p = await photographer("a@x.com");
    const again = await data.ensurePhotographer(p.id, "a@x.com", "outro nome");
    assert.equal(again.name, p.name);
    const s = await data.getSubscription(p.id);
    assert.equal(s.status, "trialing");
    const days = (new Date(s.trialEndsAt).getTime() - Date.now()) / 864e5;
    assert.ok(days > 13.9 && days <= 14);
  });

  test("teste vencido bloqueia galeria nova; cancelado vale até o fim do mês pago", async () => {
    const p = await photographer("plano@x.com");
    await sql()`update subscriptions set trial_ends_at = now() - interval '1 day' where photographer_id = ${p.id}`;
    assert.equal(await code(data.createGallery(p.id, base)), "plan_inactive");
    await sql()`update subscriptions set status = 'canceled', current_period_end = now() + interval '10 days' where photographer_id = ${p.id}`;
    assert.equal(await code(data.createGallery(p.id, base)), "ok");
    await sql()`update subscriptions set current_period_end = now() - interval '1 day' where photographer_id = ${p.id}`;
    assert.equal(await code(data.createGallery(p.id, base)), "plan_inactive");
  });
});

describe("isolamento entre fotógrafos", () => {
  test("outro fotógrafo não vê nem mexe", async () => {
    const a = await photographer("dono@x.com");
    const b = await photographer("intruso@x.com");
    const { g } = await sentGallery(a.id);
    assert.equal(await data.getGallery(b.id, g.id), null);
    assert.equal((await data.listGalleries(b.id)).length, 0);
    assert.equal(await code(data.exportSelection(b.id, g.id)), "not_found");
    assert.equal(await code(data.existingBasenames(b.id, g.id)), "not_found");
    assert.equal(await code(data.addPhotos(b.id, g.id, photos(1, "X"))), "not_found");
    assert.equal(await code(data.reopenGallery(b.id, g.id, null)), "not_found");
    assert.equal(await code(data.sendGallery(b.id, g.id)), "not_found");
    assert.equal(await data.getGallery(a.id, "nao-e-uuid"), null);
  });

  test("RLS: com a sessão de outro usuário o banco devolve zero linhas", async () => {
    const a = await photographer("rls-a@x.com");
    const b = await photographer("rls-b@x.com");
    await sentGallery(a.id);
    await sql().unsafe(`do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
      grant usage on schema public, auth to authenticated; grant select on all tables in schema public to authenticated;
      grant execute on function auth.uid() to authenticated;`);
    const count = async (uid: string) => sql().begin(async (tx) => {
      await tx`select set_config('request.jwt.claim.sub', ${uid}, true)`;
      await tx`set local role authenticated`;
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from galleries`;
      return n;
    });
    assert.equal(await count(b.id), 0);
    assert.ok((await count(a.id)) >= 1);
  });
});

describe("fotos e seleção", () => {
  test("nomes repetidos são pulados e a posição continua", async () => {
    const p = await photographer("fotos@x.com");
    const g = await data.createGallery(p.id, base);
    assert.equal((await data.addPhotos(p.id, g.id, photos(3))).length, 3);
    const again = await data.addPhotos(p.id, g.id, [...photos(3), ...photos(2, "NEW")]);
    assert.deepEqual(again.map((x) => x.basename), ["NEW_0", "NEW_1"]);
    assert.deepEqual((await data.listPhotos(g.id)).map((x) => x.position), [1, 2, 3, 4, 5]);
    assert.equal(await code(data.sendGallery(p.id, (await data.createGallery(p.id, base)).id)), "invalid"); // sem fotos
  });

  test("rascunho não aceita seleção; enviada vira 'escolhendo' no primeiro clique", async () => {
    const p = await photographer("sel@x.com");
    const draft = await data.createGallery(p.id, base);
    await data.addPhotos(p.id, draft.id, photos(1));
    const [d0] = await data.listPhotos(draft.id);
    assert.equal(await code(data.setSelection(draft.id, d0.id, { selected: true })), "gallery_locked");
    const { g, ph } = await sentGallery(p.id);
    const r = await data.setSelection(g.id, ph[0].id, { favorited: true });
    assert.deepEqual(r, { count: 0, selected: false, favorited: true });
    assert.equal((await data.getGallery(p.id, g.id))!.status, "in_progress");
    assert.equal((await data.setSelection(g.id, ph[0].id, { selected: true })).favorited, true); // não perde a favorita
    assert.equal(await code(data.setSelection(g.id, "00000000-0000-0000-0000-000000000000", { selected: true })), "not_found");
  });

  test("sem extras: pacote cheio é recusado, mesmo com dois cliques ao mesmo tempo", async () => {
    const p = await photographer("cheio@x.com");
    const { g, ph } = await sentGallery(p.id, { allowExtras: false, packageSize: 1 });
    const results = await Promise.all(ph.map((x) => code(data.setSelection(g.id, x.id, { selected: true }))));
    assert.equal(results.filter((r) => r === "ok").length, 1);
    assert.equal(results.filter((r) => r === "package_full").length, ph.length - 1);
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from selections where gallery_id = ${g.id} and selected`;
    assert.equal(n, 1);
  });

  test("enviar com extras cria o pedido; depois trava; reabrir e reenviar troca o pedido", async () => {
    const p = await photographer("extras@x.com");
    const { g, ph } = await sentGallery(p.id);
    assert.equal(await code(data.submitSelection(g.id)), "invalid"); // nada escolhido
    for (const x of ph) await data.setSelection(g.id, x.id, { selected: true });
    const r = await data.submitSelection(g.id);
    assert.equal(r.total, 4); assert.equal(r.extras, 2); assert.equal(r.extrasCents, 5000);
    assert.equal(r.order?.amountCents, 5000); assert.equal(r.order?.status, "pending");
    assert.equal(await code(data.setSelection(g.id, ph[0].id, { selected: false })), "gallery_locked");
    assert.equal(await code(data.submitSelection(g.id)), "gallery_locked");
    await data.reopenGallery(p.id, g.id, null);
    await data.setSelection(g.id, ph[0].id, { selected: false });
    const r2 = await data.submitSelection(g.id);
    assert.equal(r2.order?.amountCents, 2500);
    const orders = await sql()<{ status: string }[]>`select status from orders where gallery_id = ${g.id} order by created_at`;
    assert.deepEqual(orders.map((o) => o.status), ["canceled", "pending"]);
    const paid = await data.confirmOrder(p.id, r2.order!.id);
    assert.equal(paid.status, "paid");
    const other = await photographer("nao-dono@x.com");
    assert.equal(await code(data.confirmOrder(other.id, r2.order!.id)), "not_found");
    const exp = await data.exportSelection(p.id, g.id);
    assert.deepEqual(exp.basenames, ["IMG_1", "IMG_2", "IMG_3"]);
  });

  test("prazo vencido: lê como vencida, recusa clique, cron marca uma vez e avisa", async () => {
    const p = await photographer("prazo@x.com");
    const { g, ph } = await sentGallery(p.id);
    await sql()`update galleries set deadline_at = now() - interval '1 minute' where id = ${g.id}`;
    assert.equal((await data.getGalleryByToken(g.accessToken))!.status, "expired");
    assert.equal(await code(data.setSelection(g.id, ph[0].id, { selected: true })), "gallery_expired");
    const first = await data.expireOverdueGalleries(new Date());
    assert.ok(first.some((x) => x.galleryId === g.id && x.photographerEmail === "prazo@x.com"));
    assert.ok(!(await data.expireOverdueGalleries(new Date())).some((x) => x.galleryId === g.id));
    await data.updateDeadline(p.id, g.id, new Date(Date.now() + 864e5).toISOString());
    assert.equal((await data.getGallery(p.id, g.id))!.status, "in_progress");
  });
});

describe("avisos", () => {
  test("lembrete com prazo em 2 dias; 'último dia' com prazo em 12h; sem duplicar", async () => {
    const p = await photographer("lembra@x.com");
    const { g: g2 } = await sentGallery(p.id, { deadlineAt: new Date(Date.now() + 2 * 864e5).toISOString() });
    const { g: g12 } = await sentGallery(p.id, { deadlineAt: new Date(Date.now() + 12 * 36e5).toISOString() });
    const { g: far } = await sentGallery(p.id, { deadlineAt: new Date(Date.now() + 20 * 864e5).toISOString() });
    const t = await data.reminderTargets(new Date());
    const kind = (id: string) => t.find((x) => x.galleryId === id)?.kind;
    assert.equal(kind(g2.id), "reminder");
    assert.equal(kind(g12.id), "deadline_tomorrow");
    assert.equal(kind(far.id), undefined);

    const id = await data.claimNotification(g2.id, "reminder", "email", "ana@x.com");
    assert.ok(id);
    await data.finishNotification(id!, "Resend 500");
    const retry = await data.claimNotification(g2.id, "reminder", "email", "ana@x.com");
    assert.equal(retry, id); // falhou: pode tentar de novo no mesmo dia
    await data.finishNotification(retry!, null);
    assert.equal(await data.claimNotification(g2.id, "reminder", "email", "ana@x.com"), null);
    assert.equal((await data.reminderTargets(new Date())).some((x) => x.galleryId === g2.id), false);
  });
});

describe("webhook do Asaas", () => {
  test("ativa, atrasa, cancela; evento repetido não reaplica", async () => {
    const p = await photographer("asaas@x.com");
    await data.linkSubscription(p.id, "pro", "cus_1", "sub_1");
    const paid = { id: "evt_1", event: "PAYMENT_RECEIVED", payment: { id: "pay_1", subscription: "sub_1", dueDate: "2026-10-15" } };
    assert.equal(await applyAsaasEvent(paid), "applied");
    const s = await data.getSubscription(p.id);
    assert.equal(s.status, "active"); assert.equal(s.plan, "pro");
    assert.equal(s.currentPeriodEnd?.slice(0, 10), "2026-11-15");
    assert.equal(await applyAsaasEvent({ id: "evt_2", event: "PAYMENT_OVERDUE", payment: { id: "pay_2", subscription: "sub_1" } }), "applied");
    assert.equal(await applyAsaasEvent(paid), "duplicate");
    assert.equal((await data.getSubscription(p.id)).status, "past_due");
    assert.equal(await applyAsaasEvent({ id: "evt_3", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_1" } }), "applied");
    assert.equal((await data.getSubscription(p.id)).status, "canceled");
    assert.equal(await applyAsaasEvent({ id: "evt_4", event: "PAYMENT_RECEIVED", payment: { id: "pay_x" } }), "ignored");
    assert.equal(await applyAsaasEvent({ id: "evt_5", event: "PAYMENT_RECEIVED", payment: { id: "p", subscription: "sub_de_outro_sistema" } }), "ignored");
  });
});

describe("apagar conta", () => {
  test("apaga tudo em cascata e devolve as chaves dos arquivos", async () => {
    const p = await photographer("sai@x.com");
    const { g, ph } = await sentGallery(p.id, {}, 2);
    await data.setSelection(g.id, ph[0].id, { selected: true });
    const keys = await data.deletePhotographer(p.id);
    assert.deepEqual(keys.sort(), ["k/IMG0p", "k/IMG0t", "k/IMG1p", "k/IMG1t"]);
    for (const t of ["galleries", "photos", "selections", "clients", "subscriptions"]) {
      const [{ n }] = await sql().unsafe(`select count(*)::int as n from ${t} where ${t === "selections" ? "gallery_id" : t === "galleries" || t === "photos" || t === "clients" || t === "subscriptions" ? "photographer_id" : "id"} = $1`, [t === "selections" ? g.id : p.id]);
      assert.equal(n, 0, t);
    }
  });
});

describe("álbum", () => {
  const spreads = (n: number, v: number) => Array.from({ length: n }, (_, i) => ({ imageKey: `a/v${v}s${i}.jpg`, width: 2000, height: 1000 }));

  test("versões, comentário no ponto, pedir ajuste, nova versão, aprovar; trava depois", async () => {
    const p = await photographer("album@x.com");
    const { g } = await sentGallery(p.id);
    const { id: albumId } = await data.createAlbum(p.id, g.id, "Álbum 30x30");
    assert.equal(await code(data.createAlbum(p.id, g.id, "outro")), "invalid"); // um por galeria
    assert.equal((await data.getAlbumForGallery(g.id))?.versions.length, 0);

    const v1 = await data.addAlbumVersion(p.id, albumId, { note: "Primeira diagramação", spreads: spreads(3, 1) });
    assert.equal(v1.number, 1); assert.equal(v1.status, "pending"); assert.deepEqual(v1.spreads.map((s) => s.position), [1, 2, 3]);
    const c = await data.addSpreadComment(g.id, v1.spreads[1].id, { x: 0.25, y: 0.5, body: "Trocar esta foto" });
    assert.equal(c.x, 0.25); assert.equal(c.y, 0.5);
    await data.addSpreadComment(g.id, v1.spreads[0].id, { x: null, y: null, body: "Lâmina toda mais clara" });
    assert.equal(await code(data.addSpreadComment(g.id, v1.spreads[0].id, { x: 1.5, y: 0.2, body: "fora" })), "invalid");
    assert.equal(await code(data.addSpreadComment(g.id, v1.spreads[0].id, { x: 0.5, y: null, body: "meio ponto" })), "invalid");
    await data.decideAlbumVersion(g.id, v1.id, "changes_requested");
    assert.equal(await code(data.addSpreadComment(g.id, v1.spreads[0].id, { x: null, y: null, body: "tarde" })), "album_locked");
    assert.equal(await code(data.decideAlbumVersion(g.id, v1.id, "approved")), "album_locked");

    const v2 = await data.addAlbumVersion(p.id, albumId, { note: "Ajustes da v1", spreads: spreads(3, 2) });
    assert.equal(v2.number, 2);
    const forClient = await data.getAlbumForGallery(g.id);
    assert.deepEqual(forClient?.versions.map((v) => v.number), [2]); // cliente vê só a mais nova
    await data.decideAlbumVersion(g.id, v2.id, "approved");
    const full = await data.getAlbum(p.id, albumId);
    assert.deepEqual(full?.versions.map((v) => `${v.number}:${v.status}`), ["2:approved", "1:changes_requested"]);
    assert.equal(full?.versions[1].spreads[1].comments[0].body, "Trocar esta foto");
    const list = await data.listAlbums(p.id);
    assert.deepEqual(list.map((a) => a.latest), [{ number: 2, status: "approved" }]);
  });

  test("isolamento: outro fotógrafo e outra galeria não mexem no álbum", async () => {
    const a = await photographer("album-a@x.com");
    const b = await photographer("album-b@x.com");
    const { g } = await sentGallery(a.id);
    const { g: other } = await sentGallery(b.id);
    const { id } = await data.createAlbum(a.id, g.id, "Álbum");
    assert.equal(await code(data.createAlbum(b.id, g.id, "roubo")), "not_found");
    assert.equal(await data.getAlbum(b.id, id), null);
    assert.equal(await code(data.addAlbumVersion(b.id, id, { note: null, spreads: spreads(1, 9) })), "not_found");
    const v = await data.addAlbumVersion(a.id, id, { note: null, spreads: spreads(1, 1) });
    assert.equal(await code(data.addSpreadComment(other.id, v.spreads[0].id, { x: null, y: null, body: "x" })), "not_found");
    assert.equal(await code(data.decideAlbumVersion(other.id, v.id, "approved")), "not_found");
    const keys = await data.deletePhotographer(a.id);
    assert.ok(keys.includes("a/v1s0.jpg")); // lâminas entram na limpeza do storage
  });
});

describe("marca d'água", () => {
  test("guarda imagem, opacidade e posição; recusa valores fora do lugar", async () => {
    const p = await photographer("marca@x.com");
    assert.equal(p.watermarkOpacity, 40); assert.equal(p.watermarkPosition, "tiled");
    const u = await data.updatePhotographer(p.id, { watermarkKey: "w/logo.png", watermarkOpacity: 70, watermarkPosition: "bottom-right" });
    assert.equal(u.watermarkKey, "w/logo.png"); assert.equal(u.watermarkOpacity, 70); assert.equal(u.watermarkPosition, "bottom-right");
    assert.equal(await code(data.updatePhotographer(p.id, { watermarkOpacity: 150 })), "invalid");
    assert.equal(await code(data.updatePhotographer(p.id, { watermarkPosition: "topo" as never })), "invalid");
  });
});
