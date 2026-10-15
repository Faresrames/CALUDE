import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell, csvRow } from "../src/lib/csv";

test("CSV: vírgula, aspas e quebra de linha ficam entre aspas", () => {
  assert.equal(csvCell("Noiva, véu (1)"), '"Noiva, véu (1)"');
  assert.equal(csvCell('foto "a"'), '"foto ""a"""');
  assert.equal(csvRow(["IMG_1", "sim"]), "IMG_1,sim");
});

test("CSV: nome que viraria fórmula ganha apóstrofo", () => {
  for (const v of ["=1+1", "+55", "-2", "@SUM(A1)"]) assert.equal(csvCell(v)[0], "'");
  assert.equal(csvCell("=HYPERLINK(\"x\",\"y\")"), '"\'=HYPERLINK(""x"",""y"")"');
  assert.equal(csvCell("IMG_1"), "IMG_1");
});
