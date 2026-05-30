# Deployment Guide

## Railway

1. เชื่อม GitHub repo `infosodeclick/ITSM` เข้ากับ Railway project
2. เพิ่ม PostgreSQL service ใน Railway project
3. ตั้ง environment variable ของ app service:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_NAME=ITSM Inventory
NEXT_PUBLIC_APP_NAME=ITSM Inventory
```

4. Deploy app service จาก GitHub
5. Railway จะใช้ `Dockerfile` และรัน `prisma migrate deploy` ก่อน start app

## Self-host / VPS / Private Cloud

ต้องมี:

- Node.js 20 หรือ Docker
- PostgreSQL 14 ขึ้นไป
- Environment variable `DATABASE_URL`

### Docker

```bash
docker build -t itsm-inventory .
docker run -p 3000:3000 --env-file .env itsm-inventory
```

### Node.js

```bash
npm install
npm run build
npm run db:deploy
npm run start
```

## Portability Notes

- แอปไม่ใช้ Railway SDK ใน business logic
- Database access รวมศูนย์ผ่าน Prisma
- Deployment config แยกอยู่ที่ `Dockerfile` และ `railway.json`
- ย้าย platform ได้โดยตั้ง `DATABASE_URL` ใหม่และรัน migration
