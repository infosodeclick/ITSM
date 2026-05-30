import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { moduleCreateSchema } from "@/lib/modules";

async function getModules() {
  const [movements, hrRequests, licenses, maintenanceRecords, budgets, approvals, notifications, auditLogs, users, roles] =
    await Promise.all([
      prisma.assetMovement.findMany({ orderBy: [{ movedAt: "desc" }, { createdAt: "desc" }], take: 50 }),
      prisma.hrRequest.findMany({ orderBy: [{ createdAt: "desc" }], take: 50 }),
      prisma.softwareLicense.findMany({ orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }], take: 50 }),
      prisma.maintenanceRecord.findMany({ orderBy: [{ reportedAt: "desc" }, { createdAt: "desc" }], take: 50 }),
      prisma.budget.findMany({ orderBy: [{ fiscalYear: "desc" }, { category: "asc" }], take: 50 }),
      prisma.approval.findMany({ orderBy: [{ createdAt: "desc" }], take: 50 }),
      prisma.notification.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], take: 50 }),
      prisma.auditLog.findMany({ orderBy: [{ createdAt: "desc" }], take: 50 }),
      prisma.user.findMany({ include: { role: true }, orderBy: [{ createdAt: "desc" }], take: 50 }),
      prisma.role.findMany({ orderBy: [{ name: "asc" }] })
    ]);

  return { movements, hrRequests, licenses, maintenanceRecords, budgets, approvals, notifications, auditLogs, users, roles };
}

export async function GET() {
  return NextResponse.json(await getModules());
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = moduleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid module data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { module } = parsed.data;
  let record: unknown;
  let auditModule = module.toUpperCase();
  let action = `CREATE_${auditModule}`;

  if (module === "movement") {
    const { module: _module, movedAt, ...data } = parsed.data;
    record = await prisma.assetMovement.create({ data: { ...data, ...(movedAt ? { movedAt } : {}) } });
    auditModule = "ASSET_MOVEMENT";
    action = "CREATE_ASSET_MOVEMENT";
  }

  if (module === "hrRequest") {
    const { module: _module, ...data } = parsed.data;
    record = await prisma.hrRequest.create({ data });
    auditModule = data.type === "ONBOARDING" ? "HR_ONBOARDING" : "HR_OFFBOARDING";
    action = `CREATE_${auditModule}`;
  }

  if (module === "license") {
    const { module: _module, ...data } = parsed.data;
    record = await prisma.softwareLicense.create({ data });
    auditModule = "LICENSE";
    action = "CREATE_LICENSE";
  }

  if (module === "maintenance") {
    const { module: _module, reportedAt, ...data } = parsed.data;
    record = await prisma.maintenanceRecord.create({ data: { ...data, ...(reportedAt ? { reportedAt } : {}) } });
    auditModule = "REPAIR";
    action = "CREATE_REPAIR";
  }

  if (module === "budget") {
    const { module: _module, ...data } = parsed.data;
    record = await prisma.budget.create({ data });
    auditModule = "BUDGET";
    action = "CREATE_BUDGET";
  }

  if (module === "approval") {
    const { module: _module, moduleName, ...data } = parsed.data;
    record = await prisma.approval.create({ data: { ...data, module: moduleName } });
    auditModule = "APPROVAL";
    action = "CREATE_APPROVAL";
  }

  if (module === "notification") {
    const { module: _module, moduleName, ...data } = parsed.data;
    record = await prisma.notification.create({ data: { ...data, module: moduleName } });
    auditModule = "NOTIFICATION";
    action = "CREATE_NOTIFICATION";
  }

  await writeAuditLog({
    request,
    module: auditModule,
    action,
    entityType: auditModule,
    afterData: record
  });

  return NextResponse.json({ record, modules: await getModules() }, { status: 201 });
}
