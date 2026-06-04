# Security Rules

แนวทางนี้ใช้เป็นกติกาความปลอดภัยสำหรับการพัฒนา IT Inventory / ITSM ตั้งแต่เริ่ม feature ใหม่จนถึง deploy production

## Secrets And Configuration

- ห้าม commit `.env`, token, password, database URL หรือ private key
- ใช้ environment variables สำหรับ config ทุกอย่าง เช่น `DATABASE_URL`
- ห้ามแสดง secret ในหน้าเว็บ, API response, log หรือ error message
- `.env.example` ต้องใส่เฉพาะชื่อ key และตัวอย่างค่าที่ไม่ใช่ secret จริง

## Authentication And Authorization

- ก่อนเปิดใช้งาน production ภายนอกองค์กรต้องมี login
- Feature ที่เพิ่ม แก้ ลบ หรือ export ข้อมูลต้องออกแบบให้รองรับ RBAC
- Role ที่ควรรองรับในอนาคต ได้แก่ Super Admin, IT Admin, HR, Manager, Viewer
- ห้ามสร้าง endpoint ลบหรือแก้ข้อมูลจำนวนมากโดยไม่มี authorization และ audit log

## Input Validation

- API ที่รับข้อมูลจากผู้ใช้ต้อง validate ฝั่ง server
- ใช้ schema validation เช่น Zod เมื่อเหมาะสม
- Import CSV/Excel ต้องตรวจ column, type, required field, duplicate และ row error
- ห้ามใช้ค่าจาก client ไปประกอบ query หรือ path โดยไม่ตรวจสอบ

## Database Safety

- ใช้ Prisma schema และ Prisma migration สำหรับการเปลี่ยน database
- Migration ต้องเป็น additive/backward-compatible เมื่อเป็นไปได้
- ก่อนเปลี่ยน field สำคัญ ต้องสรุปผลกระทบกับข้อมูลเดิม
- Production database ต้องมี backup policy ก่อนทำ operation ที่มีความเสี่ยง

## Audit Log

เมื่อระบบกลับมามี feature ใช้งานจริง ต้องเก็บ audit log สำหรับ:

- login/logout
- create/update/delete asset
- assign/transfer/return asset
- import/export report
- change permission
- view หรือ export sensitive data

Audit log ควรเก็บ user, action, module, timestamp, IP, before/after data และผลลัพธ์ของ action

## Deployment Security

- Production ต้องใช้ HTTPS ผ่าน platform หรือ reverse proxy
- Database self-host ต้องไม่เปิด public โดยไม่จำเป็น
- Railway หรือ cloud deploy ต้องรัน `prisma migrate deploy` แบบตรวจสอบได้
- Dependency ที่เพิ่มใหม่ต้องมีเหตุผล และต้องรัน audit หลังเพิ่มหรือ update package

