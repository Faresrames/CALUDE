-- 0001: schema inicial (de replica/schema.sql, validado em Postgres 16)
-- Postgres (Supabase). Horários em timestamptz (UTC). Dinheiro em centavos + moeda.
-- Acesso: RLS para o fotógrafo (auth.uid() = photographer_id).
-- O cliente final NÃO tem conta: entra por token da galeria + senha opcional,
-- e só fala com o banco por rotas do servidor (service role) que conferem
-- o token em toda chamada. Por isso as tabelas não têm policy para "anon".

create extension if not exists pgcrypto;

-- updated_at automático
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── fotógrafo (tenant) ─────────────────────────
create table photographers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  business_name text,
  email text not null,
  phone text,
  locale text not null default 'pt-BR' check (locale in ('pt-BR','en','es')),
  logo_key text,
  watermark_text text,                      -- texto da marca d'água (padrão: nome do estúdio)
  watermark_key text,                       -- PNG da marca d'água (futuro)
  watermark_opacity int not null default 40 check (watermark_opacity between 0 and 100),
  watermark_position text not null default 'center'
    check (watermark_position in ('center','tiled','bottom-right')),
  pix_key text,                             -- para cobrança de extras (v1 manual)
  pix_key_type text check (pix_key_type in ('cpf','cnpj','email','phone','random')),
  pix_merchant_name text,
  pix_merchant_city text,
  storage_used_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger photographers_updated before update on photographers
  for each row execute function set_updated_at();

-- assinatura do SaaS (cobrança do fotógrafo)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null unique references photographers(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','starter','pro','studio')),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','canceled')),
  trial_ends_at timestamptz not null default now() + interval '14 days',
  current_period_end timestamptz,
  provider text check (provider in ('asaas','stripe')),
  provider_customer_id text,
  provider_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();

