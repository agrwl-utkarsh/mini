import { z } from "zod";

// Enums
export const RoleSchema = z.enum([
  "ADMIN",
  "FACULTY",
  "ORGANIZER",
  "VOLUNTEER",
  "PARTICIPANT",
  "SPONSOR",
  "FINANCE_TEAM",
]);

export const EventStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const RegistrationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "WAITLISTED",
  "ATTENDED",
  "NO_SHOW",
]);

export const TaskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
]);

export const TaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const ExpenseStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAID",
  "REIMBURSED",
]);

export const SponsorshipStatusSchema = z.enum([
  "PROSPECT",
  "NEGOTIATING",
  "COMMITTED",
  "RECEIVED",
  "COMPLETED",
]);

export const FeedbackTypeSchema = z.enum([
  "GENERAL",
  "SPEAKER",
  "VENUE",
  "CONTENT",
  "ORGANIZATION",
]);

export const CertificateStatusSchema = z.enum([
  "PENDING",
  "GENERATED",
  "ISSUED",
  "VERIFIED",
  "REVOKED",
]);

// Base schemas
export const UUIDSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// User schemas
export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  role: RoleSchema,
  department: z.string().optional(),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8).max(100),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).max(100).optional(),
});

export const UserResponseSchema = UserSchema.omit({ password: true });

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterSchema = CreateUserSchema;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const JWTPayloadSchema = z.object({
  sub: UUIDSchema,
  email: z.string().email(),
  role: RoleSchema,
  iat: z.number(),
  exp: z.number(),
});

