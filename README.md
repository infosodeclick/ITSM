# ITSM Inventory

ระบบ IT Inventory สำหรับใช้งานภายในองค์กร ออกแบบให้รันบน Railway ได้ทันที และยังย้ายไป cloud อื่น, VPS, หรือ server ภายในองค์กรได้โดยใช้ PostgreSQL และ environment variables มาตรฐาน

## Stack

- Next.js App Router
- React
- Prisma ORM
- PostgreSQL
- Docker/Railway deployment

## Local Development

1. Copy `.env.example` เป็น `.env`
2. ตั้งค่า `DATABASE_URL`
3. ติดตั้ง dependencies

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

เปิดใช้งานที่ `http://localhost:3000`

## Production

```bash
npm run build
npm run start
```

สำหรับ Railway ให้เพิ่ม PostgreSQL service แล้วตั้ง `DATABASE_URL` ให้ service ของแอป จากนั้น deploy จาก GitHub repository นี้
