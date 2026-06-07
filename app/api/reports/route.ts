import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const statusText: Record<AssetStatus, string> = {
  IN_STOCK: "สต็อก",
  READY_TO_USE: "พร้อมใช้",
  ASSIGNED: "ส่งมอบแล้ว",
  IN_USE: "ใช้งาน",
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

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function purchaseYear(value: Date | null) {
  if (!value) return "";
  const year = value.getFullYear();
  return Number.isNaN(year) ? "" : String(year + 543);
}

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: {
      branch: true,
      currentEmployee: true
    },
    orderBy: [{ assetTag: "asc" }]
  });

  const header = [
    "NO.",
    "Asset",
    "Asset Acc",
    "S/N",
    "User",
    "Position",
    "Location",
    "Years",
    "Status",
    "Brand",
    "Model",
    "Notation",
    "windows key",
    "Price"
  ];
  const rows = assets.map((asset, index) => [
    index + 1,
    asset.name,
    asset.assetAcc,
    asset.serialNumber,
    asset.assignedTo ?? asset.currentEmployee?.fullName,
    asset.userPosition ?? asset.currentEmployee?.position,
    asset.branch?.name ?? asset.location,
    purchaseYear(asset.purchaseDate),
    statusText[asset.status],
    asset.manufacturer,
    asset.model,
    asset.notes,
    asset.windowsKey,
    asset.purchasePrice
  ]);

  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smart-track-assets-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
