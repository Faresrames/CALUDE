import assert from "node:assert/strict";
import { test } from "node:test";
import { crc16, normalizePixKey, pixPayload } from "../src/lib/pix";

test("CRC16 bate com o exemplo do manual do BR Code (Banco Central)", () => {
  const ex = "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304";
  assert.equal(crc16(ex), "1D3D");
});

test("payload reproduz o exemplo oficial (sem valor)", () => {
  const p = pixPayload({ key: "123e4567-e12b-12d1-a456-426655440000", name: "Fulano de Tal", city: "BRASILIA" });
  assert.equal(p, "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D");
});

test("valor, txid, acentos e limites", () => {
  const p = pixPayload({ key: "+5511999998888", name: "Estúdio Ângela Fotografia de Casamentos", city: "São Paulo", amountCents: 12500, txid: "ab-12_cd" });
  assert.match(p, /5406125\.00/);
  assert.match(p, /5925Estudio Angela Fotografia6009/); // corta em 25, sem acento e sem espaço sobrando
  assert.match(p, /6009Sao Paulo/);
  assert.match(p, /62100506ab12cd/);
  assert.equal(p.slice(-4), crc16(p.slice(0, -4)));
});

test("normaliza e valida chaves", () => {
  assert.equal(normalizePixKey("cpf", "123.456.789-09"), "12345678909");
  assert.equal(normalizePixKey("cpf", "123"), null);
  assert.equal(normalizePixKey("phone", "(11) 99999-8888"), "+5511999998888");
  assert.equal(normalizePixKey("email", "Foto@Estudio.com"), "foto@estudio.com");
  assert.equal(normalizePixKey("random", "nao-e-uuid"), null);
});
