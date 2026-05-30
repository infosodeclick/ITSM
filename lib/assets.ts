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

const assetFieldsSchema = {
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
