CREATE TABLE "AssetTypeMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetTypeMaster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetTypeBrand" (
    "assetTypeId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetTypeBrand_pkey" PRIMARY KEY ("assetTypeId","brandId")
);

CREATE UNIQUE INDEX "AssetTypeMaster_code_key" ON "AssetTypeMaster"("code");
CREATE INDEX "AssetTypeMaster_isActive_idx" ON "AssetTypeMaster"("isActive");
CREATE INDEX "AssetTypeBrand_brandId_idx" ON "AssetTypeBrand"("brandId");

ALTER TABLE "AssetTypeBrand" ADD CONSTRAINT "AssetTypeBrand_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "AssetTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetTypeBrand" ADD CONSTRAINT "AssetTypeBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
