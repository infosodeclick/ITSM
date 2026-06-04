import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessRole, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const masterDataSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("location"),
    code: z.string().trim().min(2).max(30),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(240).optional().or(z.literal(""))
  }),
  z.object({
    kind: z.literal("brand"),
    code: z.string().trim().min(2).max(30),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(240).optional().or(z.literal(""))
  })
]);

function cleanText(value?: string) {
  return value?.trim() || null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!canAccessRole(user, ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = masterDataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid master data", details: parsed.error.flatten() }, { status: 400 });
  }

  let record: unknown;
  if (parsed.data.kind === "location") {
    record = await prisma.branch.upsert({
      where: { code: parsed.data.code },
      update: { name: parsed.data.name, description: cleanText(parsed.data.description) },
      create: { code: parsed.data.code, name: parsed.data.name, description: cleanText(parsed.data.description) }
    });
  }

  if (parsed.data.kind === "brand") {
    record = await prisma.brand.upsert({
      where: { code: parsed.data.code },
      update: { name: parsed.data.name, description: cleanText(parsed.data.description) },
      create: { code: parsed.data.code, name: parsed.data.name, description: cleanText(parsed.data.description) }
    });
  }

  await writeAuditLog({
    request,
    module: "MASTER_DATA",
    action: `UPSERT_${parsed.data.kind.toUpperCase()}`,
    entityType: parsed.data.kind,
    afterData: record
  });

  return NextResponse.json({ record }, { status: 201 });
}
