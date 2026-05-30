import { AssetStatus, AssetType } from "@prisma/client";
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), "Invalid date");

export const assetInputSchema = z.object({
  assetTag: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(120),
  type: z.nativeEnum(AssetType).default(AssetType.OTHER),
  status: z.nativeEnum(AssetStatus).default(AssetStatus.IN_STOCK),
  serialNumber: optionalText,
  manufacturer: optionalText,
  model: optionalText,
  assignedTo: optionalText,
  location: optionalText,
  purchaseDate: optionalDate,
  warrantyUntil: optionalDate,
  notes: optionalText
});

export const assetPatchSchema = assetInputSchema.partial();
