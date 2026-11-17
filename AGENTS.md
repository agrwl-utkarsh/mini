# FESTORA — Smart College Event Management System

## Project Overview
A unified web application for college campus event management replacing scattered announcements, manual registration sheets, uncoordinated spreadsheets, and disconnected finance tracking.

**Tagline:** "Powering Every Event. Elevating Every Experience."

## Technology Stack

### Frontend (apps/web)
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router v6 for navigation
- Recharts for data visualization
- Lucide React for icons
- React Hook Form + Zod for forms and validation
- html5-qrcode for QR scanning
- Socket.IO client for real-time (optional)

### Backend (apps/api)
- Node.js 20+ with Express.js
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication with httpOnly cookies
- Zod for request validation
- bcryptjs for password hashing
- jsonwebtoken for JWT
- qrcode for QR generation
- pdfkit for certificate generation

### Shared Package (packages/shared)
- Common TypeScript types
- Zod validation schemas
- API contracts
- Constants and enums

### Monorepo Structure
```
festora/
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── turbo.json
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── index.html
│   │   └── src/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
```

## Development Commands

```bash
# Install all dependencies
npm install

# Development
npm run dev              # Start both frontend and backend
npm run dev:web          # Frontend only
npm run dev:api          # Backend only

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed development data
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run lint             # Lint all packages
npm run format           # Format with Prettier
npm run typecheck        # TypeScript check all packages
npm run test             # Run tests

# Build
npm run build            # Build all packages
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Production
npm run start            # Start production servers
```

## Phase 0 Checklist
- [x] Monorepo structure with package.json workspaces
- [x] Shared types package with Zod schemas
- [x] Backend: Express + TypeScript + Prisma setup
- [x] Frontend: React + TypeScript + Vite + Tailwind setup
- [x] Prisma schema with core entities
- [x] Database migration workflow
- [x] Linting, formatting, type checking configured
- [x] Application shell with sidebar, top nav, page header
- [x] Reusable UI primitives (Button, Input, Card, Table, Badge, Dialog, Toast)
- [x] Loading, error, empty states
- [x] Public landing page with demo content
- [x] Event discovery page with demo content
- [x] Health check endpoints
- [x] README.md, .env.example, docs/architecture.md

## Role-Based Access Control (7 Roles)
1. ADMIN - System administration
2. FACULTY - Event approval
3. ORGANIZER - Event creation and management
4. VOLUNTEER - Task execution, QR scanning
5. PARTICIPANT - Registration, tickets, feedback
6. SPONSOR - Sponsorship records view
7. FINANCE_TEAM - Budget and expense management

## Event Lifecycle (11 Steps)
1. CREATE EVENT (DRAFT)
2. APPROVAL (PENDING_APPROVAL → APPROVED/REJECTED)
3. PUBLISH (PUBLISHED)
4. REGISTRATION
5. QR TICKET
6. ENTRY VERIFICATION
7. ATTENDANCE
8. EVENT EXECUTION
9. FEEDBACK
10. CERTIFICATES
11. REPORTS

## Modules (12)
1. Event Management
2. Online Registration
3. QR Ticketing
4. Attendance Management
5. Calendar and Venues
6. Team Tasks
7. Finance and Expenses
8. Sponsor Management
9. Competitions and Leaderboards
10. Certificates
11. Feedback
12. Analytics and Reports