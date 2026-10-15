import type { Metadata } from "next";
import { DesignShowcase } from "./showcase";

export const metadata: Metadata = { title: "Sistema de design" };

export default function DesignPage() {
  return <DesignShowcase />;
}
