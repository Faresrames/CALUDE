export const TZ = "America/Sao_Paulo";

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "25", "25,5", "25,50", "1.250,00" -> centavos. null se inválido. */
export function parseBRL(input: string): number | null {
  const s = input.trim().replace(/^R\$\s*/, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function formatDate(isoOrDate: string | null, withTime = false) {
  if (!isoOrDate) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? new Date(`${isoOrDate}T12:00:00Z`) : new Date(isoOrDate);
  return d.toLocaleString("pt-BR", {
    timeZone: TZ, day: "2-digit", month: "2-digit", year: withTime ? undefined : "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Prazo para o cliente: sempre com o fuso escrito, porque ele pode estar em outro estado ou país. */
export function formatDeadline(iso: string) {
  return `${formatDate(iso, true)} (horário de Brasília)`;
}

function offsetMinutes(at: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at).map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUTC - at.getTime()) / 60000;
}

/** "2026-10-20" -> ISO UTC de 23:59:59 desse dia em Brasília (sem assumir o fuso fixo). */
export function endOfDayInTZ(date: string, tz = TZ): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const guess = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 23, 59, 59));
  return new Date(guess.getTime() - offsetMinutes(guess, tz) * 60000).toISOString();
}

/** ISO UTC -> "YYYY-MM-DD" no fuso, para preencher <input type="date">. */
export function dateInputValue(iso: string | null, tz = TZ) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
}
