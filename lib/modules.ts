import {
  ApprovalStatus,
  AssetMovementType,
  HrRequestStatus,
  HrRequestType,
  LicenseStatus,
  MaintenanceStatus,
  NotificationStatus
} from "@prisma/client";
import { z } from "zod";

export const moduleKeys = [
  "movement",
  "hrRequest",
  "license",
  "maintenance",
  "budget",
  "approval",
  "notification"
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

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

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), "Invalid number");

export const moduleCreateSchema = z.discriminatedUnion("module", [
  z.object({
    module: z.literal("movement"),
    type: z.nativeEnum(AssetMovementType).default(AssetMovementType.TRANSFER),
    assetId: optionalText,
    assetTag: optionalText,
    assetName: optionalText,
    fromHolder: optionalText,
    toHolder: optionalText,
    fromDepartment: optionalText,
    toDepartment: optionalText,
    fromBranch: optionalText,
    toBranch: optionalText,
    reason: optionalText,
    conditionBefore: optionalText,
    conditionAfter: optionalText,
    handledBy: optionalText,
    approvedBy: optionalText,
    movedAt: optionalDate
  }),
  z.object({
    module: z.literal("hrRequest"),
    type: z.nativeEnum(HrRequestType),
    employeeCode: optionalText,
    employeeName: z.string().trim().min(2).max(120),
    position: optionalText,
    department: optionalText,
    branch: optionalText,
    managerName: optionalText,
    employmentType: optionalText,
    startDate: optionalDate,
    lastWorkingDate: optionalDate,
    requestedItems: optionalText,
    systemsNeeded: optionalText,
    status: z.nativeEnum(HrRequestStatus).default(HrRequestStatus.SUBMITTED),
    owner: optionalText,
    notes: optionalText
  }),
  z.object({
    module: z.literal("license"),
    name: z.string().trim().min(2).max(140),
    vendorName: optionalText,
    totalSeats: z.coerce.number().int().min(0).default(1),
    usedSeats: z.coerce.number().int().min(0).default(0),
    startDate: optionalDate,
    expiryDate: optionalDate,
    costPerSeat: optionalNumber,
    renewalCycle: optionalText,
    owner: optionalText,
    department: optionalText,
    branch: optionalText,
    status: z.nativeEnum(LicenseStatus).default(LicenseStatus.ACTIVE),
    notes: optionalText
  }),
  z.object({
    module: z.literal("maintenance"),
    assetId: optionalText,
    assetTag: optionalText,
    assetName: optionalText,
    issue: z.string().trim().min(2).max(300),
    reportedBy: optionalText,
    handledBy: optionalText,
    vendorName: optionalText,
    cost: optionalNumber,
    status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.REPORTED),
    reportedAt: optionalDate,
    sentAt: optionalDate,
    returnedAt: optionalDate,
    result: optionalText,
    notes: optionalText
  }),
  z.object({
    module: z.literal("budget"),
    fiscalYear: z.coerce.number().int().min(2000).max(3000),
    category: z.string().trim().min(2).max(120),
    department: optionalText,
    branch: optionalText,
    allocated: z.coerce.number().min(0).default(0),
    actual: z.coerce.number().min(0).default(0),
    notes: optionalText
  }),
  z.object({
    module: z.literal("approval"),
    moduleName: z.string().trim().min(2).max(80),
    title: z.string().trim().min(2).max(160),
    amount: optionalNumber,
    requester: optionalText,
    approver: optionalText,
    status: z.nativeEnum(ApprovalStatus).default(ApprovalStatus.PENDING),
    notes: optionalText
  }),
  z.object({
    module: z.literal("notification"),
    moduleName: z.string().trim().min(2).max(80),
    title: z.string().trim().min(2).max(160),
    message: optionalText,
    dueDate: optionalDate,
    status: z.nativeEnum(NotificationStatus).default(NotificationStatus.OPEN)
  })
]);
