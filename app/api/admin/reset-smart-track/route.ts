import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetSmartTrackData } from "@/lib/smart-track-reset";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role?.name !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (body?.confirm !== "RESET_SMART_TRACK") {
    return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });
  }

  await resetSmartTrackData(prisma);
  return NextResponse.json({ ok: true, adminUser: "admin" });
}
