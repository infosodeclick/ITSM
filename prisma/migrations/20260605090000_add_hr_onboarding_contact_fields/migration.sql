ALTER TABLE "HrRequest" ADD COLUMN "employeeNameEn" TEXT;
ALTER TABLE "HrRequest" ADD COLUMN "employeeNameTh" TEXT;
ALTER TABLE "HrRequest" ADD COLUMN "nickname" TEXT;
ALTER TABLE "HrRequest" ADD COLUMN "phone" TEXT;
ALTER TABLE "HrRequest" ADD COLUMN "shipNotebookToBranch" BOOLEAN NOT NULL DEFAULT false;
