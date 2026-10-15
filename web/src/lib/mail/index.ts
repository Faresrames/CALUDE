// Envio de e-mail. Produção: Resend (API oficial). Desenvolvimento: grava em web/.data/outbox.jsonl.
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "../env";
import { DATA_DIR } from "../storage/disk";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendMail(m: Mail): Promise<void> {
  if (env.mail === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  const dir = DATA_DIR;
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, "outbox.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...m }) + "\n");
}
