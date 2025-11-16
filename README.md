# Next.js Inventory (Customers) — Fullstack with Prisma + SQLite

This project uses Next.js App Router with built-in API routes and Prisma (SQLite) as the database.

## Setup

1. Install dependencies
```
npm install
```

2. Generate Prisma client
```
npx prisma generate
```

3. Create SQLite database and run migration
```
npx prisma migrate dev --name init
```

This will create `dev.db` and run the initial migration.

4. Start Next.js
```
npm run dev
```

Open http://localhost:3000

## Notes
- API endpoints are under `app/api/customers`
- Frontend component with modal CRUD is `components/CustomerModule.jsx`
- If you want seed data, run a script or use Prisma Studio: `npx prisma studio`
