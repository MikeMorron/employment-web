import { jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET() {
  return jsonWithSecurity(
    { ok: false, message: "Usa la ruta segura con publicId y token" },
    { status: 410 },
  );
}

export async function HEAD() {
  return new Response(null, { status: 410 });
}
