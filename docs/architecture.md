# FESTORA Architecture

## System Overview

FESTORA is a monorepo-based college event management system with a React frontend and Express/Prisma backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FESTORA MONOREPO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   apps/web       │         │   apps/api       │             │
│  │   (React 18)     │◄───────►│   (Express)      │             │
│  │                  │  API    │                  │             │
│  │ - Vite           │         │ - Prisma ORM     │             │
│  │ - Tailwind       │         │ - PostgreSQL     │             │
│  │ - React Router   │         │ - JWT Auth       │             │
│  │ - React Hook Form│         │ - Zod Validation │             │
│  └──────────────────┘         └──────────────────┘             │
│          ▲                              ▲                       │
│          │                              │                       │
│          └──────────────┬───────────────┘                       │
│                         │                                       │
│              ┌──────────▼──────────┐                            │
│              │  packages/shared    │                            │
│              │                     │                            │
│              │ - Zod Schemas       │                            │
│              │ - TypeScript Types  │                            │
│              │ - API Contracts     │                            │
│              │ - Enums & Constants │                            │
│              └─────────────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture (apps/web)

### Tech Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **State:** Zustand (auth) + React Query (server state)
- **UI Components:** Custom primitives + Radix UI
- **Charts:** Recharts
- **Icons:** Lucide React

### Project Structure
```
apps/web/src/
├── components/
│   ├── ui/           # Reusable primitives (Button, Input, Card, etc.)
│   └── layout/       # Layout components (Sidebar, TopNav, PageHeader)
├── pages/            # Route components
├── stores/           # Zustand stores (auth)
├── hooks/            # Custom React hooks
├── lib/              # Utilities (clsx, etc.)
├── App.tsx           # Route definitions
├── main.tsx          # Entry point
└── index.css         # Global styles + Tailwind
```

### Key Patterns

**Component Composition:**
```tsx
// Primitives are composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

**Route Protection:**
```tsx
<PrivateRoute>
  <Layout>
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  </Layout>
</PrivateRoute>
```

**Form Handling:**
```tsx
const form = useForm<Schema>({ resolver: zodResolver(schema) });
<Input {...form.register('field')} error={form.formState.errors.field?.message} />
```

## Backend Architecture (apps/api)

### Tech Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (ES Modules)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT with httpOnly cookies
- **Validation:** Zod schemas
- **Security:** Helmet, CORS, Rate Limiting

### Project Structure
```
apps/api/src/
├── config/           # Environment & Prisma config
├── middleware/       # Express middleware
│   ├── auth.ts       # JWT authentication
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── routes/           # API route handlers
│   ├── auth.ts       # /api/auth/*
│   ├── events.ts     # /api/events/*
│   ├── registrations.ts
│   ├── venues.ts
│   ├── tasks.ts
│   ├── budgets.ts
│   ├── expenses.ts
│   ├── sponsors.ts
│   ├── feedback.ts
│   ├── certificates.ts
│   ├── users.ts
│   └── health.ts
├── services/         # Business logic (future)
├── utils/            # Helpers (future)
└── index.ts          # App entry point
```

### Key Patterns

**Middleware Chain:**
```typescript
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/registrations", authMiddleware, registrationRoutes);
// ...
```

**Role-Based Access:**
```typescript
router.post("/", requireRole("ADMIN", "FACULTY", "ORGANIZER"), handler);
router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
  if (!canManageEvent(req.user, event)) {
    return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
  }
  // ...
});
```

**Request Validation:**
```typescript
const data = createEventSchema.parse(req.body);
// Zod handles validation + type inference
```

**Error Handling:**
```typescript
// Centralized error handler
app.use(errorHandler);

// Custom errors
throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");
```

## Shared Package (packages/shared)

### Purpose
Single source of truth for:
- Zod validation schemas
- TypeScript type definitions
- API request/response contracts
- Enums and constants

### Structure
```
packages/shared/src/
└── index.ts  # All exports
```

### Key Exports
```typescript
// Enums
export const RoleSchema = z.enum([...]);
export type Role = z.infer<typeof RoleSchema>;

// Entities
export const EventSchema = z.object({...});
export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;

// API Responses
export const ApiResponseSchema = <T>(dataSchema: T) => z.object({...});
export const PaginatedResponseSchema = <T>(itemSchema: T) => ...;
```

### Usage
```typescript
// Frontend
import { Event, CreateEvent } from "@festora/shared";

// Backend
import { CreateEventSchema } from "@festora/shared";
const data = CreateEventSchema.parse(req.body);
```

## Database Schema (Prisma)

### Core Models

```
User ◄──────────────► Event (organizer)
User ◄──────────────► Event (approver)
User ◄──────────────► Registration
User ◄──────────────► Task (assignee/reporter)
User ◄──────────────► Expense (creator/approver)
User ◄──────────────► Feedback
User ◄──────────────► Certificate

