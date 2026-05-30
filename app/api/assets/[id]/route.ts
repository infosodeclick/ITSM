import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assetPatchSchema } from "@/lib/assets";
import { writeAuditLog } from "@/lib/audit";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = assetPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid asset data", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const beforeAsset = await prisma.asset.findUnique({ where: { id } });
    if (!beforeAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: parsed.data
    });

    await writeAuditLog({
      request,
      module: "ASSET",
      action: "UPDATE_ASSET",
      entityType: "Asset",
      entityId: asset.id,
      beforeData: beforeAsset,
      afterData: asset
    });

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const beforeAsset = await prisma.asset.findUnique({ where: { id } });
    if (!beforeAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await prisma.asset.delete({ where: { id } });
    await writeAuditLog({
      request: _request,
      module: "ASSET",
      action: "DELETE_ASSET",
      entityType: "Asset",
      entityId: id,
      beforeData: beforeAsset
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    throw error;
  }
}
