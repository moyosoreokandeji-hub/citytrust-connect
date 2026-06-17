# CityTrust — Verified Service Access for Redemption City

CityTrust is a Kingdom Hack 3.0 project for the Verified Service Access track. It helps Redemption City residents, churches, hostels, businesses, facility managers and visitors find trusted artisans, request services, track jobs, message providers, leave verified reviews and submit complaints.

## Current build

- React + TanStack Start + Vite + TypeScript
- Tailwind CSS and shadcn-style UI components
- In-browser project data with in-browser persistence
- Resident, Artisan and Admin Console flows
- Smart matching logic using rule-based scoring
- Architecture and API contract pages for the production backend plan

## Production architecture plan

- Frontend: Next.js / React + Tailwind CSS
- Backend: Node.js/Express or Next.js API routes
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT/Auth.js role-based access control
- Future integrations: WhatsApp/SMS alerts, escrow protection, emergency dispatch and city analytics

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Main routes

- `/` — product homepage
- `/resident-account` — resident sign-in and account creation
- `/resident` — resident/customer dashboard
- `/dashboard` — find artisans
- `/artisan-account` — artisan sign-in and account creation
- `/artisan` — artisan dashboard and onboarding
- `/admin-console` — staff/admin console
- `/architecture` — system architecture
- `/api-contracts` — backend API contracts
