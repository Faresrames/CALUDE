// BR Code PIX estático (padrão EMV do Banco Central), com valor e identificador.
// O dinheiro vai direto para a chave do fotógrafo; a plataforma não intermedia.
import QRCode from "qrcode";

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT (poly 0x1021, início 0xFFFF), como pede o manual do BR Code. */
export function crc16(payload: string) {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Tira acento e caractere fora do padrão (nome e cidade aceitam só ASCII simples). */
const ascii = (s: string, max: number) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 .-]/g, "").trim().slice(0, max).trim();

/** Valida e põe a chave no formato que o PIX espera. null se inválida. */
export function normalizePixKey(type: PixKeyType, raw: string): string | null {
  const v = raw.trim();
  const digits = v.replace(/\D/g, "");
  switch (type) {
    case "cpf": return digits.length === 11 ? digits : null;
    case "cnpj": return digits.length === 14 ? digits : null;
    case "email": return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 77 ? v.toLowerCase() : null;
    case "phone": {
      const d = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
      return d.length === 12 || d.length === 13 ? `+${d}` : null;
    }
    case "random": return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v.toLowerCase() : null;
  }
}

export function pixPayload(o: { key: string; name: string; city: string; amountCents?: number; txid?: string; description?: string }) {
  const account = field("00", "br.gov.bcb.pix") + field("01", o.key) + (o.description ? field("02", ascii(o.description, 40)) : "");
  const txid = (o.txid ?? "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const body =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    (o.amountCents ? field("54", (o.amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", ascii(o.name, 25) || "RECEBEDOR") +
    field("60", ascii(o.city, 15) || "BRASIL") +
    field("62", field("05", txid)) +
    "6304";
  return body + crc16(body);
}

export async function pixQrSvg(payload: string) {
  return QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "M", margin: 1 });
}
