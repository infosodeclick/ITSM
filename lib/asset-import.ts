import { AssetStatus, AssetType } from "@prisma/client";

export type ImportedAssetRow = {
  assetAcc?: string | null;
  assignedTo?: string | null;
  location?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  name: string;
  notes?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  serialNumber?: string | null;
  status?: AssetStatus;
  type?: AssetType;
  userPosition?: string | null;
  windowsKey?: string | null;
};

const statusAliases: Record<string, AssetStatus> = {
  stock: AssetStatus.IN_STOCK,
  "in stock": AssetStatus.IN_STOCK,
  stored: AssetStatus.IN_STOCK,
  "ready to use": AssetStatus.READY_TO_USE,
  ready: AssetStatus.READY_TO_USE,
  assigned: AssetStatus.ASSIGNED,
  "in use": AssetStatus.IN_USE,
  transferred: AssetStatus.TRANSFERRED,
  returned: AssetStatus.RETURNED,
  repair: AssetStatus.REPAIR,
  broken: AssetStatus.REPAIR,
  "waiting repair": AssetStatus.WAITING_REPAIR,
  repairing: AssetStatus.REPAIRING,
  spare: AssetStatus.SPARE,
  retired: AssetStatus.RETIRED,
  disposed: AssetStatus.DISPOSED,
  sold: AssetStatus.DISPOSED,
  lost: AssetStatus.LOST,
  "pending disposal": AssetStatus.PENDING_DISPOSAL,
  "สต็อก": AssetStatus.IN_STOCK,
  "สต๊อก": AssetStatus.IN_STOCK,
  "พร้อมใช้": AssetStatus.READY_TO_USE,
  "ส่งมอบแล้ว": AssetStatus.ASSIGNED,
  "ใช้งาน": AssetStatus.IN_USE,
  "ใช้งานอยู่": AssetStatus.IN_USE,
  "โอนย้าย": AssetStatus.TRANSFERRED,
  "รับคืน": AssetStatus.RETURNED,
  "พัง": AssetStatus.REPAIR,
  "เสีย": AssetStatus.REPAIR,
  "ซ่อม": AssetStatus.REPAIRING,
  "รอซ่อม": AssetStatus.WAITING_REPAIR,
  "กำลังซ่อม": AssetStatus.REPAIRING,
  "เครื่องสำรอง": AssetStatus.SPARE,
  "เลิกใช้": AssetStatus.RETIRED,
  "เลิกใช้งาน": AssetStatus.RETIRED,
  "รอจำหน่าย": AssetStatus.PENDING_DISPOSAL,
  "จำหน่าย": AssetStatus.DISPOSED,
  "สูญหาย": AssetStatus.LOST
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("/", "")
    .replaceAll("-", "")
    .replaceAll("_", "")
    .replace(/\s+/g, "");
}

function clean(value: string | undefined) {
  const text = value?.trim();
  if (!text) return null;
  if (["-", "n/a", "na", "no data", "ไม่มีข้อมูล"].includes(text.toLowerCase())) return null;
  if (text === "ไม่มีข้อมูล") return null;
  return text;
}

function cleanPrice(value: string | null) {
  if (!value) return null;
  const normalized = value.replaceAll(",", "").trim();
  return normalized && !Number.isNaN(Number(normalized)) ? normalized : null;
}

function firstValue(...values: Array<string | null>) {
  const value = values.find(Boolean);
  return value ?? null;
}

function parseDelimited(text: string) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((item) => item.trim()));
}

function valueFrom(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = clean(row[normalizeHeader(alias)]);
    if (value) return value;
  }
  return null;
}

function statusFrom(value: string | null) {
  if (!value) return AssetStatus.IN_STOCK;
  const trimmed = value.trim();
  if (Object.values(AssetStatus).includes(trimmed as AssetStatus)) return trimmed as AssetStatus;
  return statusAliases[trimmed.toLowerCase()] ?? statusAliases[trimmed] ?? AssetStatus.IN_STOCK;
}