Event ◄─────────────► Venue
Event ◄─────────────► Registration
Event ◄─────────────► Task
Event ◄─────────────► Budget ◄──────► Expense
Event ◄─────────────► Sponsorship ◄──► Sponsor
Event ◄─────────────► Feedback
Event ◄─────────────► Certificate ◄──► CertificateTemplate
```

### Key Enums
- **Role:** ADMIN, FACULTY, ORGANIZER, VOLUNTEER, PARTICIPANT, SPONSOR, FINANCE_TEAM
- **EventStatus:** DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PUBLISHED, ONGOING, COMPLETED, CANCELLED
- **RegistrationStatus:** PENDING, CONFIRMED, CANCELLED, WAITLISTED, ATTENDED, NO_SHOW
- **TaskStatus:** TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED
- **TaskPriority:** LOW, MEDIUM, HIGH, URGENT
- **ExpenseStatus:** PENDING, APPROVED, REJECTED, PAID, REIMBURSED
- **SponsorshipStatus:** PROSPECT, NEGOTIATING, COMMITTED, RECEIVED, COMPLETED
- **CertificateStatus:** PENDING, GENERATED, ISSUED, VERIFIED, REVOKED

### Indexes
Strategic indexes on frequently queried fields:
- User: email, role, department
- Event: status, organizerId, venueId, startDate, tags
- Registration: eventId, userId, status, ticketCode
- Task: eventId, assigneeId, status, priority
- Expense: budgetId, status, createdById

## Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────►│  API    │────►│ Database│
└─────────┘     └─────────┘     └─────────┘
    │              │              │
    │ 1. POST     │              │
    │ /login      │              │
    │ {email,     │              │
    │  password}  │              │
    │             │              │
    │             │ 2. Verify    │
    │             │ credentials  │
    │             │              │
    │             │ 3. Generate  │
    │             │ JWT pair     │
    │             │              │
    │             │ 4. Store     │
    │             │ refresh      │
    │             │ token        │
    │             │              │
    │ ◄────────── │              │
    │ 5. Set      │              │
    │ httpOnly    │              │
    │ cookies     │              │
    │             │              │
    │ 6. Request  │              │
    │ with cookie │              │
    │             │              │
    │             │ 7. Verify    │
    │             │ access token │
    │             │              │
    │             │ 8. Attach    │
    │             │ user to req  │
    │             │              │
```

### Token Strategy
- **Access Token:** 15 min expiry, in httpOnly cookie
- **Refresh Token:** 7 day expiry, in httpOnly cookie + database
- **Rotation:** Refresh token rotated on each use
- **Revocation:** Stored in database with revokedAt timestamp

## API Design Principles

### RESTful Conventions
| Method | Path | Description |
|--------|------|-------------|
| GET | /events | List with pagination/filter |
| GET | /events/:id | Get single |
| POST | /events | Create |
| PATCH | /events/:id | Partial update |
| DELETE | /events/:id | Delete |
| POST | /events/:id/approve | Custom action |

### Response Format
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { "field": ["error message"] }
  }
}
```

### Pagination
- Default: `page=1`, `limit=20`, max 100
- Cursor-based for large datasets (future)

### Filtering & Sorting
- Query params: `?status=PUBLISHED&sortBy=createdAt&sortOrder=desc`
- Type-safe via shared schemas

## Security Considerations

### Implemented
- ✅ JWT with httpOnly, Secure, SameSite cookies
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet headers
- ✅ CORS configured for frontend origin
- ✅ Zod validation on all inputs
- ✅ Role-based access control
- ✅ Ownership checks on mutations
- ✅ SQL injection prevention via Prisma

### Future Enhancements
- [ ] CSRF protection for cookie-based auth
- [ ] API key authentication for integrations
- [ ] Audit logging for sensitive operations
- [ ] Two-factor authentication
- [ ] Password strength requirements
- [ ] Account lockout on failed attempts

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CDN       │     │   Frontend  │     │   Backend   │
│   (Static)  │────►│   (Vercel/  │────►│   (Railway/ │
│             │     │   Netlify)  │     │   Render)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │             │     │  PostgreSQL │
                    │             │     │  (Managed)  │
                    │             │     │             │
                    └─────────────┘     └─────────────┘
```

### Environment Configuration
- **Development:** Local PostgreSQL, Vite dev server
- **Staging:** Managed DB, preview deployments
- **Production:** Managed DB, CDN + containerized API

## Performance Considerations

### Frontend
- Code splitting via React.lazy + Suspense
- Image optimization (WebP, lazy loading)
- Bundle analysis with `npm run build`
- React Query caching for server state

### Backend
- Database indexes on query patterns
- Connection pooling via Prisma
- Selective field inclusion (Prisma select)
- Pagination on all list endpoints

### Database
- Strategic composite indexes
- Read replicas for analytics (future)
- Partitioning for large tables (future)

## Monitoring & Observability

### Current
- Request logging middleware
- Error tracking via console
- Health check endpoints

### Planned
- [ ] Structured logging (Pino/Winston)
- [ ] Metrics collection (Prometheus)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

## Testing Strategy

### Frontend
- Unit: Vitest + React Testing Library
- Integration: Component testing
- E2E: Playwright (future)

### Backend
- Unit: Vitest for services/utils
- Integration: Supertest for routes
- Contract: Shared schema validation

### Database
- Test database with migrations
- Seed data for consistent tests
- Cleanup between test runs

## Future Architecture Evolution

### Phase 1: Real-time Features
- Socket.IO server for live updates
- Presence indicators
- Collaborative editing

### Phase 2: Microservices
- Split auth, events, notifications
- Message queue (Redis/RabbitMQ)
- API Gateway

### Phase 3: Advanced Analytics
- Event streaming (Kafka)
- Data warehouse (ClickHouse)
- ML-powered recommendations

### Phase 4: Multi-tenancy
- Organization/workspace isolation
- Custom branding per tenant
- Shared infrastructure