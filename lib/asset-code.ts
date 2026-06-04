import { AssetType, PrismaClient } from "@prisma/client";

const assetTypePrefixes: Record<AssetType, string> = {
  NOTEBOOK: "NB",
  DESKTOP: "PC",
  MINI_PC: "MINI",
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

export async function generateAssetCode(prisma: PrismaClient, type: AssetType, prefixOverride?: string | null) {
  const prefix = prefixOverride || getAssetCodePrefix(type);
  const codeStart = `${prefix}-`;

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
    const runningText = asset.assetTag.split("-").at(-1) ?? "";
    const runningNumber = Number.parseInt(runningText, 10);
    return Number.isNaN(runningNumber) ? max : Math.max(max, runningNumber);
  }, 0);

  return `${codeStart}${String(lastRunningNumber + 1).padStart(3, "0")}`;
}
