# FESTORA — Smart College Event Management System

**Powering Every Event. Elevating Every Experience.**

A unified web application for college campus event management replacing scattered announcements, manual registration sheets, uncoordinated spreadsheets, and disconnected finance tracking.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js 20 + Express + TypeScript + Prisma + PostgreSQL
- **Shared:** Zod schemas + TypeScript types
- **Auth:** JWT with httpOnly cookies
- **Monorepo:** Turborepo + npm workspaces

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development servers
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:4000`.

## Project Structure

```
festora/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types & schemas
├── turbo.json        # Turborepo config
└── package.json      # Root workspace config
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | Backend only |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript check all packages |
| `npm run test` | Run tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed development data |
| `npm run db:studio` | Open Prisma Studio |

## Core Features

### Event Management (11-step lifecycle)
1. **Create** - Draft events with details, venues, dates
2. **Approve** - Faculty approval workflow
3. **Publish** - Make events visible to students
4. **Register** - Online registration with waitlists
5. **QR Ticket** - Auto-generated QR codes
6. **Verify** - Volunteer check-in with QR scanning
7. **Attend** - Real-time attendance tracking
8. **Execute** - Task management for organizers
9. **Feedback** - Post-event surveys
10. **Certificates** - PDF certificate generation
11. **Reports** - Analytics dashboards

### Role-Based Access (7 Roles)
- **ADMIN** - System administration
- **FACULTY** - Event approval & oversight
- **ORGANIZER** - Event creation & management
- **VOLUNTEER** - Task execution, QR scanning
- **PARTICIPANT** - Registration, tickets, feedback
- **SPONSOR** - Sponsorship records view
- **FINANCE_TEAM** - Budget & expense management

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `POST /api/events/:id/submit-for-approval` - Submit for approval
- `POST /api/events/:id/approve` - Approve event (Faculty)
- `POST /api/events/:id/reject` - Reject event (Faculty)
- `POST /api/events/:id/publish` - Publish event

### Registrations
- `GET /api/registrations` - List registrations
- `POST /api/registrations` - Register for event
- `POST /api/registrations/bulk` - Bulk register (Organizer)
- `PATCH /api/registrations/:id` - Update registration
- `POST /api/registrations/check-in` - QR check-in
- `DELETE /api/registrations/:id` - Cancel registration

### Health
- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Access token secret (32+ chars) | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | Required |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `PORT` | API server port | `4000` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `BCRYPT_ROUNDS` | Password hash rounds | `12` |
| `NODE_ENV` | Environment | `development` |

## Database Schema

Key models:
- **User** - 7 roles, profile info, auth
- **Event** - 11 statuses, full lifecycle
- **Venue** - Capacity, amenities, availability
- **Registration** - Waitlists, QR codes, check-in
- **Task** - Kanban-style with priorities
- **Budget/Expense** - Multi-currency, approval flow
- **Sponsor/Sponsorship** - Tier-based, benefits
- **Feedback** - Typed, rated, anonymous option
- **Certificate** - Template-based, verifiable

## Development

```bash
# Run frontend only
npm run dev:web

# Run backend only
npm run dev:api

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format

# Database operations
npm run db:studio    # Visual database browser
npm run db:seed      # Seed test data
npm run db:migrate   # Create migration files
```

## Production Build

```bash
npm run build
npm run start
```

## License

MIT