import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Imagem social PROVISÓRIA (até o logo final): azul-noite, feixe âmbar, nome e frase.
export const alt = `${BRAND.name}: ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1c2d47", color: "#ffffff", padding: 80, position: "relative" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 0, height: 0, borderTop: "315px solid transparent", borderBottom: "315px solid transparent", borderRight: "520px solid rgba(233,162,59,0.35)" }} />
        <div style={{ position: "absolute", right: 500, top: 285, width: 60, height: 60, borderRadius: 30, background: "#e9a23b" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, maxWidth: 700 }}>
          <div style={{ fontSize: 96, fontWeight: 700 }}>{BRAND.name}</div>
          <div style={{ fontSize: 42, lineHeight: 1.2, opacity: 0.9 }}>A seleção de fotos que não falha no dia que importa.</div>
        </div>
      </div>
    ),
    size,
  );
}
