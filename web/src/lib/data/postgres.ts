// Camada de dados real (Postgres/Supabase). Toda função do fotógrafo filtra por
// photographer_id (autorização no código); a RLS do banco é a segunda trava.
// Regras de seleção (travada, vencida, pacote cheio) ficam no trigger do banco.
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import { sql } from "./db";
import {
  DataError,
  type Comment,
  type DataErrorCode,
  type DataLayer,
  type Gallery,
  type GallerySummary,
  type Order,
  type Photo,
  type Photographer,
  type Selection,
  type Subscription,
} from "./types";

const GALLERY = `g.id, g.photographer_id, g.client_id, g.title, g.event_date, g.access_token, g.password_hash,
  g.package_size, g.allow_extras, g.extra_price_cents, g.currency, g.deadline_at, g.allow_comments, g.watermark_on,
  case when g.status in ('sent','in_progress') and g.deadline_at < now() then 'expired' else g.status end as status,
  g.sent_at, g.first_opened_at, g.submitted_at, g.created_at, g.updated_at`;
const SUMMARY = `${GALLERY}, c.name as client_name, c.email as client_email,
  (select count(*) from photos p where p.gallery_id = g.id)::int as photo_count,
  (select count(*) from selections s where s.gallery_id = g.id and s.selected)::int as selected_count,
  (select p.thumb_key from photos p where p.gallery_id = g.id order by p.position limit 1) as cover_key`;
const PHOTOGRAPHER = `id, name, business_name, email, watermark_text, pix_key, pix_key_type, pix_merchant_name, pix_merchant_city, created_at`;
const PHOTO = `id, gallery_id, photographer_id, original_filename, basename, folder, position, preview_key, thumb_key, width, height, bytes, photographer_pick, created_at`;
const ORDER = `id, gallery_id, photographer_id, extras_count, unit_price_cents, amount_cents, currency, method, status, paid_at, created_at`;

const RULES: DataErrorCode[] = ["gallery_locked", "gallery_expired", "package_full"];

/** Converte erros do banco (raise do trigger, FK, check) em DataError. */
async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const err = e as { message?: string; code?: string };
    const rule = RULES.find((r) => err.message === r);
    if (rule) throw new DataError(rule);
    if (err.code === "23503") throw new DataError("not_found"); // FK
    if (err.code === "23514" || err.code === "22P02") throw new DataError("invalid"); // check / uuid inválido
    throw e;
  }
}

