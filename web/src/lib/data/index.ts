// Ponto único de acesso aos dados. Hoje: camada falsa em arquivo.
// /replica-backend troca esta linha pela implementação Supabase.
export { fakeData as data } from "./fake";
export * from "./types";
