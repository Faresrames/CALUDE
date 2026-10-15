// Conexão única com o Postgres (Supabase em produção: use a URL do pooler, porta 6543).
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;
const g = globalThis as { __sql?: Sql };

const iso = (x: string) => new Date(x.includes("T") ? x : x.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")).toISOString();

export function sql(): Sql {
  if (g.__sql) return g.__sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definido. Veja web/.env.example.");
  g.__sql = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    prepare: false, // compatível com o pooler do Supabase (modo transação)
    transform: postgres.camel,
    onnotice: () => {},
    types: {
      // timestamptz/timestamp -> ISO UTC; date -> "YYYY-MM-DD" (sem virar Date com fuso)
      ts: { to: 1184, from: [1184, 1114], serialize: (x: string | Date) => (x instanceof Date ? x.toISOString() : x), parse: iso },
      day: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
      int8: { to: 20, from: [20], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
    },
  });
  return g.__sql;
}

export async function closeSql() {
  await g.__sql?.end();
  g.__sql = undefined;
}
