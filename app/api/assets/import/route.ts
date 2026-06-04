import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { generateAssetCode } from "@/lib/asset-code";
import { parseAssetImport } from "@/lib/asset-import";
import { assetInputSchema } from "@/lib/assets";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "กรุณาเลือกไฟล์ CSV หรือ TSV" }, { status: 400 });
  }

  const importedRows = parseAssetImport(await file.text());
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [index, row] of importedRows.entries()) {
    const parsed = assetInputSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`แถว ${index + 2}: ข้อมูลไม่ถูกต้อง`);
      continue;
    }

    const { assetTag: _assetTag, ...assetData } = parsed.data;
    const matchFilters: Prisma.AssetWhereInput[] = [];
    if (assetData.assetAcc) matchFilters.push({ assetAcc: assetData.assetAcc });
    if (assetData.serialNumber) matchFilters.push({ serialNumber: assetData.serialNumber });

    try {
      const existingAsset = matchFilters.length
        ? await prisma.asset.findFirst({
            where: { OR: matchFilters },
            orderBy: { updatedAt: "desc" }
          })
        : null;

      if (existingAsset) {
        await prisma.asset.update({
          where: { id: existingAsset.id },
          data: assetData
        });
        updated += 1;
      } else {
        await prisma.asset.create({
          data: {
            ...assetData,
            assetTag: await generateAssetCode(prisma, assetData.type)
          }
        });
        created += 1;
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        errors.push(`แถว ${index + 2}: asset ซ้ำกับข้อมูลเดิม`);
      } else {
        errors.push(`แถว ${index + 2}: import ไม่สำเร็จ`);
      }
    }
  }

  await writeAuditLog({
    request,
    module: "ASSET",
    action: "IMPORT_ASSETS",
    entityType: "Asset",
    afterData: { created, updated, errors: errors.length, fileName: file.name }
  });

  return NextResponse.json({
    created,
    errors,
    imported: importedRows.length,
    updated
  });
}
