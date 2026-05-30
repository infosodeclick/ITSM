import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const assets = await prisma.asset.findMany({
    orderBy: [{ assetTag: "asc" }]
  });

  const header = ["Asset Tag", "Name", "Type", "Status", "Serial Number", "Assigned To", "Location", "Warranty Until"];
  const rows = assets.map((asset) => [
    asset.assetTag,
    asset.name,
    asset.type,
    asset.status,
    asset.serialNumber,
    asset.assignedTo,
    asset.location,
    asset.warrantyUntil
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="itsm-assets-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
