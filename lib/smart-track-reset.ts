import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

const roles = [
  ["SUPER_ADMIN", "Full system access"],
  ["ADMIN", "Asset administrator"],
  ["USER", "General asset user"],
  ["VIEWER", "Read-only access"]
] as const;

const permissions = [
  ["asset.read", "View assets"],
  ["asset.write", "Create and update assets"],
  ["asset.delete", "Delete assets"],
  ["asset.transfer", "Move assets"],
  ["master.manage", "Manage master data"],
  ["report.export", "Export reports"],
  ["scan.manage", "Create scan documents"],
  ["user.manage", "Manage users"]
] as const;

const locations = [
  ["HQ", "Head Office"],
  ["STORE", "Store"],
  ["WAREHOUSE", "Warehouse"],
  ["IT", "IT Room"]
] as const;

const departments = [
  ["ADMIN", "Admin"],
  ["ACCOUNTING", "Accounting"],
  ["HR", "HR"],
  ["IT", "IT"],
  ["OPERATION", "Operation"],
  ["PURCHASING", "Purchasing"],
  ["SALES", "Sales"],
  ["STORE", "Store"]
] as const;

const categories = [
  ["COMPUTER", "Computer", "COM"],
  ["NOTEBOOK", "Notebook", "NB"],
  ["OFFICE", "Office Equipment", "OFF"],
  ["NETWORK", "Network Equipment", "NET"],
  ["CCTV", "CCTV", "CCTV"],
  ["SOFTWARE", "Software", "SW"],
  ["OTHER", "Other", "OTH"]
] as const;

const assetTypes = [
  ["DESKTOP", "Computer", "COM"],
  ["NOTEBOOK", "Notebook", "NB"],
  ["MINI_PC", "Mini PC", "MINI"],
  ["SERVER", "Server", "SRV"],
  ["MONITOR", "Monitor", "MON"],
  ["PRINTER", "Printer", "PRN"],
  ["NETWORK", "Network", "NET"],
  ["CCTV", "CCTV", "CCTV"],
  ["SOFTWARE", "Software", "SW"],
  ["OTHER", "Other", "OTH"]
] as const;

const brands = [
  ["ACER", "Acer"],
  ["APPLE", "Apple"],
  ["ASUS", "ASUS"],
  ["BROTHER", "Brother"],
  ["CANON", "Canon"],
  ["CISCO", "Cisco"],
  ["DELL", "Dell"],
  ["EPSON", "Epson"],
  ["FORTINET", "Fortinet"],
  ["HP", "HP"],
  ["HPE", "HPE"],
  ["LENOVO", "Lenovo"],
  ["MICROSOFT", "Microsoft"],
  ["SAMSUNG", "Samsung"],
  ["TP_LINK", "TP-Link"],
  ["UBIQUITI", "Ubiquiti"],
  ["OTHER", "Other"]
] as const;

const typeBrandDefaults: Record<string, string[]> = {
  DESKTOP: ["DELL", "HP", "LENOVO", "ACER", "ASUS"],
  NOTEBOOK: ["DELL", "HP", "LENOVO", "APPLE", "ACER", "ASUS"],
  MINI_PC: ["DELL", "HP", "LENOVO", "ASUS"],
  SERVER: ["DELL", "HPE", "LENOVO"],
  MONITOR: ["DELL", "HP", "SAMSUNG"],
  PRINTER: ["CANON", "EPSON", "BROTHER", "HP"],
  NETWORK: ["CISCO", "FORTINET", "TP_LINK", "UBIQUITI"],
  CCTV: ["OTHER"],
  SOFTWARE: ["MICROSOFT", "OTHER"],
  OTHER: ["OTHER"]
};

export async function resetSmartTrackData(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.notification.deleteMany();
    await tx.approval.deleteMany();
    await tx.budget.deleteMany();
    await tx.maintenanceRecord.deleteMany();
    await tx.softwareLicense.deleteMany();
    await tx.hrRequest.deleteMany();
    await tx.assetMovement.deleteMany();
    await tx.asset.deleteMany();
    await tx.employee.deleteMany();
    await tx.assetTypeBrand.deleteMany();
    await tx.assetTypeMaster.deleteMany();
    await tx.brand.deleteMany();
    await tx.vendor.deleteMany();
    await tx.assetCategory.deleteMany();
    await tx.department.deleteMany();
    await tx.branch.deleteMany();
    await tx.rolePermission.deleteMany();
    await tx.permission.deleteMany();
    await tx.user.deleteMany();
    await tx.role.deleteMany();

    const createdRoles = await Promise.all(
      roles.map(([name, description]) =>
        tx.role.create({
          data: { name, description }
        })
      )
    );

    const createdPermissions = await Promise.all(
      permissions.map(([key, description]) =>
        tx.permission.create({
          data: { key, description }
        })
      )
    );

    const superAdmin = createdRoles.find((role) => role.name === "SUPER_ADMIN");
    if (!superAdmin) throw new Error("SUPER_ADMIN role was not created");

    await tx.rolePermission.createMany({
      data: createdPermissions.map((permission) => ({
        roleId: superAdmin.id,
        permissionId: permission.id
      }))
    });

    await tx.user.create({
      data: {
        username: "admin",
        email: "admin@local.smart-track",
        name: "ผู้ดูแลระบบ",
        roleId: superAdmin.id,
        isActive: true,
        passwordHash: hashPassword("password")
      }
    });

    await tx.branch.createMany({
      data: locations.map(([code, name]) => ({ code, name }))
    });

    await tx.department.createMany({
      data: departments.map(([code, name]) => ({ code, name }))
    });

    await tx.assetCategory.createMany({
      data: categories.map(([code, name, prefix]) => ({ code, name, prefix }))
    });

    await tx.vendor.create({
      data: { code: "GENERAL", name: "General Vendor" }
    });

    await tx.brand.createMany({
      data: brands.map(([code, name]) => ({ code, name }))
    });

    await tx.assetTypeMaster.createMany({
      data: assetTypes.map(([code, name, prefix]) => ({ code, name, prefix, isActive: true }))
    });

    const [createdBrands, createdTypes] = await Promise.all([tx.brand.findMany(), tx.assetTypeMaster.findMany()]);
    const brandByCode = new Map(createdBrands.map((brand) => [brand.code, brand.id]));
    const typeByCode = new Map(createdTypes.map((type) => [type.code, type.id]));

    await tx.assetTypeBrand.createMany({
      data: Object.entries(typeBrandDefaults).flatMap(([typeCode, brandCodes]) => {
        const assetTypeId = typeByCode.get(typeCode);
        if (!assetTypeId) return [];
        return brandCodes.flatMap((brandCode) => {
          const brandId = brandByCode.get(brandCode);
          return brandId ? [{ assetTypeId, brandId }] : [];
        });
      }),
      skipDuplicates: true
    });
  });
}