// Event schemas
export const EventSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional(),
  status: EventStatusSchema,
  startDate: z.date(),
  endDate: z.date(),
  registrationStartDate: z.date().optional(),
  registrationEndDate: z.date().optional(),
  maxAttendees: z.number().int().positive().optional(),
  venueId: UUIDSchema.optional(),
  organizerId: UUIDSchema,
  approvedById: UUIDSchema.optional(),
  approvedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateEventSchema = EventSchema.omit({
  id: true,
  status: true,
  approvedById: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: EventStatusSchema.default("DRAFT"),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const EventQuerySchema = PaginationSchema.extend({
  status: EventStatusSchema.optional(),
  organizerId: UUIDSchema.optional(),
  venueId: UUIDSchema.optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Venue schemas
export const VenueSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  capacity: z.number().int().positive(),
  location: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateVenueSchema = VenueSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVenueSchema = CreateVenueSchema.partial();

// Registration schemas
export const RegistrationSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  userId: UUIDSchema,
  status: RegistrationStatusSchema,
  ticketCode: z.string().optional(),
  qrCodeUrl: z.string().url().optional(),
  checkedInAt: z.date().optional(),
  checkedInBy: UUIDSchema.optional(),
  waitlistPosition: z.number().int().positive().optional(),
  specialRequests: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateRegistrationSchema = RegistrationSchema.omit({
  id: true,
  status: true,
  ticketCode: true,
  qrCodeUrl: true,
  checkedInAt: true,
  checkedInBy: true,
  waitlistPosition: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: RegistrationStatusSchema.default("PENDING"),
});

export const UpdateRegistrationSchema = CreateRegistrationSchema.partial().extend({
  status: RegistrationStatusSchema.optional(),
  checkedInAt: z.date().optional(),
  checkedInBy: UUIDSchema.optional(),
});

export const BulkRegistrationSchema = z.object({
  eventId: UUIDSchema,
  userIds: z.array(UUIDSchema).min(1).max(100),
});

export const CheckInSchema = z.object({
  ticketCode: z.string().min(1),
  eventId: UUIDSchema,
});

// Task schemas
export const TaskSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assigneeId: UUIDSchema.optional(),
  reporterId: UUIDSchema,
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: TaskStatusSchema.default("TODO"),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// Finance schemas
export const BudgetSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  name: z.string().min(1).max(100),
  allocatedAmount: z.number().nonnegative(),
  spentAmount: z.number().nonnegative().default(0),
  currency: z.string().length(3).default("INR"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateBudgetSchema = BudgetSchema.omit({
  id: true,
  spentAmount: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial();

export const ExpenseSchema = z.object({
  id: UUIDSchema,
  budgetId: UUIDSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("INR"),
  status: ExpenseStatusSchema,
  category: z.string().optional(),
  vendor: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
  approvedById: UUIDSchema.optional(),
  approvedAt: z.date().optional(),
  paidAt: z.date().optional(),
  createdById: UUIDSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  status: true,
  approvedById: true,
  approvedAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: ExpenseStatusSchema.default("PENDING"),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().extend({
  status: ExpenseStatusSchema.optional(),
  approvedById: UUIDSchema.optional(),
  approvedAt: z.date().optional(),
  paidAt: z.date().optional(),
});

// Sponsor schemas
export const SponsorSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  tier: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSponsorSchema = SponsorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSponsorSchema = CreateSponsorSchema.partial();

export const SponsorshipSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  sponsorId: UUIDSchema,
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default("INR"),
  status: SponsorshipStatusSchema,
  benefits: z.array(z.string()).default([]),
  contractUrl: z.string().url().optional(),
  committedAt: z.date().optional(),
  receivedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSponsorshipSchema = SponsorshipSchema.omit({
  id: true,
  status: true,
  committedAt: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: SponsorshipStatusSchema.default("PROSPECT"),
});

export const UpdateSponsorshipSchema = CreateSponsorshipSchema.partial().extend({
  status: SponsorshipStatusSchema.optional(),
  committedAt: z.date().optional(),
  receivedAt: z.date().optional(),
});

// Feedback schemas
export const FeedbackSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  userId: UUIDSchema,
  type: FeedbackTypeSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFeedbackSchema = FeedbackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateFeedbackSchema = CreateFeedbackSchema.partial();

// Certificate schemas
export const CertificateTemplateSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  templateHtml: z.string(),
  templateCss: z.string().optional(),
  qrCodePosition: z.object({
    x: z.number(),
    y: z.number(),
    size: z.number(),
  }).optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateCertificateTemplateSchema = CertificateTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCertificateTemplateSchema = CreateCertificateTemplateSchema.partial();

export const CertificateSchema = z.object({
  id: UUIDSchema,
  eventId: UUIDSchema,
  userId: UUIDSchema,
  templateId: UUIDSchema,
  certificateNumber: z.string(),
  pdfUrl: z.string().url().optional(),
  status: CertificateStatusSchema,
  issuedAt: z.date().optional(),
  verifiedAt: z.date().optional(),
  revokedAt: z.date().optional(),
  revokedReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GenerateCertificateSchema = z.object({
  eventId: UUIDSchema,
  userId: UUIDSchema,
  templateId: UUIDSchema.optional(),
});

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional(),
      })
      .optional(),
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
        totalPages: z.number().optional(),
      })
      .optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  ApiResponseSchema(
    z.object({
      items: z.array(itemSchema),
      meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    })
  );

// Type exports
export type Role = z.infer<typeof RoleSchema>;
export type EventStatus = z.infer<typeof EventStatusSchema>;
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;
export type SponsorshipStatus = z.infer<typeof SponsorshipStatusSchema>;
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;
export type CertificateStatus = z.infer<typeof CertificateStatusSchema>;

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type EventQuery = z.infer<typeof EventQuerySchema>;

export type Venue = z.infer<typeof VenueSchema>;
export type CreateVenue = z.infer<typeof CreateVenueSchema>;
export type UpdateVenue = z.infer<typeof UpdateVenueSchema>;

export type Registration = z.infer<typeof RegistrationSchema>;
export type CreateRegistration = z.infer<typeof CreateRegistrationSchema>;
export type UpdateRegistration = z.infer<typeof UpdateRegistrationSchema>;
export type BulkRegistration = z.infer<typeof BulkRegistrationSchema>;
export type CheckIn = z.infer<typeof CheckInSchema>;

export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

export type Budget = z.infer<typeof BudgetSchema>;
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;

export type Expense = z.infer<typeof ExpenseSchema>;
export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;

export type Sponsor = z.infer<typeof SponsorSchema>;
export type CreateSponsor = z.infer<typeof CreateSponsorSchema>;
export type UpdateSponsor = z.infer<typeof UpdateSponsorSchema>;

export type Sponsorship = z.infer<typeof SponsorshipSchema>;
export type CreateSponsorship = z.infer<typeof CreateSponsorshipSchema>;
export type UpdateSponsorship = z.infer<typeof UpdateSponsorshipSchema>;

export type Feedback = z.infer<typeof FeedbackSchema>;
export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;

export type CertificateTemplate = z.infer<typeof CertificateTemplateSchema>;
export type CreateCertificateTemplate = z.infer<typeof CreateCertificateTemplateSchema>;
export type UpdateCertificateTemplate = z.infer<typeof UpdateCertificateTemplateSchema>;

export type Certificate = z.infer<typeof CertificateSchema>;
export type GenerateCertificate = z.infer<typeof GenerateCertificateSchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;