import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seleção de fotos",
  description: "Galerias de seleção de fotos para fotógrafos",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
