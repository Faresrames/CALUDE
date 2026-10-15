// Aplica db/migrations/*.sql em ordem, uma vez cada (tabela schema_migrations).
// Uso: DATABASE_URL=... npm run db:migrate
// No Supabase o esquema "auth" já existe. Num Postgres local puro, cria um
// esquema "auth" mínimo (tabela users + auth.uid()) só para as policies e a FK funcionarem.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definido");
  process.exit(1);
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
const dir = join(import.meta.dirname, "..", "db", "migrations");

try {
  const [{ exists }] = await sql`select exists(select 1 from pg_namespace where nspname = 'auth') as exists`;
  if (!exists) {
    console.log("! esquema auth ausente: criando versão LOCAL mínima (não use em produção)");
    await sql.unsafe(`
      create schema auth;
      create table auth.users (id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable
        as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    `);
  }
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const body = await readFile(join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${f})`;
    });
    console.log("✓", f);
  }
  console.log("migrações em dia");
} finally {
  await sql.end();
}
