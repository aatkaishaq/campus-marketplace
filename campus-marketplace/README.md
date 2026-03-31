# 🎓 Campus Marketplace

A real-time campus buy/sell platform built with **Next.js 14**, **Supabase**, **TypeScript**, and **Tailwind CSS**.

## Features

- 🔴 **Real-time updates** — product status and price changes push instantly to all connected clients via Supabase Realtime (Postgres WAL)
- 👤 **Presence** — see if a seller is currently online
- 🔒 **Row Level Security** — database-level authorization; no server needed
- ⏳ **TTL logic** — pending items auto-revert to available after 24 hours
- 📱 Responsive design, works on mobile

---

## Quick Start

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run the SQL schema

In your Supabase dashboard → **SQL Editor**, paste and run the entire contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, triggers, and seed data.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Find your keys in: **Supabase Dashboard → Settings → API**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ Never commit `.env.local` to git. It's already in `.gitignore`.

### 4. Enable Realtime on the products table

In Supabase Dashboard → **Database → Replication → Supabase Realtime**:
- Enable `public.products` table (the SQL script does this, but verify it's on)

### 5. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
campus-marketplace/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage (server component)
│   ├── globals.css
│   ├── auth/
│   │   ├── page.tsx            # Sign in / sign up
│   │   ├── callback/route.ts   # OAuth callback handler
│   │   └── signout/route.ts    # Sign out handler
│   └── dashboard/
│       └── page.tsx            # Seller dashboard (protected)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── HeroSection.tsx
│   ├── products/
│   │   ├── ProductCard.tsx     # Single product card with buy button
│   │   ├── ProductGrid.tsx     # Real-time grid with filters
│   │   ├── ProductForm.tsx     # Create / edit listing form
│   │   └── DashboardClient.tsx # Seller management table
│   └── ui/
│       ├── AuthForm.tsx        # Sign in / sign up form
│       └── StatusBadge.tsx     # Colour-coded status pill
│
├── hooks/
│   ├── useRealtimeProducts.ts  # Supabase Realtime subscription
│   └── usePresence.ts          # Seller online/offline tracking
│
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client (Client Components)
│       └── server.ts           # Server client (Server Components)
│
├── types/
│   └── index.ts                # Shared TypeScript types
│
├── supabase/
│   └── schema.sql              # Full DB schema — run this first!
│
└── middleware.ts               # Session refresh + route protection
```

---

## Architecture Notes

### Why RLS instead of an API layer?

Row Level Security lives inside PostgreSQL. Even if someone has your Supabase URL and anon key, they cannot read/write rows that the policy doesn't allow. Your frontend calls Supabase directly — no custom backend needed for most operations.

### How real-time works

1. Supabase Realtime reads PostgreSQL's Write-Ahead Log (WAL)
2. When any row in `products` changes, it broadcasts the diff over a WebSocket
3. `useRealtimeProducts` receives the event and updates React state
4. All subscribed clients (buyers, sellers) re-render simultaneously

### TTL for pending items

Two options depending on your Supabase plan:

**Pro plan** — `pg_cron` (uncomment in `schema.sql`):
```sql
select cron.schedule('revert-stale-pending', '*/10 * * * *', $$
  update products set status='available'
  where status='pending' and updated_at < now() - interval '24 hours';
$$);
```

**Free plan** — Supabase Edge Function scheduled via the dashboard, or call a lightweight API route on app load.

---

## Deployment (Vercel)

```bash
npx vercel
```

Add your three environment variables in the Vercel dashboard.

---

## License

MIT
