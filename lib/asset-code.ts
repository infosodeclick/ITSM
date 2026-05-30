import { AssetType, PrismaClient } from "@prisma/client";

const assetTypePrefixes: Record<AssetType, string> = {
  NOTEBOOK: "NB",
  DESKTOP: "PC",
  MONITOR: "MON",
  PRINTER: "PRN",
  SCANNER: "SCN",
  MOBILE_PHONE: "MOB",
  TABLET: "TAB",
  NETWORK: "NET",
  SERVER: "SRV",
  FIREWALL: "FW",
  SWITCH: "SWI",
  ROUTER: "RTR",
  ACCESS_POINT: "AP",
  CCTV: "CCTV",
  UPS: "UPS",
  SOFTWARE: "SW",
  MICROSOFT_365: "M365",
  ADOBE_LICENSE: "ADB",
  ANTIVIRUS_EDR: "AV",
  SAP_B1: "SAP",
  CRM: "CRM",
  EMAIL_ACCOUNT: "MAIL",
  OTHER: "OTH"
};

export function getAssetCodePrefix(type: AssetType) {
  return assetTypePrefixes[type] ?? assetTypePrefixes.OTHER;
}

export async function generateAssetCode(prisma: PrismaClient, type: AssetType, date = new Date()) {
  const year = date.getFullYear();
  const prefix = getAssetCodePrefix(type);
  const codeStart = `${prefix}-${year}-`;

  const existingAssets = await prisma.asset.findMany({
    where: {
      assetTag: {
        startsWith: codeStart
      }
    },
    select: {
      assetTag: true
    }
  });

  const lastRunningNumber = existingAssets.reduce((max, asset) => {
    const runningText = asset.assetTag.slice(codeStart.length);
    const runningNumber = Number.parseInt(runningText, 10);
    return Number.isNaN(runningNumber) ? max : Math.max(max, runningNumber);
  }, 0);

  return `${codeStart}${String(lastRunningNumber + 1).padStart(4, "0")}`;
}
