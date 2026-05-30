import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
