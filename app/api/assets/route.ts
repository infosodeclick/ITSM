import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assetInputSchema } from "@/lib/assets";

export async function GET() {
  const assets = await prisma.asset.findMany({
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
    const asset = await prisma.asset.create({ data: parsed.data });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Asset tag already exists" }, { status: 409 });
    }

    throw error;
  }
}
