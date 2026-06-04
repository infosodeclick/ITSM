import { NextResponse } from "next/server";
import { AssetStatus, AssetType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const activeStatuses: AssetStatus[] = [AssetStatus.ASSIGNED, AssetStatus.IN_USE, AssetStatus.TRANSFERRED];
const damagedStatuses: AssetStatus[] = [AssetStatus.REPAIR, AssetStatus.WAITING_REPAIR, AssetStatus.REPAIRING, AssetStatus.LOST];
const spareStatuses: AssetStatus[] = [AssetStatus.IN_STOCK, AssetStatus.READY_TO_USE, AssetStatus.SPARE, AssetStatus.RETURNED];

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function purchaseYear(date: Date | null) {
  return date ? date.getFullYear() : null;
}

function thaiStatus(status: AssetStatus) {
  const map: Record<AssetStatus, string> = {
    IN_STOCK: "สต็อก",
    READY_TO_USE: "พร้อมใช้",
    ASSIGNED: "ส่งมอบแล้ว",
    IN_USE: "ใช้งานอยู่",
    TRANSFERRED: "โอนย้าย",
    RETURNED: "รับคืน",
    REPAIR: "พัง",
    WAITING_REPAIR: "รอซ่อม",
    REPAIRING: "กำลังซ่อม",
    SPARE: "เครื่องสำรอง",
    RETIRED: "เลิกใช้งาน",
    PENDING_DISPOSAL: "รอจำหน่าย",
    DISPOSED: "จำหน่าย",
    LOST: "สูญหาย"
  };
  return map[status];
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [assets, employees, budgets, auditLogs, users, roles, hrRequests, movements, branches, brands, assetTypes] =
    await Promise.all([
      prisma.asset.findMany({
        include: { branch: true, brand: true, category: true, department: true },
        orderBy: [{ updatedAt: "desc" }, { assetTag: "asc" }]
      }),
      prisma.employee.findMany({
        include: { branch: true, department: true },
        orderBy: [{ fullName: "asc" }]
      }),
      prisma.budget.findMany({ orderBy: [{ fiscalYear: "desc" }, { category: "asc" }] }),
      prisma.auditLog.findMany({
        include: { actorUser: true },
        orderBy: [{ createdAt: "desc" }],
        take: 80
      }),
      prisma.user.findMany({ include: { role: true }, orderBy: [{ createdAt: "desc" }], take: 100 }),
      prisma.role.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.hrRequest.findMany({ orderBy: [{ createdAt: "desc" }], take: 60 }),
      prisma.assetMovement.findMany({ orderBy: [{ movedAt: "desc" }], take: 60 }),
      prisma.branch.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.brand.findMany({ orderBy: [{ name: "asc" }] }),
      prisma.assetTypeMaster.findMany({
        where: { isActive: true },
        include: { typeBrands: { include: { brand: true } } },
        orderBy: [{ name: "asc" }]
      })
    ]);

  const today = new Date();
  const expiredWarranty = assets.filter((asset) => asset.warrantyUntil && asset.warrantyUntil < today).length;
  const coveredWarranty = assets.filter((asset) => asset.warrantyUntil && asset.warrantyUntil >= today).length;
  const statusCounts = Object.values(AssetStatus)
    .map((status) => ({
      status,
      label: thaiStatus(status),
      count: assets.filter((asset) => asset.status === status).length
    }))
    .filter((item) => item.count > 0);

  const years = Array.from(
    new Set([...assets.map((asset) => purchaseYear(asset.purchaseDate)).filter(Boolean), ...budgets.map((budget) => budget.fiscalYear)])
  ).sort((a, b) => Number(b) - Number(a));

  const assetsByYear = years.map((year) => {
    const scopedAssets = assets.filter((asset) => purchaseYear(asset.purchaseDate) === year);
    return {
      year,
      total: scopedAssets.length,
      inUse: scopedAssets.filter((asset) => activeStatuses.includes(asset.status)).length,
      damaged: scopedAssets.filter((asset) => damagedStatuses.includes(asset.status)).length,
      spare: scopedAssets.filter((asset) => spareStatuses.includes(asset.status)).length,
      budget: budgets.filter((budget) => budget.fiscalYear === year).reduce((sum, budget) => sum + toNumber(budget.actual), 0)
    };
  });

  const dashboard = {
    employeeCount: employees.length,
    assetCount: assets.length,
    expiredWarranty,
    coveredWarranty,
    statusCounts,
    assetsByYear,
    totalBudgetActual: budgets.reduce((sum, budget) => sum + toNumber(budget.actual), 0),
    totalBudgetAllocated: budgets.reduce((sum, budget) => sum + toNumber(budget.allocated), 0)
  };

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role?.name
    },
    dashboard,
    filters: {
      years,
      departments: Array.from(new Set(assets.map((asset) => asset.department?.name).filter(Boolean))).sort(),
      branches: Array.from(new Set(assets.map((asset) => asset.branch?.name ?? asset.location).filter(Boolean))).sort(),
      statuses: statusCounts
    },
    assets,
    employees,
    budgets,
    auditLogs,
    users: users.map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      name: item.name,
      role: item.role?.name,
      isActive: item.isActive,
      createdAt: item.createdAt
    })),
    roles,
    masterData: {
      branches,
      brands,
      assetTypes,
      supportedAssetTypes: Object.values(AssetType)
    },
    hrRequests,
    movements
  });
}
