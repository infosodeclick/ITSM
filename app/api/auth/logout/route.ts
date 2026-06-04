import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) {
    await writeAuditLog({
      request,
      module: "AUTH",
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