-- ───────────────────────── clientes ─────────────────────────
create table clients (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on clients (photographer_id, name);
create trigger clients_updated before update on clients
  for each row execute function set_updated_at();

-- ───────────────────────── galerias ─────────────────────────
create table galleries (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references photographers(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  event_date date,
  access_token text not null unique default encode(gen_random_bytes(18), 'base64'),
  password_hash text,                       -- null = sem senha
  package_size int not null default 0 check (package_size >= 0),
  allow_extras boolean not null default true,
  extra_price_cents int not null default 0 check (extra_price_cents >= 0),
  currency text not null default 'BRL',
  deadline_at timestamptz,
  allow_comments boolean not null default true,
  watermark_on boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft','sent','in_progress','submitted','expired','delivered','archived')),
  sent_at timestamptz,
  first_opened_at timestamptz,
  submitted_at timestamptz,
  photo_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on galleries (photographer_id, status, created_at desc);
create index on galleries (client_id);
create index on galleries (deadline_at) where status in ('sent','in_progress');
create trigger galleries_updated before update on galleries
  for each row execute function set_updated_at();

create table photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photographer_id uuid not null references photographers(id) on delete cascade,
  original_filename text not null,          -- "IMG_1234.CR3" -> usado no Lightroom
  basename text not null,                   -- "IMG_1234"
  folder text,                              -- momento: "Making of", "Cerimônia"...
  position int not null,
  preview_key text not null,                -- 1600px com marca d'água (gerado no navegador)
  thumb_key text not null,                  -- 400px
  final_key text,                           -- entrega final em alta (F07)
  width int, height int,
  bytes int not null default 0,
  photographer_pick boolean not null default false, -- favorita sugerida
  created_at timestamptz not null default now(),
  unique (gallery_id, basename)
);
create index on photos (gallery_id, position);
create index on photos (photographer_id);

-- ───────────────────────── seleção ─────────────────────────
create table selections (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  favorited boolean not null default false,
  selected boolean not null default true,   -- favoritar sem selecionar é permitido
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gallery_id, photo_id)
);
create index on selections (photo_id);
create trigger selections_updated before update on selections
  for each row execute function set_updated_at();
-- "pacote" x "extra" não é coluna: é derivado na finalização
-- (primeiras package_size = pacote, resto = extras). Evita corrida ao
-- desmarcar uma foto do meio.

create table comments (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_id uuid references photos(id) on delete cascade,
  album_spread_id uuid,                     -- FK adicionada abaixo
  pos_x real check (pos_x between 0 and 1), -- ponto na lâmina do álbum
  pos_y real check (pos_y between 0 and 1),
  author text not null check (author in ('client','photographer')),
  body text not null check (length(body) between 1 and 2000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index on comments (gallery_id, created_at);
create index on comments (photo_id);

-- ───────────────────────── extras / pagamento ─────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photographer_id uuid not null references photographers(id) on delete cascade,
  extras_count int not null check (extras_count > 0),
  unit_price_cents int not null,
  amount_cents int not null check (amount_cents = extras_count * unit_price_cents),
  currency text not null default 'BRL',
  method text not null check (method in ('pix_manual','pix','card')),
  status text not null default 'pending'
    check (status in ('pending','paid','expired','canceled','refunded')),
  pix_payload text,                         -- BR Code "copia e cola"
  provider text,
  provider_ref text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on orders (gallery_id);
create index on orders (photographer_id, status);
create unique index one_open_order_per_gallery on orders (gallery_id) where status = 'pending';
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

-- ───────────────────────── álbum ─────────────────────────
create table albums (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null unique references galleries(id) on delete cascade,
  photographer_id uuid not null references photographers(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
create index on albums (photographer_id);

create table album_versions (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  number int not null,
  status text not null default 'pending'
    check (status in ('pending','changes_requested','approved')),
  note text,                                -- "o que mudou" escrito pelo fotógrafo
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (album_id, number)
);

create table album_spreads (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references album_versions(id) on delete cascade,
  position int not null,
  image_key text not null,
  unique (version_id, position)
);

alter table comments add constraint comments_spread_fk
  foreign key (album_spread_id) references album_spreads(id) on delete cascade;
create index on comments (album_spread_id);
alter table comments add constraint comment_target
  check ((photo_id is not null)::int + (album_spread_id is not null)::int <= 1);

-- ───────────────────────── notificações ─────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  kind text not null check (kind in
    ('gallery_sent','reminder','deadline_tomorrow','submitted','order_paid','album_ready','delivered','expired')),
  channel text not null check (channel in ('email','whatsapp')),
  recipient text not null,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on notifications (gallery_id, kind);
-- no máximo um aviso do mesmo tipo por dia para a mesma pessoa (cron roda 2x)
create unique index notifications_once_a_day on notifications
  (gallery_id, kind, channel, recipient, ((created_at at time zone 'UTC')::date));

-- ───────────────────────── regras de negócio no banco ─────────────────────────

-- Não deixa selecionar em galeria travada (enviada, vencida, entregue).
create or replace function guard_gallery_open() returns trigger
language plpgsql as $$
declare g galleries;
begin
  select * into g from galleries where id = new.gallery_id for update;
  if g.status not in ('sent','in_progress') then
    raise exception 'gallery_locked';
  end if;
  if g.deadline_at is not null and g.deadline_at < now() then
    raise exception 'gallery_expired';
  end if;
  -- sem extras: não passa do pacote
  if not g.allow_extras and new.selected and
     (select count(*) from selections
       where gallery_id = g.id and selected and photo_id <> new.photo_id) >= g.package_size then
    raise exception 'package_full';
  end if;
  return new;
end $$;
create trigger selections_guard before insert or update on selections
  for each row execute function guard_gallery_open();

-- ───────────────────────── RLS (lado do fotógrafo) ─────────────────────────
alter table photographers   enable row level security;
alter table subscriptions   enable row level security;
alter table clients         enable row level security;
alter table galleries       enable row level security;
alter table photos          enable row level security;
alter table selections      enable row level security;
alter table comments        enable row level security;
alter table orders          enable row level security;
alter table albums          enable row level security;
alter table album_versions  enable row level security;
alter table album_spreads   enable row level security;
alter table notifications   enable row level security;

create policy own on photographers for all using (id = auth.uid()) with check (id = auth.uid());
create policy own_read on subscriptions for select using (photographer_id = auth.uid());
create policy own on clients   for all using (photographer_id = auth.uid()) with check (photographer_id = auth.uid());
create policy own on galleries for all using (photographer_id = auth.uid()) with check (photographer_id = auth.uid());
create policy own on photos    for all using (photographer_id = auth.uid()) with check (photographer_id = auth.uid());
create policy own on albums    for all using (photographer_id = auth.uid()) with check (photographer_id = auth.uid());
create policy own_read on orders for select using (photographer_id = auth.uid());
create policy own on selections for select using
  (exists (select 1 from galleries g where g.id = gallery_id and g.photographer_id = auth.uid()));
create policy own on comments for all using
  (exists (select 1 from galleries g where g.id = gallery_id and g.photographer_id = auth.uid()));
create policy own on notifications for select using
  (exists (select 1 from galleries g where g.id = gallery_id and g.photographer_id = auth.uid()));
create policy own on album_versions for all using
  (exists (select 1 from albums a where a.id = album_id and a.photographer_id = auth.uid()));
create policy own on album_spreads for all using
  (exists (select 1 from album_versions v join albums a on a.id = v.album_id
           where v.id = version_id and a.photographer_id = auth.uid()));

-- ───────────────────────── webhooks (idempotência) ─────────────────────────
create table webhook_events (
  id text primary key,                      -- "<provedor>:<id do evento>"
  provider text not null,
  type text not null,
  received_at timestamptz not null default now()
);
alter table webhook_events enable row level security; -- sem policy: só o servidor
