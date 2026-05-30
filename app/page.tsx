import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/inventory-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const assets = await prisma.asset.findMany({
    orderBy: [{ updatedAt: "desc" }, { assetTag: "asc" }]
  });

  const stats = {
    total: assets.length,
    inUse: assets.filter((asset) => asset.status === AssetStatus.IN_USE).length,
    inStock: assets.filter((asset) => asset.status === AssetStatus.IN_STOCK).length,
    repair: assets.filter((asset) => asset.status === AssetStatus.REPAIR).length
  };

  return <InventoryClient initialAssets={assets} stats={stats} />;
}
