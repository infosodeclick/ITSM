import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    ["SUPER_ADMIN", "Full system access"],
    ["IT_ADMIN", "IT asset and workflow administration"],
    ["IT_STAFF", "Daily IT operations"],
    ["HR", "HR onboarding and offboarding requests"],
    ["MANAGER", "Department approval and reporting"],
    ["VIEWER", "Read-only reporting access"]
  ] as const;

  const permissions = [
    ["asset.read", "View assets"],
    ["asset.write", "Create and update assets"],
    ["asset.delete", "Delete assets"],
    ["asset.transfer", "Assign, transfer, and return assets"],
    ["employee.read", "View employees"],
    ["employee.write", "Create and update employees"],
    ["hr.onboarding", "Create onboarding requests"],
    ["hr.offboarding", "Create offboarding requests"],
    ["license.manage", "Manage software licenses"],
    ["report.export", "Export reports"],
    ["audit.read", "View audit logs"],
    ["user.manage", "Manage users and roles"]
  ] as const;

  const createdRoles = await Promise.all(
    roles.map(([name, description]) =>
      prisma.role.upsert({
        where: { name },
        update: { description },
        create: { name, description }
      })
    )
  );

  const createdPermissions = await Promise.all(
    permissions.map(([key, description]) =>
      prisma.permission.upsert({
        where: { key },
        update: { description },
        create: { key, description }
      })
    )
  );

  const superAdmin = createdRoles.find((role) => role.name === "SUPER_ADMIN");
  if (superAdmin) {
    await prisma.rolePermission.createMany({
      data: createdPermissions.map((permission) => ({
        roleId: superAdmin.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });
  }

  const branches = [
    ["HQ", "Head Office"],
    ["WH", "Warehouse"],
    ["STORE", "Retail Store"]
  ] as const;

  await Promise.all(
    branches.map(([code, name]) =>
      prisma.branch.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      })
    )
  );

  const departments = [
    ["IT", "IT"],
    ["HR", "HR"],
    ["ACC", "Accounting"],
    ["SALES", "Sales"],
    ["MKT", "Marketing"],
    ["WH", "Warehouse"],
    ["MGMT", "Management"],
    ["OPS", "Operation"]
  ] as const;

  await Promise.all(
    departments.map(([code, name]) =>
      prisma.department.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      })
    )
  );

  const categories = [
    ["NOTEBOOK", "Notebook", "NB"],
    ["DESKTOP", "Desktop", "PC"],
    ["MONITOR", "Monitor", "MON"],
    ["PRINTER", "Printer", "PRN"],
    ["NETWORK", "Network Device", "NET"],
    ["SERVER", "Server", "SRV"],
    ["SOFTWARE", "Software", "SW"],
    ["LICENSE", "License", "LIC"],
    ["OTHER", "Other", "OTH"]
  ] as const;

  await Promise.all(
    categories.map(([code, name, prefix]) =>
      prisma.assetCategory.upsert({
        where: { code },
        update: { name, prefix },
        create: { code, name, prefix }
      })
    )
  );

  await prisma.vendor.upsert({
    where: { code: "GENERAL" },
    update: { name: "General Vendor" },
    create: { code: "GENERAL", name: "General Vendor" }
  });

  await prisma.asset.upsert({
    where: { assetTag: "IT-0001" },
    update: {},
    create: {
      assetTag: "IT-0001",
      name: "Notebook สำหรับทีม IT",
      type: "NOTEBOOK",
      status: "IN_USE",
      serialNumber: "DEMO-SN-001",
      manufacturer: "Lenovo",
      model: "ThinkPad",
      assignedTo: "IT Support",
      location: "HQ",
      notes: "ข้อมูลตัวอย่างสำหรับตรวจระบบหลัง deploy"
    }
  });

  const adminRole = createdRoles.find((role) => role.name === "SUPER_ADMIN");
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "System Admin", roleId: adminRole?.id },
    create: {
      email: "admin@example.com",
      name: "System Admin",
      roleId: adminRole?.id
    }
  });

  if ((await prisma.softwareLicense.count()) === 0) {
    await prisma.softwareLicense.create({
      data: {
        name: "Microsoft 365 Business",
        vendorName: "Microsoft",
        totalSeats: 25,
        usedSeats: 10,
        expiryDate: new Date("2026-12-31"),
        renewalCycle: "Yearly",
        status: "ACTIVE",
        notes: "Demo license for production verification"
      }
    });
  }

  if ((await prisma.hrRequest.count()) === 0) {
    await prisma.hrRequest.create({
      data: {
        type: "ONBOARDING",
        employeeCode: "EMP-DEMO",
        employeeName: "Demo Employee",
        department: "IT",
        branch: "HQ",
        startDate: new Date("2026-06-01"),
        requestedItems: "Notebook, Email, Microsoft 365",
        status: "SUBMITTED"
      }
    });
  }

  if ((await prisma.budget.count()) === 0) {
    await prisma.budget.create({
      data: {
        fiscalYear: 2026,
        category: "Hardware",
        department: "IT",
        branch: "HQ",
        allocated: 500000,
        actual: 0
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
