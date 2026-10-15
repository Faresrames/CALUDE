// Célula de CSV segura: aspas quando precisa (RFC 4180) e sem virar fórmula no Excel/Sheets
// (nome começando com = + - @ ganha um apóstrofo, como recomenda a OWASP).
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const csvRow = (cells: string[]) => cells.map(csvCell).join(",");
