CREATE TYPE "AssetMovementType" AS ENUM ('ASSIGN', 'TRANSFER', 'RETURN');
CREATE TYPE "HrRequestType" AS ENUM ('ONBOARDING', 'OFFBOARDING');
CREATE TYPE "HrRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED_BY_IT', 'PREPARING', 'WAITING_APPROVAL', 'READY_TO_DELIVER', 'DELIVERED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED');
CREATE TYPE "MaintenanceStatus" AS ENUM ('REPORTED', 'CHECKING', 'WAITING_VENDOR', 'SENT_TO_REPAIR', 'REPAIRED', 'RETURNED', 'CANNOT_REPAIR', 'DISPOSED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "NotificationStatus" AS ENUM ('OPEN', 'DONE', 'DISMISSED');

CREATE TABLE "AssetMovement" (
  "id" TEXT NOT NULL,
  "type" "AssetMovementType" NOT NULL,
  "assetId" TEXT,
  "assetTag" TEXT,
  "assetName" TEXT,
  "fromHolder" TEXT,
  "toHolder" TEXT,
  "fromDepartment" TEXT,
  "toDepartment" TEXT,
  "fromBranch" TEXT,
  "toBranch" TEXT,
  "reason" TEXT,
  "conditionBefore" TEXT,
  "conditionAfter" TEXT,
  "handledBy" TEXT,
  "approvedBy" TEXT,
  "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrRequest" (
  "id" TEXT NOT NULL,
  "type" "HrRequestType" NOT NULL,
  "employeeCode" TEXT,
  "employeeName" TEXT NOT NULL,
  "position" TEXT,
  "department" TEXT,
  "branch" TEXT,
  "managerName" TEXT,
  "employmentType" TEXT,
  "startDate" TIMESTAMP(3),
  "lastWorkingDate" TIMESTAMP(3),
  "requestedItems" TEXT,
  "systemsNeeded" TEXT,
  "status" "HrRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "owner" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SoftwareLicense" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vendorId" TEXT,
  "vendorName" TEXT,
  "totalSeats" INTEGER NOT NULL DEFAULT 1,
  "usedSeats" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "costPerSeat" DECIMAL(12,2),
  "renewalCycle" TEXT,
  "owner" TEXT,
  "department" TEXT,
  "branch" TEXT,
  "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SoftwareLicense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL,
  "assetId" TEXT,
  "assetTag" TEXT,
  "assetName" TEXT,
  "issue" TEXT NOT NULL,
  "reportedBy" TEXT,
  "handledBy" TEXT,
  "vendorId" TEXT,
  "vendorName" TEXT,
  "cost" DECIMAL(12,2),
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'REPORTED',
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "result" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Budget" (
  "id" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "department" TEXT,
  "branch" TEXT,
  "allocated" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Approval" (
  "id" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(12,2),
  "requester" TEXT,
  "approver" TEXT,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "NotificationStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetMovement_type_idx" ON "AssetMovement"("type");
CREATE INDEX "AssetMovement_assetId_idx" ON "AssetMovement"("assetId");
CREATE INDEX "AssetMovement_movedAt_idx" ON "AssetMovement"("movedAt");
CREATE INDEX "HrRequest_type_idx" ON "HrRequest"("type");
CREATE INDEX "HrRequest_status_idx" ON "HrRequest"("status");
CREATE INDEX "HrRequest_startDate_idx" ON "HrRequest"("startDate");
CREATE INDEX "HrRequest_lastWorkingDate_idx" ON "HrRequest"("lastWorkingDate");
CREATE INDEX "SoftwareLicense_status_idx" ON "SoftwareLicense"("status");
CREATE INDEX "SoftwareLicense_expiryDate_idx" ON "SoftwareLicense"("expiryDate");
CREATE INDEX "SoftwareLicense_vendorId_idx" ON "SoftwareLicense"("vendorId");
CREATE INDEX "MaintenanceRecord_assetId_idx" ON "MaintenanceRecord"("assetId");
CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");
CREATE INDEX "MaintenanceRecord_reportedAt_idx" ON "MaintenanceRecord"("reportedAt");
CREATE INDEX "Budget_fiscalYear_idx" ON "Budget"("fiscalYear");
CREATE INDEX "Budget_category_idx" ON "Budget"("category");
CREATE INDEX "Approval_module_idx" ON "Approval"("module");
CREATE INDEX "Approval_status_idx" ON "Approval"("status");
CREATE INDEX "Notification_module_idx" ON "Notification"("module");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
CREATE INDEX "Notification_dueDate_idx" ON "Notification"("dueDate");

ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SoftwareLicense" ADD CONSTRAINT "SoftwareLicense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
