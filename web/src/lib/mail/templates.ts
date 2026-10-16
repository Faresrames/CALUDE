// Textos dos e-mails (escritos do zero). Sempre com versão em texto puro.
import { formatBRL, formatDeadline } from "../format";
import type { Mail } from "./index";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// E-mail não usa as variáveis CSS do app; estes valores espelham os tokens (replica/design/tokens.json).
const C = { bg: "#fbfaf8", text: "#1c1a17", muted: "#625c53", accent: "#2b2926", onAccent: "#ffffff", line: "#e4e0d9" };

function layout(title: string, paragraphs: string[], cta?: { label: string; url: string }, footer?: string) {
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:${C.bg};font-family:Inter,Segoe UI,Arial,sans-serif;color:${C.text}">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;margin:0 0 16px">${esc(title)}</h1>
${paragraphs.map((p) => `<p style="font-size:16px;line-height:24px;margin:0 0 12px">${esc(p)}</p>`).join("")}
${cta ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:${C.accent};color:${C.onAccent};text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${esc(cta.label)}</a></p>
<p style="font-size:13px;color:${C.muted};margin:0 0 12px">Se o botão não abrir, copie: ${esc(cta.url)}</p>` : ""}
${footer ? `<hr style="border:none;border-top:1px solid ${C.line};margin:24px 0"><p style="font-size:13px;color:${C.muted};margin:0">${esc(footer)}</p>` : ""}
</div></body></html>`;
  const text = [title, "", ...paragraphs, ...(cta ? ["", `${cta.label}: ${cta.url}`] : []), ...(footer ? ["", footer] : [])].join("\n");
  return { html, text };
}

type G = { title: string; url: string; studio: string; clientName?: string | null; packageSize?: number; deadlineAt?: string | null };

export function gallerySentMail(to: string, g: G): Mail {
  const hello = g.clientName ? `Oi, ${g.clientName}!` : "Oi!";
  const body = layout(`Suas fotos chegaram`, [
    `${hello} ${g.studio} separou as fotos de “${g.title}” para você escolher.`,
    `Escolha ${g.packageSize} fotos para o seu pacote. Dá para fazer pelo celular, com calma: cada foto marcada fica salva na hora.`,
    ...(g.deadlineAt ? [`Prazo para escolher: ${formatDeadline(g.deadlineAt)}.`] : []),
  ], { label: "Escolher minhas fotos", url: g.url }, `Enviado por ${g.studio}. Responda este e-mail para falar com o fotógrafo.`);
  return { to, subject: `Escolha suas fotos: ${g.title}`, ...body };
}

export function reminderMail(to: string, g: G, kind: "reminder" | "deadline_tomorrow"): Mail {
  const last = kind === "deadline_tomorrow";
  const body = layout(last ? "Último dia para escolher" : "Suas fotos estão esperando", [
    last
      ? `O prazo para escolher as fotos de “${g.title}” termina em ${(g.deadlineAt ? formatDeadline(g.deadlineAt) : "")}.`
      : `Passando para lembrar das fotos de “${g.title}”.${g.deadlineAt ? ` O prazo vai até ${formatDeadline(g.deadlineAt)}.` : ""}`,
    "O que você já marcou continua salvo. É só abrir o link e continuar de onde parou.",
  ], { label: "Continuar a seleção", url: g.url }, `Enviado por ${g.studio}.`);
  return { to, subject: last ? `Último dia: fotos de ${g.title}` : `Lembrete: fotos de ${g.title}`, ...body };
}

export function submittedMail(to: string, g: { title: string; url: string; clientName: string | null; total: number; extras: number; extrasCents: number }): Mail {
  const body = layout("Seleção recebida", [
    `${g.clientName ?? "O cliente"} terminou a seleção de “${g.title}”: ${g.total} fotos.`,
    ...(g.extras ? [`${g.extras} são extras (${formatBRL(g.extrasCents)}). O cliente viu os dados do seu PIX; confirme no painel quando o pagamento cair.`] : []),
    "A lista com os nomes dos arquivos já está pronta para colar no Lightroom.",
  ], { label: "Abrir a galeria", url: g.url });
  return { to, subject: `Seleção recebida: ${g.title}`, ...body };
}

export function expiredMail(to: string, g: { title: string; url: string; clientName: string | null }): Mail {
  const body = layout("Prazo encerrado", [
    `O prazo de “${g.title}” terminou e ${g.clientName ?? "o cliente"} não enviou a seleção.`,
    "As escolhas feitas até agora estão salvas. Você pode estender o prazo no painel.",
  ], { label: "Abrir a galeria", url: g.url });
  return { to, subject: `Prazo encerrado: ${g.title}`, ...body };
}

export function orderPaidMail(to: string, g: { title: string; url: string; studio: string; amountCents: number }): Mail {
  const body = layout("Pagamento confirmado", [
    `${g.studio} confirmou o pagamento de ${formatBRL(g.amountCents)} pelas fotos extras de “${g.title}”. Obrigado!`,
  ], { label: "Ver minhas fotos", url: g.url }, `Enviado por ${g.studio}.`);
  return { to, subject: `Pagamento confirmado: ${g.title}`, ...body };
}

export function albumReadyMail(to: string, g: { title: string; url: string; studio: string; clientName: string | null; number: number; note: string | null }): Mail {
  const body = layout(g.number === 1 ? "Seu álbum está pronto para revisar" : `Nova versão do álbum (${g.number})`, [
    `${g.clientName ? `Oi, ${g.clientName}! ` : ""}${g.studio} mandou ${g.number === 1 ? "a diagramação" : "uma nova versão"} do álbum de “${g.title}”.`,
    ...(g.note ? [`Recado do fotógrafo: ${g.note}`] : []),
    "Toque em qualquer ponto de uma página para comentar ali. Quando estiver tudo certo, é só aprovar.",
  ], { label: "Revisar o álbum", url: g.url }, `Enviado por ${g.studio}.`);
  return { to, subject: `Álbum para revisar: ${g.title}`, ...body };
}

export function albumDecidedMail(to: string, g: { title: string; url: string; clientName: string | null; number: number; approved: boolean; comments: number }): Mail {
  const body = layout(g.approved ? "Álbum aprovado" : "Ajustes pedidos no álbum", [
    g.approved
      ? `${g.clientName ?? "O cliente"} aprovou a versão ${g.number} do álbum de “${g.title}”. Pode mandar para a gráfica.`
      : `${g.clientName ?? "O cliente"} pediu ajustes na versão ${g.number} do álbum de “${g.title}”, com ${g.comments} ${g.comments === 1 ? "comentário" : "comentários"}.`,
  ], { label: "Abrir o álbum", url: g.url });
  return { to, subject: `${g.approved ? "Álbum aprovado" : "Ajustes no álbum"}: ${g.title}`, ...body };
}
