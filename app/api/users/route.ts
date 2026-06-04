import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessRole, getCurrentUser, hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
  roleId: z.string().min(1),
  email: z.string().email().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!canAccessRole(actor, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user data", details: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email || `${parsed.data.username}@local.itsm`;
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      email,
      name: parsed.data.name,
      roleId: parsed.data.roleId,
      passwordHash: hashPassword(parsed.data.password)
    },
    include: { role: true }
  });

  await writeAuditLog({
    request,
    module: "USER",
    action: "CREATE_USER",
    entityType: "User",
    entityId: user.id,
    afterData: { id: user.id, username: user.username, role: user.role?.name },
    status: "SUCCESS"
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role?.name,
      isActive: user.isActive
    }
  }, { status: 201 });
}
