import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/inventory-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const assets = await prisma.asset.findMany({
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
    inUse: assets.filter((asset) => asset.status === AssetStatus.IN_USE).length,
    inStock: assets.filter((asset) => asset.status === AssetStatus.IN_STOCK).length,
    repair: assets.filter((asset) => asset.status === AssetStatus.REPAIR).length
  };

  return (
    <InventoryClient
      initialAssets={assets}
      stats={stats}
      initialModules={{ movements, hrRequests, licenses, maintenanceRecords, budgets, approvals, notifications, auditLogs, users, roles }}
    />
  );
}