function typeFrom(assetName: string) {
  const value = assetName.toLowerCase();
  if (value.includes("notebook") || value.includes("laptop") || value.includes("nb")) return AssetType.NOTEBOOK;
  if (value.includes("desktop") || value.includes("pc")) return AssetType.DESKTOP;
  if (value.includes("monitor")) return AssetType.MONITOR;
  if (value.includes("printer")) return AssetType.PRINTER;
  if (value.includes("switch") || value.includes("router") || value.includes("access point")) return AssetType.NETWORK;
  if (value.includes("server")) return AssetType.SERVER;
  return AssetType.NOTEBOOK;
}

function purchaseDateFromYear(value: string | null) {
  if (!value) return null;
  const firstNumber = value.match(/\d{2,4}/)?.[0];
  if (!firstNumber) return null;

  let year = Number(firstNumber);
  if (Number.isNaN(year)) return null;
  if (year < 100) year += 2500;
  if (year > 2400) year -= 543;
  if (year < 1900 || year > 2200) return null;

  return `${year}-01-01`;
}

export function parseAssetRows(rows: unknown[][]) {
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => normalizeHeader(String(value ?? "")));
  return rows.slice(1).flatMap((cells, rowIndex) => {
    const row = Object.fromEntries(headers.map((header, index) => [header, String(cells[index] ?? "")]));
    const assetName = firstValue(
      valueFrom(row, ["Asset", "Asset Name", "Name", "อุปกรณ์", "ทรัพย์สิน"]),
      valueFrom(row, ["Asset Acc", "Asset Account", "Asset Accounting", "บัญชีทรัพย์สิน"]),
      valueFrom(row, ["S/N", "SN", "Serial", "Serial Number", "เลขซีเรียล"]),
      [valueFrom(row, ["Brand", "Manufacturer", "ยี่ห้อ", "ผู้ผลิต"]), valueFrom(row, ["Model", "รุ่น"])].filter(Boolean).join(" "),
      valueFrom(row, ["User", "Assigned To", "ผู้ใช้งาน", "ผู้ถือครอง"]),
      valueFrom(row, ["Location", "Branch", "สถานที่", "สาขา"]),
      `Imported Asset ${rowIndex + 2}`
    );
    if (!assetName) return [];

    return [
      {
        assetAcc: valueFrom(row, ["Asset Acc", "Asset Account", "Asset Accounting", "บัญชีทรัพย์สิน"]),
        assignedTo: valueFrom(row, ["User", "Assigned To", "ผู้ใช้งาน", "ผู้ถือครอง"]),
        location: valueFrom(row, ["Location", "Branch", "สถานที่", "สาขา"]),
        manufacturer: valueFrom(row, ["Brand", "Manufacturer", "ยี่ห้อ", "ผู้ผลิต"]),
        model: valueFrom(row, ["Model", "รุ่น"]),
        name: assetName,
        notes: valueFrom(row, ["Notation", "Note", "Notes", "Remark", "หมายเหตุ"]),
        purchaseDate: purchaseDateFromYear(valueFrom(row, ["Years", "Year", "ปี", "ปีที่ซื้อ"])),
        purchasePrice: cleanPrice(valueFrom(row, ["Price", "Purchase Price", "ราคา"])),
        serialNumber: valueFrom(row, ["S/N", "SN", "Serial", "Serial Number", "เลขซีเรียล"]),
        status: statusFrom(valueFrom(row, ["Status", "สถานะ"])),
        type: typeFrom(assetName),
        userPosition: valueFrom(row, ["Position", "ตำแหน่ง"]),
        windowsKey: valueFrom(row, ["windows key", "Windows Key", "Windows License", "Product Key"])
      } satisfies ImportedAssetRow
    ];
  });
}

export function parseAssetImport(text: string) {
  return parseAssetRows(parseDelimited(text));
}
