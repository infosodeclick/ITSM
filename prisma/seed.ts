import { PrismaClient } from "@prisma/client";
import { resetSmartTrackData } from "../lib/smart-track-reset";

const prisma = new PrismaClient();

async function main() {
  await resetSmartTrackData(prisma);
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
