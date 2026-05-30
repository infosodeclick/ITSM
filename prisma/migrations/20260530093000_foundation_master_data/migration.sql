ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'READY_TO_USE';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'TRANSFERRED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'WAITING_REPAIR';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'REPAIRING';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'SPARE';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'PENDING_DISPOSAL';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'DISPOSED';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'LOST';

ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'SCANNER';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'MOBILE_PHONE';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'TABLET';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'FIREWALL';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'SWITCH';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'ROUTER';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'ACCESS_POINT';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'CCTV';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'UPS';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'MICROSOFT_365';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'ADOBE_LICENSE';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'ANTIVIRUS_EDR';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'SAP_B1';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'CRM';
ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'EMAIL_ACCOUNT';

CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "roleId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Branch" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Employee" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "position" TEXT,
  "departmentId" TEXT,
  "branchId" TEXT,
  "managerName" TEXT,
  "employmentType" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetCategory" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vendor" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "module" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "beforeData" JSONB,
  "afterData" JSONB,
  "reason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Asset"
  ADD COLUMN "categoryId" TEXT,
  ADD COLUMN "currentEmployeeId" TEXT,
  ADD COLUMN "departmentId" TEXT,
  ADD COLUMN "branchId" TEXT,
  ADD COLUMN "vendorId" TEXT,
  ADD COLUMN "spec" TEXT,
  ADD COLUMN "cpu" TEXT,
  ADD COLUMN "ram" TEXT,
  ADD COLUMN "storage" TEXT,
  ADD COLUMN "os" TEXT,
  ADD COLUMN "purchasePrice" DECIMAL(12,2),
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "warrantyStartDate" TIMESTAMP(3),
  ADD COLUMN "condition" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "updatedById" TEXT;

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");
CREATE UNIQUE INDEX "AssetCategory_code_key" ON "AssetCategory"("code");
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");
CREATE INDEX "Asset_currentEmployeeId_idx" ON "Asset"("currentEmployeeId");
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");
CREATE INDEX "Asset_branchId_idx" ON "Asset"("branchId");
CREATE INDEX "Asset_vendorId_idx" ON "Asset"("vendorId");
CREATE INDEX "Asset_createdById_idx" ON "Asset"("createdById");
CREATE INDEX "Asset_updatedById_idx" ON "Asset"("updatedById");
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
