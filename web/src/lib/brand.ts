// A marca num lugar só: trocar o nome do produto é mudar aqui (e o ícone em app/icon.svg).
export const BRAND = {
  name: "Farol",
  tagline: "Seleção de fotos que não falha no dia que importa",
  // PREENCHER antes do lançamento (o /replica-deploy bloqueia se ainda tiver colchetes):
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "[RAZÃO SOCIAL]",
  cnpj: process.env.NEXT_PUBLIC_CNPJ ?? "[CNPJ]",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "[E-MAIL DE CONTATO]",
} as const;
