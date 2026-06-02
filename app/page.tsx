import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/inventory-client";

export const dynamic = "force-dynamic";

function isInUseStatus(status: AssetStatus) {
  return status === AssetStatus.IN_USE || status === AssetStatus.ASSIGNED || status === AssetStatus.TRANSFERRED;
}

function isAvailableStatus(status: AssetStatus) {
  return (
    status === AssetStatus.IN_STOCK ||
    status === AssetStatus.READY_TO_USE ||
    status === AssetStatus.RETURNED ||
    status === AssetStatus.SPARE
  );
}

function isRepairStatus(status: AssetStatus) {
  return status === AssetStatus.REPAIR || status === AssetStatus.WAITING_REPAIR || status === AssetStatus.REPAIRING;
}

export default async function Home() {
  const assets = await prisma.asset.findMany({
    include: {
      branch: true,
      category: true,
      department: true
    },
    orderBy: [{ updatedAt: "desc" }, { assetTag: "asc" }]
  });
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

  const stats = {
    total: assets.length,
    inUse: assets.filter((asset) => isInUseStatus(asset.status)).length,
    inStock: assets.filter((asset) => isAvailableStatus(asset.status)).length,
    repair: assets.filter((asset) => isRepairStatus(asset.status)).length
  };

  return (
    <InventoryClient
      initialAssets={assets}
      stats={stats}
      initialModules={{ movements, hrRequests, licenses, maintenanceRecords, budgets, approvals, notifications, auditLogs, users, roles }}
    />
  );
}
