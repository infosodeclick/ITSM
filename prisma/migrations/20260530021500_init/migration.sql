CREATE TYPE "AssetStatus" AS ENUM ('IN_STOCK', 'IN_USE', 'REPAIR', 'RETIRED');

CREATE TYPE "AssetType" AS ENUM ('NOTEBOOK', 'DESKTOP', 'MONITOR', 'PRINTER', 'NETWORK', 'SERVER', 'SOFTWARE', 'OTHER');

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "assetTag" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AssetType" NOT NULL DEFAULT 'OTHER',
  "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
  "serialNumber" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "assignedTo" TEXT,
  "location" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "warrantyUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_type_idx" ON "Asset"("type");
CREATE INDEX "Asset_assetTag_idx" ON "Asset"("assetTag");
