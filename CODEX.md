# Codex Working Rules

โปรเจกต์นี้เป็นระบบ ITSM Inventory สำหรับใช้งานจริง ห้ามแก้โค้ดแบบกว้างหรือ rewrite ทั้งโปรเจกต์โดยไม่มีเหตุจำเป็น

## Workflow

1. อ่านบริบทและไฟล์ที่เกี่ยวข้องก่อนทุกครั้ง
2. สรุปแผนก่อนแก้โค้ด
3. แก้เฉพาะไฟล์ที่เกี่ยวข้องกับงานนั้น
4. หลังแก้ต้องสรุปว่าแก้อะไร ไฟล์ไหน และมีผลกระทบอะไร
5. หลังแก้โค้ดต้อง run build/test เท่าที่มีให้ทำได้

## Deployment Principles

- ห้าม hardcode ค่าเฉพาะ Railway ใน business logic
- ใช้ environment variables สำหรับ config ทั้งหมด
- Database ต้องอ้างผ่าน `DATABASE_URL`
- Migration ต้องอยู่ใน Prisma migration และ deploy ด้วย `prisma migrate deploy`
- Feature ใหม่ต้องคำนึงถึงการย้ายไป self-host หรือ cloud อื่น

## Safety

- ห้าม commit secret, token, password, หรือไฟล์ `.env`
- ห้ามเปลี่ยน schema database โดยไม่อธิบายผลกระทบ
- ห้ามลบข้อมูลหรือ migration เดิมโดยไม่มีแผน rollback
- ก่อนแก้ auth, permission, database, deployment ต้องบอก risk ให้ชัดเจน