const basenameOf = (f: string) => f.replace(/\.[^.]+$/, "");
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const pgData: DataLayer = {
  async ensurePhotographer(id, email, name) {
    const db = sql();
    return db.begin(async (tx) => {
      const [p] = await tx<Photographer[]>`
        insert into photographers (id, name, email, watermark_text) values (${id}, ${name}, ${email.toLowerCase()}, ${name})
        on conflict (id) do update set email = excluded.email
        returning ${tx.unsafe(PHOTOGRAPHER)}`;
      await tx`insert into subscriptions (photographer_id) values (${id}) on conflict (photographer_id) do nothing`;
      return p;
    });
  },

  async getPhotographer(id) {
    if (!isUuid(id)) return null;
    const [p] = await sql()<Photographer[]>`select ${sql().unsafe(PHOTOGRAPHER)} from photographers where id = ${id}`;
    return p ?? null;
  },

  async getPhotographerByEmail(email) {
    const [p] = await sql()<Photographer[]>`select ${sql().unsafe(PHOTOGRAPHER)} from photographers where email = ${email.trim().toLowerCase()}`;
    return p ?? null;
  },

  async updatePhotographer(id, patch) {
    const cols: Record<string, unknown> = {};
    const map: Record<string, string> = {
      name: "name", businessName: "business_name", watermarkText: "watermark_text", pixKey: "pix_key",
      pixKeyType: "pix_key_type", pixMerchantName: "pix_merchant_name", pixMerchantCity: "pix_merchant_city",
    };
    for (const [k, v] of Object.entries(patch)) if (v !== undefined && map[k]) cols[map[k]] = v;
    if (!Object.keys(cols).length) return (await this.getPhotographer(id))!;
    return guard(async () => {
      const db = sql();
      const [p] = await db<Photographer[]>`update photographers set ${db(cols)} where id = ${id} returning ${db.unsafe(PHOTOGRAPHER)}`;
      if (!p) throw new DataError("not_found");
      return p;
    });
  },

  async deletePhotographer(id) {
    const db = sql();
    return db.begin(async (tx) => {
      const keys = await tx<{ k: string }[]>`
        select unnest(array[preview_key, thumb_key, final_key]) as k from photos where photographer_id = ${id}
        union all select logo_key from photographers where id = ${id}
        union all select watermark_key from photographers where id = ${id}`;
      await tx`delete from photographers where id = ${id}`; // cascade: tudo do fotógrafo
      return keys.map((r) => r.k).filter((k): k is string => !!k);
    });
  },

  async listGalleries(photographerId, opts = {}) {
    const db = sql();
    const q = opts.q?.trim() ? `%${opts.q.trim().replace(/[%_\\]/g, "\\$&")}%` : null;
    const rows = await db<GallerySummary[]>`
      select * from (
        select ${db.unsafe(SUMMARY)} from galleries g left join clients c on c.id = g.client_id
        where g.photographer_id = ${photographerId}
          and (${q}::text is null or g.title ilike ${q} or c.name ilike ${q})
      ) x
      where ${opts.status ?? null}::text is null and status <> 'archived' or status = ${opts.status ?? null}
      order by created_at desc`;
    return rows;
  },

  async createGallery(photographerId, input) {
    if (!input.title.trim() || input.packageSize < 0 || input.extraPriceCents < 0) throw new DataError("invalid");
    const db = sql();
    return guard(() => db.begin(async (tx) => {
      const [sub] = await tx<{ ok: boolean }[]>`
        select (status = 'active' or (status = 'trialing' and trial_ends_at > now())
                or (status = 'canceled' and current_period_end > now())) as ok -- cancelou: vale até o fim do mês pago
        from subscriptions where photographer_id = ${photographerId}`;
      if (!sub?.ok) throw new DataError("plan_inactive");
      const [c] = await tx<{ id: string }[]>`
        insert into clients (photographer_id, name, email) values (${photographerId}, ${input.clientName.trim()}, ${input.clientEmail?.trim() || null})
        returning id`;
      const [g] = await tx<Gallery[]>`
        insert into galleries ${tx({
          photographer_id: photographerId, client_id: c.id, title: input.title.trim(), event_date: input.eventDate,
          password_hash: input.password ? hashPassword(input.password) : null, package_size: input.packageSize,
          allow_extras: input.allowExtras, extra_price_cents: input.extraPriceCents, deadline_at: input.deadlineAt,
          allow_comments: input.allowComments, watermark_on: input.watermarkOn,
          access_token: randomUUID().replace(/-/g, "").slice(0, 24),
        })} returning id`;
      const [full] = await tx<Gallery[]>`select ${tx.unsafe(GALLERY)} from galleries g where g.id = ${g.id}`;
      return full;
    }));
  },

  async getGallery(photographerId, galleryId) {
    if (!isUuid(galleryId)) return null;
    const db = sql();
    const [g] = await db<GallerySummary[]>`
      select ${db.unsafe(SUMMARY)} from galleries g left join clients c on c.id = g.client_id
      where g.id = ${galleryId} and g.photographer_id = ${photographerId}`;
    return g ?? null;
  },

  async getGalleryByToken(token) {
    const db = sql();
    const [g] = await db<GallerySummary[]>`
      select ${db.unsafe(SUMMARY)} from galleries g left join clients c on c.id = g.client_id where g.access_token = ${token}`;
    return g ?? null;
  },

  async sendGallery(photographerId, galleryId) {
    const db = sql();
    return guard(async () => {
      const [g] = await db<Gallery[]>`
        update galleries g set status = case when status = 'draft' then 'sent' else status end,
          sent_at = coalesce(sent_at, now())
        where g.id = ${galleryId} and g.photographer_id = ${photographerId}
          and exists (select 1 from photos p where p.gallery_id = g.id)
        returning ${db.unsafe(GALLERY)}`;
      if (g) return g;
      const exists = await this.getGallery(photographerId, galleryId);
      throw exists ? new DataError("invalid", "Galeria sem fotos") : new DataError("not_found");
    });
  },

  async reopenGallery(photographerId, galleryId, deadlineAt) {
    const db = sql();
    const [g] = await db<Gallery[]>`
      update galleries g set status = 'in_progress', submitted_at = null, deadline_at = ${deadlineAt}
      where g.id = ${galleryId} and g.photographer_id = ${photographerId} and g.status <> 'draft'
      returning ${db.unsafe(GALLERY)}`;
    if (!g) throw new DataError("not_found");
    return g;
  },

  async updateDeadline(photographerId, galleryId, deadlineAt) {
    const db = sql();
    const [g] = await db<Gallery[]>`
      update galleries g set deadline_at = ${deadlineAt},
        status = case when status = 'expired' then 'in_progress' else status end
      where g.id = ${galleryId} and g.photographer_id = ${photographerId}
      returning ${db.unsafe(GALLERY)}`;
    if (!g) throw new DataError("not_found");
    return g;
  },

  async markOpened(galleryId) {
    await sql()`update galleries set first_opened_at = now() where id = ${galleryId} and first_opened_at is null`;
  },

  listPhotos: (galleryId) => sql()<Photo[]>`select ${sql().unsafe(PHOTO)} from photos where gallery_id = ${galleryId} order by position`,

  async existingBasenames(photographerId, galleryId) {
    const rows = await sql()<{ basename: string }[]>`
      select p.basename from photos p join galleries g on g.id = p.gallery_id
      where p.gallery_id = ${galleryId} and g.photographer_id = ${photographerId}`;
    if (!rows.length && !(await this.getGallery(photographerId, galleryId))) throw new DataError("not_found");
    return rows.map((r) => r.basename);
  },

  async addPhotos(photographerId, galleryId, inputs) {
    const db = sql();
    return guard(() => db.begin(async (tx): Promise<Photo[]> => {
      const [g] = await tx`select id from galleries where id = ${galleryId} and photographer_id = ${photographerId} for update`;
      if (!g) throw new DataError("not_found");
      const [{ max }] = await tx<{ max: number }[]>`select coalesce(max(position), 0)::int as max from photos where gallery_id = ${galleryId}`;
      // descarta repetidas (já na galeria ou no próprio lote) ANTES de numerar, para a posição não pular
      const seen = new Set((await tx<{ basename: string }[]>`select basename from photos where gallery_id = ${galleryId}`).map((r) => r.basename));
      const fresh = inputs.filter((i) => !seen.has(basenameOf(i.originalFilename)) && seen.add(basenameOf(i.originalFilename)));
      const rows = fresh.map((i, n) => ({
        gallery_id: galleryId, photographer_id: photographerId, original_filename: i.originalFilename,
        basename: basenameOf(i.originalFilename), folder: i.folder ?? null, position: max + n + 1,
        preview_key: i.previewKey, thumb_key: i.thumbKey, width: i.width, height: i.height, bytes: i.bytes,
      }));
      if (!rows.length) return [];
      const added = await tx<Photo[]>`
        insert into photos ${tx(rows)} on conflict (gallery_id, basename) do nothing returning ${tx.unsafe(PHOTO)}`;
      const bytes = added.reduce((s, p) => s + p.bytes, 0);
      await tx`update photographers set storage_used_bytes = storage_used_bytes + ${bytes} where id = ${photographerId}`;
      return [...added];
    }));
  },

  listSelections: (galleryId) => sql()<Selection[]>`
    select id, gallery_id, photo_id, selected, favorited, created_at, updated_at from selections where gallery_id = ${galleryId}`,

  async setSelection(galleryId, photoId, patch) {
    if (!isUuid(photoId)) throw new DataError("not_found");
    const db = sql();
    return guard(() => db.begin(async (tx) => {
      const [ph] = await tx`select 1 from photos where id = ${photoId} and gallery_id = ${galleryId}`;
      if (!ph) throw new DataError("not_found");
      const [s] = await tx<{ selected: boolean; favorited: boolean }[]>`
        insert into selections (gallery_id, photo_id, selected, favorited)
        values (${galleryId}, ${photoId}, ${patch.selected ?? false}, ${patch.favorited ?? false})
        on conflict (gallery_id, photo_id) do update set
          selected = coalesce(${patch.selected ?? null}::boolean, selections.selected),
          favorited = coalesce(${patch.favorited ?? null}::boolean, selections.favorited)
        returning selected, favorited`;
      await tx`update galleries set status = 'in_progress' where id = ${galleryId} and status = 'sent'`;
      const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from selections where gallery_id = ${galleryId} and selected`;
      return { count, selected: s.selected, favorited: s.favorited };
    }));
  },

  async submitSelection(galleryId) {
    const db = sql();
    return guard(() => db.begin(async (tx) => {
      const [g] = await tx<Gallery[]>`select ${tx.unsafe(GALLERY)} from galleries g where g.id = ${galleryId} for update`;
      if (!g) throw new DataError("not_found");
      if (g.status === "expired") throw new DataError("gallery_expired");
      if (g.status !== "sent" && g.status !== "in_progress") throw new DataError("gallery_locked");
      const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from selections where gallery_id = ${galleryId} and selected`;
      if (total === 0) throw new DataError("invalid", "Nenhuma foto selecionada");
      const inPackage = Math.min(total, g.packageSize);
      const extras = total - inPackage;
      await tx`update galleries set status = 'submitted', submitted_at = now() where id = ${galleryId}`;
      let order: Order | null = null;
      if (extras > 0 && g.extraPriceCents > 0) {
        await tx`update orders set status = 'canceled' where gallery_id = ${galleryId} and status = 'pending'`;
        [order] = await tx<Order[]>`
          insert into orders (gallery_id, photographer_id, extras_count, unit_price_cents, amount_cents, method)
          values (${galleryId}, ${g.photographerId}, ${extras}, ${g.extraPriceCents}, ${extras * g.extraPriceCents}, 'pix_manual')
          returning ${tx.unsafe(ORDER)}`;
      }
      return { total, inPackage, extras, extrasCents: extras * g.extraPriceCents, order };
    }));
  },

  async exportSelection(photographerId, galleryId) {
    if (!(await this.getGallery(photographerId, galleryId))) throw new DataError("not_found");
    const rows = await sql()<{ basename: string; selected: boolean; favorited: boolean }[]>`
      select p.basename, s.selected, s.favorited from photos p join selections s on s.photo_id = p.id
      where p.gallery_id = ${galleryId} order by p.position`;
    return { basenames: rows.filter((r) => r.selected).map((r) => r.basename), favorites: rows.filter((r) => r.favorited).map((r) => r.basename) };
  },

  async getOrderForGallery(galleryId) {
    const [o] = await sql()<Order[]>`
      select ${sql().unsafe(ORDER)} from orders where gallery_id = ${galleryId} and status <> 'canceled'
      order by created_at desc limit 1`;
    return o ?? null;
  },

  async confirmOrder(photographerId, orderId) {
    if (!isUuid(orderId)) throw new DataError("not_found");
    const db = sql();
    const [o] = await db<Order[]>`
      update orders set status = 'paid', paid_at = coalesce(paid_at, now())
      where id = ${orderId} and photographer_id = ${photographerId} and status in ('pending', 'expired', 'paid')
      returning ${db.unsafe(ORDER)}`;
    if (!o) throw new DataError("not_found");
    return o;
  },

  async expireStaleOrders(hours) {
    const r = await sql()`update orders set status = 'expired' where status = 'pending' and created_at < now() - make_interval(hours => ${hours})`;
    return r.count;
  },

  async getSubscription(photographerId) {
    const [s] = await sql()<Subscription[]>`
      select photographer_id, plan, status, trial_ends_at, current_period_end, provider, provider_customer_id, provider_subscription_id
      from subscriptions where photographer_id = ${photographerId}`;
    if (!s) throw new DataError("not_found");
    return s;
  },

  async linkSubscription(photographerId, plan, customerId, subscriptionId) {
    await sql()`
      update subscriptions set plan = ${plan}, provider = 'asaas', provider_customer_id = ${customerId}, provider_subscription_id = ${subscriptionId}
      where photographer_id = ${photographerId}`;
  },

  async updateSubscriptionByProvider(providerSubscriptionId, patch) {
    const cols: Record<string, unknown> = {};
    if (patch.status) cols.status = patch.status;
    if (patch.plan) cols.plan = patch.plan;
    if (patch.currentPeriodEnd !== undefined) cols.current_period_end = patch.currentPeriodEnd;
    if (!Object.keys(cols).length) return null;
    const db = sql();
    const [s] = await db<Subscription[]>`
      update subscriptions set ${db(cols)} where provider_subscription_id = ${providerSubscriptionId}
      returning photographer_id, plan, status, trial_ends_at, current_period_end, provider, provider_customer_id, provider_subscription_id`;
    return s ?? null;
  },

  async recordWebhookEvent(provider, eventId, type) {
    const r = await sql()`insert into webhook_events (id, provider, type) values (${`${provider}:${eventId}`}, ${provider}, ${type}) on conflict do nothing`;
    return r.count === 1;
  },

  async reminderTargets(now) {
    const db = sql();
    const at = now.toISOString();
    return db<import("./types").ReminderTarget[]>`
      select g.id as gallery_id, g.title, g.access_token, g.deadline_at, c.name as client_name, c.email as client_email,
        coalesce(p.business_name, p.name) as studio_name,
        case when g.deadline_at <= ${at}::timestamptz + interval '24 hours' then 'deadline_tomorrow' else 'reminder' end as kind
      from galleries g join clients c on c.id = g.client_id join photographers p on p.id = g.photographer_id
      where g.status in ('sent', 'in_progress') and c.email is not null
        and (g.deadline_at is null or g.deadline_at > ${at}::timestamptz)
        and (
          -- vence nas próximas 24h: avisa uma única vez
          (g.deadline_at <= ${at}::timestamptz + interval '24 hours'
            and not exists (select 1 from notifications n where n.gallery_id = g.id and n.kind = 'deadline_tomorrow' and n.sent_at is not null))
          or (
            -- lembrete geral: prazo em até 3 dias, ou não abriu o link há 5 dias; no máximo a cada 3 dias
            (g.deadline_at is null or g.deadline_at > ${at}::timestamptz + interval '24 hours')
            and (g.deadline_at <= ${at}::timestamptz + interval '3 days'
              or (g.first_opened_at is null and g.sent_at < ${at}::timestamptz - interval '5 days'))
            and not exists (select 1 from notifications n where n.gallery_id = g.id and n.kind = 'reminder' and n.sent_at > ${at}::timestamptz - interval '3 days')
          )
        )`;
  },

  async expireOverdueGalleries(now) {
    const db = sql();
    return db<import("./types").ExpiredGallery[]>`
      with up as (
        update galleries set status = 'expired'
        where status in ('sent', 'in_progress') and deadline_at < ${now.toISOString()}::timestamptz
        returning id, title, photographer_id, client_id
      )
      select up.id as gallery_id, up.title, p.email as photographer_email, c.name as client_name
      from up join photographers p on p.id = up.photographer_id left join clients c on c.id = up.client_id`;
  },

  async claimNotification(galleryId, kind, channel, recipient) {
    const [r] = await sql()<{ id: string }[]>`
      insert into notifications (gallery_id, kind, channel, recipient) values (${galleryId}, ${kind}, ${channel}, ${recipient})
      on conflict (gallery_id, kind, channel, recipient, ((created_at at time zone 'UTC')::date))
        do update set error = null where notifications.sent_at is null -- tentativa que falhou hoje: pode tentar de novo
      returning id`;
    return r?.id ?? null;
  },

  async finishNotification(id, error) {
    await sql()`update notifications set sent_at = case when ${error}::text is null then now() else null end, error = ${error} where id = ${id}`;
  },

  listComments: (galleryId) => sql()<Comment[]>`
    select id, gallery_id, photo_id, author, body, created_at from comments where gallery_id = ${galleryId} and album_spread_id is null order by created_at`,

  async addComment(galleryId, input) {
    const body = input.body.trim();
    if (!body || body.length > 2000) throw new DataError("invalid");
    const db = sql();
    return guard(async () => {
      const [g] = await db<{ allowComments: boolean }[]>`select allow_comments from galleries where id = ${galleryId}`;
      if (!g) throw new DataError("not_found");
      if (!g.allowComments) throw new DataError("comments_off");
      if (input.photoId) {
        if (!isUuid(input.photoId)) throw new DataError("not_found");
        const [p] = await db`select 1 from photos where id = ${input.photoId} and gallery_id = ${galleryId}`;
        if (!p) throw new DataError("not_found");
      }
      const [c] = await db<Comment[]>`
        insert into comments (gallery_id, photo_id, author, body) values (${galleryId}, ${input.photoId}, ${input.author}, ${body})
        returning id, gallery_id, photo_id, author, body, created_at`;
      return c;
    });
  },
};
