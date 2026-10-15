// Envia um aviso no máximo uma vez por dia por (galeria, tipo, pessoa).
// Falha fica registrada em notifications.error (a "fila de mortos") e não derruba quem chamou.
import { data, type NotificationKind } from "./data";
import { sendMail, type Mail } from "./mail";

export async function notify(galleryId: string, kind: NotificationKind, mail: Mail): Promise<"sent" | "skipped" | "failed"> {
  const id = await data.claimNotification(galleryId, kind, "email", mail.to);
  if (!id) return "skipped";
  try {
    await sendMail(mail);
    await data.finishNotification(id, null);
    return "sent";
  } catch (e) {
    console.error(`notify ${kind} ${galleryId}:`, (e as Error).message);
    await data.finishNotification(id, (e as Error).message.slice(0, 500));
    return "failed";
  }
}
