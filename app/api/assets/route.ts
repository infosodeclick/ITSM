import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAssetCode } from "@/lib/asset-code";
import { assetInputSchema } from "@/lib/assets";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: {
      branch: true,
      category: true,
      department: true
    },
    orderBy: [{ updatedAt: "desc" }, { assetTag: "asc" }]
  });

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = assetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid asset data", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = {
      ...parsed.data,
      assetTag: parsed.data.assetTag ?? (await generateAssetCode(prisma, parsed.data.type))
    };

    const asset = await prisma.asset.create({ data });
    await writeAuditLog({
      request,
      module: "ASSET",
      action: "CREATE_ASSET",
      entityType: "Asset",
      entityId: asset.id,
      afterData: asset
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Asset tag already exists" }, { status: 409 });
    }

    throw error;
  }
}
