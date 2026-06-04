import { AssetStatus, AssetType, Prisma } from "@prisma/client";
import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  });

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (typeof value === "string" && value.trim() ? new Date(value.trim()) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), "Invalid date");

const optionalDecimal = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value, context) => {
    if (value === undefined || value === null || String(value).trim() === "") return null;

    try {
      return new Prisma.Decimal(String(value).replaceAll(",", "").trim());
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid amount" });
      return z.NEVER;
    }
  });

const assetFieldsSchema = {
  name: z.string().trim().min(2).max(120),
  type: z.nativeEnum(AssetType).default(AssetType.OTHER),
  status: z.nativeEnum(AssetStatus).default(AssetStatus.IN_STOCK),
  assetAcc: optionalText,
  serialNumber: optionalText,
  manufacturer: optionalText,
  model: optionalText,
  assignedTo: optionalText,
  userPosition: optionalText,
  location: optionalText,
  purchaseDate: optionalDate,
  purchasePrice: optionalDecimal,
  warrantyUntil: optionalDate,
  windowsKey: optionalText,
  notes: optionalText
};

export const assetInputSchema = z.object({
  assetTag: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || value.length >= 2, "Asset tag must be at least 2 characters"),
  ...assetFieldsSchema
});

export const assetPatchSchema = z.object({
  assetTag: z.string().trim().min(2).max(50).optional(),
  ...assetFieldsSchema
}).partial();
