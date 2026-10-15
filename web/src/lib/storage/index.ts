// Arquivos das fotos. Produção: Cloudflare R2 (API S3) com URLs assinadas.
// Desenvolvimento: disco (web/.data/storage) imitando as mesmas URLs assinadas.
import { env } from "../env";
import { diskStorage } from "./disk";
import { r2Storage } from "./r2";

export type Storage = {
  /** URL para o navegador enviar (PUT) o arquivo direto, válida por 15 min. */
  uploadUrl(key: string, contentType: string): Promise<string>;
  /** URL para ver o arquivo, válida por 1 h. */
  viewUrl(key: string): Promise<string>;
  delete(keys: string[]): Promise<void>;
};

export const storage: Storage = new Proxy({} as Storage, {
  get: (_t, prop: keyof Storage) => (env.storage === "r2" ? r2Storage() : diskStorage)[prop],
});

/** Várias URLs de uma vez, na mesma ordem. */
export const viewUrls = (keys: string[]) => Promise.all(keys.map((k) => storage.viewUrl(k)));
