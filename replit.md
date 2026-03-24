# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── delivery-app/       # React + Vite delivery website (Arabic RTL)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Delivery App (Arabic RTL)

A fully featured Arabic RTL delivery website at `/`.

### Customer-facing page (`/`)
- Order form (name, phone, address, order details, notes)
- Saves order to database (no WhatsApp redirect from customer side)
- Shows order number on success

### Admin panel (`/admin`)
- PIN-locked (default PIN: `1234`, stored in `settings` table key `adminPin`)
- 4 tabs: Orders, Drivers, WhatsApp Numbers, Settings

#### Orders tab
- Card per order with: status badge, customer info, order details, address, notes, date
- Driver assignment dropdown (dropdown from drivers table)
- Order status changer: pending → assigned → delivering → delivered → cancelled
- WhatsApp button: opens wa.me links for all registered phone numbers with template message

#### Drivers tab
- Add driver (name + optional phone)
- List all drivers with delete button

#### WhatsApp Numbers tab
- Add phone (number + optional label)
- List all phones with delete button
- Default seeded: `967775864948` (Yemen)

#### Settings tab
- Logo upload (base64 in settings table)
- Site name, tagline, footer text
- Primary color picker (hex + visual)
- Admin PIN code
- Hero section texts (title, highlight, description, availability)
- Form section texts (title, subtitle, success message)
- WhatsApp message template with variable hints

### Database schema
- `orders`: id, customerName, customerPhone, address, orderDetails, notes, status, assignedDriverId, assignedDriverName, createdAt
- `phones`: id, phoneNumber, label, createdAt
- `settings`: key, value (key-value store)
- `drivers`: id, name, phone, createdAt

### Key files
- `artifacts/delivery-app/src/pages/home.tsx` — customer order form
- `artifacts/delivery-app/src/pages/admin.tsx` — full admin panel with PIN lock
- `artifacts/delivery-app/src/components/layout.tsx` — header + footer, reads settings
- `artifacts/delivery-app/src/hooks/use-settings.ts` — settings hook + update mutation
- `artifacts/delivery-app/src/hooks/use-orders.ts` — orders hook + create + update
- `artifacts/delivery-app/src/hooks/use-drivers.ts` — drivers CRUD hooks
- `artifacts/api-server/src/routes/orders.ts` — GET, POST, PATCH /api/orders/:id
- `artifacts/api-server/src/routes/drivers.ts` — GET, POST, DELETE /api/drivers/:id
- `artifacts/api-server/src/routes/settings.ts` — GET, PUT /api/settings
- `lib/db/src/schema/index.ts` — barrel re-export of all tables

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files are emitted during typecheck
- **Project references** — cross-package imports require references in `tsconfig.json`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes: `/api/orders`, `/api/phones`, `/api/settings`, `/api/drivers`, `/api/health`.

### `artifacts/delivery-app` (`@workspace/delivery-app`)

React + Vite app (Arabic RTL). Uses `@tanstack/react-query`, `wouter`, `react-hook-form`, `zod`, `framer-motion`, shadcn/ui.

### `lib/db` (`@workspace/db`)

- `drizzle.config.ts` — requires `DATABASE_URL`
- Push: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec + Orval codegen. Run: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas used by api-server for request validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks used by delivery-app frontend.

### `scripts` (`@workspace/scripts`)

Utility scripts package.
