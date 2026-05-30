# Security Rules

## Secrets

- ห้าม commit `.env`
- ทุก secret ต้องตั้งผ่าน environment variables ของ platform
- ห้ามแสดงค่า `DATABASE_URL`, token, password ใน UI หรือ logs

## Database

- ใช้ Prisma schema และ migration สำหรับเปลี่ยน database
- API ต้อง validate input ก่อนเขียน database
- Unique key เช่น `assetTag` ต้องจัดการ error แบบไม่ crash
- ห้ามสร้าง endpoint ที่ลบข้อมูลจำนวนมากโดยไม่มี authorization

## Authentication Roadmap

MVP ปัจจุบันยังไม่มี auth ควรเพิ่มก่อนใช้ production ภายนอกองค์กร

สิ่งที่ควรเพิ่ม:

- Login สำหรับผู้ดูแลระบบ
- Role: admin, it_staff, viewer
- Audit log สำหรับ create/update/delete asset
- Rate limit สำหรับ API ที่เขียนข้อมูล

## Deployment

- Production ต้องใช้ HTTPS ผ่าน platform หรือ reverse proxy
- Database production ต้องมี backup policy
- Migration production ต้องรันผ่านขั้นตอน deploy ที่ตรวจสอบได้
- Self-host ต้องตั้ง firewall ให้ database ไม่เปิด public โดยไม่จำเป็น
