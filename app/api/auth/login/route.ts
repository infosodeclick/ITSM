import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureDefaultUsers, setSessionCookie, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  await ensureDefaultUsers();
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "กรุณากรอก Username และ Password" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      username: parsed.data.username,
      isActive: true
    },
    include: { role: true }
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    await writeAuditLog({
      request,
      module: "AUTH",
      action: "LOGIN_FAILED",
      entityType: "User",
      reason: parsed.data.username,
      status: "FAILED"
    });
    return NextResponse.json({ error: "Username หรือ Password ไม่ถูกต้อง" }, { status: 401 });
  }

  await writeAuditLog({
    request,
    module: "AUTH",
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    status: "SUCCESS"
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role?.name
    }
  });
  setSessionCookie(response, user);
  return response;
}
