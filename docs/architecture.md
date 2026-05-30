# Architecture

## Current Shape

```text
Browser
  -> Next.js App Router
  -> API Routes
  -> Prisma Client
  -> PostgreSQL
```

## Important Paths

- `app/page.tsx` หน้า dashboard หลัก
- `components/inventory-client.tsx` UI สำหรับจัดการ asset
- `app/api/assets/route.ts` API list/create asset
- `app/api/assets/[id]/route.ts` API update/delete asset
- `prisma/schema.prisma` database model
- `lib/prisma.ts` Prisma client singleton
- `lib/assets.ts` validation schema

## Future Modules

- Authentication and role permission
- Asset history and audit log
- Import/export CSV
- Maintenance tickets
- Software license tracking
- Department and location master data
