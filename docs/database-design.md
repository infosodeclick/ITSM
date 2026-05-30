# Database Design

## Foundation Tables

- `Role`: system roles such as `SUPER_ADMIN`, `IT_ADMIN`, `HR`, `MANAGER`, and `VIEWER`
- `Permission`: fine-grained permission keys
- `RolePermission`: role-to-permission mapping
- `User`: application users
- `Branch`: company branch master data
- `Department`: department master data
- `Employee`: employee master data
- `AssetCategory`: category and code prefix master data
- `Vendor`: supplier and service provider master data
- `Asset`: IT asset records
- `AuditLog`: immutable action log foundation

## Asset Relationship Direction

The existing `Asset` table remains the center of the MVP. New references are optional so existing data keeps working:

- `Asset.categoryId` links to `AssetCategory`
- `Asset.currentEmployeeId` links to `Employee`
- `Asset.departmentId` links to `Department`
- `Asset.branchId` links to `Branch`
- `Asset.vendorId` links to `Vendor`
- `Asset.createdById` and `Asset.updatedById` link to `User`

## Migration Rule

Production schema changes must be introduced by Prisma migrations only. Do not edit the database manually unless there is an incident runbook and rollback plan.
