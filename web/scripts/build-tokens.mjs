// Gera src/styles/tokens.css a partir de replica/design/tokens.json.
// A fonte da verdade é o JSON: /replica-brand troca os valores lá e roda `npm run tokens`.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(resolve(root, "../replica/design/tokens.json"), "utf8"));

const lines = [];
for (const [k, v] of Object.entries(tokens.color)) lines.push(`  --c-${k}: ${v};`);
for (const [k, v] of Object.entries(tokens.font)) lines.push(`  --f-${k}: ${v};`);
for (const [k, v] of Object.entries(tokens.radius)) lines.push(`  --r-${k}: ${v}px;`);
for (const [k, v] of Object.entries(tokens.shadow)) lines.push(`  --s-${k}: ${v};`);
for (const [k, v] of Object.entries(tokens.motion)) lines.push(`  --m-${k}: ${v};`);
for (const [k, v] of Object.entries(tokens.type)) {
  lines.push(`  --t-${k}-size: ${v.size / 16}rem;`);
  lines.push(`  --t-${k}-line: ${v.line / 16}rem;`);
  lines.push(`  --t-${k}-weight: ${v.weight};`);
}
for (const [k, v] of Object.entries(tokens.layout)) {
  if (typeof v === "number") lines.push(`  --l-${k}: ${v}px;`);
}

const css = `/* GERADO por scripts/build-tokens.mjs a partir de replica/design/tokens.json. Não editar à mão. */\n:root {\n${lines.join("\n")}\n}\n`;
writeFileSync(resolve(root, "src/styles/tokens.css"), css);
console.log(`tokens.css: ${lines.length} variáveis`);
