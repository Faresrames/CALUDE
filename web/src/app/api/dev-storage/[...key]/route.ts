import { NextResponse, type NextRequest } from "next/server";
import { storage } from "@/lib/storage";

const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", svg: "image/svg+xml", webp: "image/webp" };

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const q = req.nextUrl.searchParams;
  if (!storage.check("GET", key, q.get("exp"), q.get("sig"))) return new NextResponse("forbidden", { status: 403 });
  try {
    const body = await storage.get(key);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": types[key.split(".").pop() ?? ""] ?? "application/octet-stream",
        "cache-control": "private, max-age=3600, immutable",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const q = req.nextUrl.searchParams;
  if (!storage.check("PUT", key, q.get("exp"), q.get("sig"))) return new NextResponse("forbidden", { status: 403 });
  if (!/\.(jpg|png)$/.test(key)) return new NextResponse("bad type", { status: 400 });
  try {
    await storage.put(key, Buffer.from(await req.arrayBuffer()));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return new NextResponse(String((e as Error).message), { status: 413 });
  }
}
