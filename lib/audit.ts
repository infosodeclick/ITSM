import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  request?: Request;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string;
  status?: string;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog({
  request,
  module,
  action,
  entityType,
  entityId,
  beforeData,
  afterData,
  reason,
  status = "SUCCESS"
}: AuditInput) {
  await prisma.auditLog.create({
    data: {
      module,
      action,
      entityType,
      entityId,
      beforeData: toJsonValue(beforeData),
      afterData: toJsonValue(afterData),
      reason,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request?.headers.get("user-agent"),
      status
    }
  });
}
