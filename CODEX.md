# Codex Project Rules

เอกสารนี้เป็นกติกาการทำงานของ Codex สำหรับโปรเจกต์ IT Inventory / ITSM นี้
โปรเจกต์ถูกรีเซ็ตกลับเป็นหน้าเปล่าเพื่อเริ่มออกแบบใหม่ทีละ feature ดังนั้นทุกงานหลังจากนี้ต้องเริ่มจากการอ่านบริบทและวางแผนก่อนแก้โค้ดเสมอ

## Current Project State

- หน้าแรกปัจจุบันเป็นหน้าเปล่าสำหรับเริ่มใหม่
- โค้ดเก่า API เดิม Prisma schema และเอกสารเดิมยังอยู่ใน repo เพื่อใช้เป็นข้อมูลประกอบได้ แต่ห้ามถือว่าเป็น requirement ใหม่โดยอัตโนมัติ
- การเพิ่ม feature ใหม่ต้องทำแบบค่อยเป็นค่อยไป และต้องไม่ทำให้โปรเจกต์รันไม่ได้

## Required Workflow

1. อ่านโครงสร้างและไฟล์ที่เกี่ยวข้องก่อนทุกครั้ง
2. สรุป stack, ไฟล์ที่เกี่ยวข้อง, ผลกระทบ และแผนก่อนแก้โค้ด
3. แก้เฉพาะไฟล์ที่เกี่ยวข้องกับงานนั้นเท่านั้น
4. ห้าม rewrite ทั้งโปรเจกต์ถ้าไม่ได้รับคำสั่งชัดเจน
5. ถ้าแก้ database ต้องอธิบาย schema impact และใช้ Prisma migration
6. หลังแก้โค้ดต้องรันคำสั่งตรวจสอบที่โปรเจกต์มี เช่น lint, build หรือ test
7. ถ้าเจอ error ให้แก้เฉพาะ error ที่เกี่ยวข้องกับงานปัจจุบัน
8. หลังงานเสร็จต้องสรุปว่าแก้อะไร ไฟล์ไหน และมีผลกระทบอะไร

## Standard Verification

ใช้คำสั่งบน Windows/PowerShell ด้วย `.cmd` เมื่อจำเป็น:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=moderate
```

ถ้าเพิ่มหรือแก้ database:

```powershell
npm.cmd run db:generate
npm.cmd run db:deploy
```

## Deployment Rules

- ระบบต้องรองรับ Railway, cloud อื่น, และ self-host ในอนาคต
- ห้าม hardcode ค่าเฉพาะ Railway ใน business logic
- ใช้ environment variables สำหรับ config เช่น `DATABASE_URL`
- Railway production ต้องรัน migration ด้วย `prisma migrate deploy`
- Dockerfile และ railway config ต้องแก้แบบระวัง เพราะกระทบ production deploy โดยตรง

## Safety Rules

- ห้าม commit `.env`, token, password, connection string หรือ secret
- ก่อนลบข้อมูล ต้องบอก scope และความเสี่ยงให้ชัดเจน
- ห้ามลบ migration เก่าหรือแก้ schema แบบทำลายข้อมูลโดยไม่มีแผน rollback
- Endpoint ที่เขียนหรือลบข้อมูลต้องมี validation และในอนาคตต้องผูก auth/RBAC
- งาน import/export ต้องตรวจ format และ error handling ก่อนใช้งานจริง

## Feature Planning Template

ก่อนเริ่ม feature ให้สรุปอย่างน้อย:

- เป้าหมายของ feature
- ไฟล์หรือ module ที่คาดว่าจะกระทบ
- database/schema ที่ต้องเปลี่ยนหรือไม่
- risk ที่ต้องระวัง
- คำสั่ง verification ที่จะรันหลังแก้

