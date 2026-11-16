// Shared types, enums, and Zod validation schemas for FESTORA
import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  ORGANIZER = 'ORGANIZER',
  VOLUNTEER = 'VOLUNTEER',
  PARTICIPANT = 'PARTICIPANT',
  SPONSOR = 'SPONSOR',
  FINANCE_TEAM = 'FINANCE_TEAM',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventType {
  WORKSHOP = 'WORKSHOP',
  SEMINAR = 'SEMINAR',
  CONFERENCE = 'CONFERENCE',
  COMPETITION = 'COMPETITION',
  CULTURAL = 'CULTURAL',
  SPORTS = 'SPORTS',
  TECHNICAL = 'TECHNICAL',
  OTHER = 'OTHER',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
}

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  INVALID = 'INVALID',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum SponsorshipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BenefitStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FULFILLED = 'FULFILLED',
  NOT_FULFILLED = 'NOT_FULFILLED',
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CertificateStatus {
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum FeedbackType {
  RATING = 'RATING',
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOX = 'CHECKBOX',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CompetitionEntryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// ============================================
// ZOD SCHEMAS
// ============================================

// Base schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().nonnegative();
export const positiveDecimalSchema = z.number().positive();
export const nonNegativeDecimalSchema = z.number().nonnegative();
export const dateTimeSchema = z.string().datetime();
export const dateSchema = z.string().date();

// User schemas
export const userRoleSchema = z.nativeEnum(UserRole);
export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional().nullable(),
  role: userRoleSchema,
  department: z.string().max(100).optional().nullable(),
  studentId: z.string().max(50).optional().nullable(),
  employeeId: z.string().max(50).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  lastLoginAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  role: userRoleSchema,
  department: z.string().max(100).optional(),
  studentId: z.string().max(50).optional(),
  employeeId: z.string().max(50).optional(),
  phone: phoneSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  studentId: z.string().max(50).optional().nullable(),
  employeeId: z.string().max(50).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  isActive: z.boolean().optional(),
  role: userRoleSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// Event schemas
export const eventStatusSchema = z.nativeEnum(EventStatus);
export const eventTypeSchema = z.nativeEnum(EventType);

export const eventSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  type: eventTypeSchema,
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).default([]),
  startDate: dateTimeSchema,
  endDate: dateTimeSchema,
  registrationStartDate: dateTimeSchema.optional().nullable(),
  registrationEndDate: dateTimeSchema.optional().nullable(),
  capacity: positiveIntSchema.optional().nullable(),
  venueId: uuidSchema.optional().nullable(),
  venueName: z.string().max(200).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  organizerId: uuidSchema,
  status: eventStatusSchema,
  approvalRequired: z.boolean().default(true),
  approvedBy: uuidSchema.optional().nullable(),
  approvedAt: dateTimeSchema.optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  publishedAt: dateTimeSchema.optional().nullable(),
  cancelledAt: dateTimeSchema.optional().nullable(),
  cancellationReason: z.string().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: eventTypeSchema,
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  startDate: dateTimeSchema,
  endDate: dateTimeSchema,
  registrationStartDate: dateTimeSchema.optional(),
  registrationEndDate: dateTimeSchema.optional(),
  capacity: positiveIntSchema.optional(),
  venueId: uuidSchema.optional(),
  location: z.string().max(500).optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  approvalRequired: z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial();

export const submitEventForApprovalSchema = z.object({
  eventId: uuidSchema,
});

export const approveEventSchema = z.object({
  eventId: uuidSchema,
  comments: z.string().optional(),
});

export const rejectEventSchema = z.object({
  eventId: uuidSchema,
  reason: z.string().min(1).max(1000),
});

export const publishEventSchema = z.object({
  eventId: uuidSchema,
});

export const cancelEventSchema = z.object({
  eventId: uuidSchema,
  reason: z.string().min(1).max(1000),
});

// Venue schemas
export const venueSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200),
  location: z.string().max(500),
  capacity: positiveIntSchema,
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createVenueSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(500),
  capacity: positiveIntSchema,
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});

export const updateVenueSchema = createVenueSchema.partial();

// Registration schemas
export const registrationStatusSchema = z.nativeEnum(RegistrationStatus);

export const registrationSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  userId: uuidSchema,
  status: registrationStatusSchema,
  registeredAt: dateTimeSchema,
  confirmedAt: dateTimeSchema.optional().nullable(),
  cancelledAt: dateTimeSchema.optional().nullable(),
  cancellationReason: z.string().optional().nullable(),
  attendedAt: dateTimeSchema.optional().nullable(),
  waitlistPosition: z.number().int().positive().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createRegistrationSchema = z.object({
  eventId: uuidSchema,
});

export const cancelRegistrationSchema = z.object({
  registrationId: uuidSchema,
  reason: z.string().max(500).optional(),
});

// Ticket schemas
export const ticketStatusSchema = z.nativeEnum(TicketStatus);

export const ticketSchema = z.object({
  id: uuidSchema,
  registrationId: uuidSchema,
  token: z.string().min(1),
  qrCodeUrl: z.string().url().optional().nullable(),
  status: ticketStatusSchema,
  issuedAt: dateTimeSchema,
  usedAt: dateTimeSchema.optional().nullable(),
  usedBy: uuidSchema.optional().nullable(),
  expiresAt: dateTimeSchema.optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

// Attendance schemas
export const attendanceSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  registrationId: uuidSchema,
  ticketId: uuidSchema,
  scannedBy: uuidSchema,
  scannedAt: dateTimeSchema,
  isManualEntry: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  createdAt: dateTimeSchema,
});

export const checkInSchema = z.object({
  token: z.string().min(1),
  eventId: uuidSchema,
  isManualEntry: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

// Task schemas
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);

export const taskSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  assigneeId: uuidSchema.optional().nullable(),
  reporterId: uuidSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: dateTimeSchema.optional().nullable(),
  startedAt: dateTimeSchema.optional().nullable(),
  completedAt: dateTimeSchema.optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().nonnegative().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createTaskSchema = z.object({
  eventId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assigneeId: uuidSchema.optional(),
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  dueDate: dateTimeSchema.optional(),
  estimatedHours: z.number().positive().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
  actualHours: z.number().nonnegative().optional(),
});

export const taskCommentSchema = z.object({
  id: uuidSchema,
  taskId: uuidSchema,
  userId: uuidSchema,
  content: z.string().min(1),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createTaskCommentSchema = z.object({
  taskId: uuidSchema,
  content: z.string().min(1),
});

// Issue schemas
export const issueSeveritySchema = z.nativeEnum(IssueSeverity);

export const issueSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  reportedBy: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: issueSeveritySchema,
  status: z.nativeEnum(IssueStatus),
  assignedTo: uuidSchema.optional().nullable(),
  resolvedAt: dateTimeSchema.optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createIssueSchema = z.object({
  eventId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: issueSeveritySchema,
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  severity: issueSeveritySchema.optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  assignedTo: uuidSchema.optional().nullable(),
  resolutionNotes: z.string().optional(),
});

// Finance schemas
export const expenseStatusSchema = z.nativeEnum(ExpenseStatus);

export const budgetSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  approvedAmount: nonNegativeDecimalSchema,
  currency: z.string().length(3).default('INR'),
  approvedBy: uuidSchema.optional().nullable(),
  approvedAt: dateTimeSchema.optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createBudgetSchema = z.object({
  eventId: uuidSchema,
  approvedAmount: nonNegativeDecimalSchema,
  currency: z.string().length(3).default('INR'),
});

export const expenseCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().default(true),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const expenseSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  categoryId: uuidSchema,
  description: z.string().min(1).max(500),
  amount: positiveDecimalSchema,
  currency: z.string().length(3).default('INR'),
  expenseDate: dateSchema,
  recordedBy: uuidSchema,
  status: expenseStatusSchema,
  approvedBy: uuidSchema.optional().nullable(),
  approvedAt: dateTimeSchema.optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
  receiptReference: z.string().max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createExpenseSchema = z.object({
  eventId: uuidSchema,
  categoryId: uuidSchema,
  description: z.string().min(1).max(500),
  amount: positiveDecimalSchema,
  currency: z.string().length(3).default('INR'),
  expenseDate: dateSchema,
  receiptUrl: z.string().url().optional(),
  receiptReference: z.string().max(200).optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  status: expenseStatusSchema.optional(),
});

// Sponsor schemas
export const sponsorshipStatusSchema = z.nativeEnum(SponsorshipStatus);
export const benefitStatusSchema = z.nativeEnum(BenefitStatus);

export const sponsorSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactEmail: emailSchema.optional().nullable(),
  contactPhone: phoneSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(200),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  description: z.string().optional(),
});

export const sponsorshipSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  sponsorId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  promisedAmount: nonNegativeDecimalSchema,
  receivedAmount: nonNegativeDecimalSchema.default(0),
  currency: z.string().length(3).default('INR'),
  status: sponsorshipStatusSchema,
  startDate: dateSchema.optional().nullable(),
  endDate: dateSchema.optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createSponsorshipSchema = z.object({
  eventId: uuidSchema,
  sponsorId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  promisedAmount: nonNegativeDecimalSchema,
  currency: z.string().length(3).default('INR'),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const sponsorContributionSchema = z.object({
  id: uuidSchema,
  sponsorshipId: uuidSchema,
  amount: positiveDecimalSchema,
  currency: z.string().length(3).default('INR'),
  contributedAt: dateSchema,
  reference: z.string().max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
  recordedBy: uuidSchema,
  createdAt: dateTimeSchema,
});

export const createSponsorContributionSchema = z.object({
  sponsorshipId: uuidSchema,
  amount: positiveDecimalSchema,
  currency: z.string().length(3).default('INR'),
  contributedAt: dateSchema,
  reference: z.string().max(200).optional(),
  notes: z.string().optional(),
});

export const sponsorBenefitSchema = z.object({
  id: uuidSchema,
  sponsorshipId: uuidSchema,
  description: z.string().min(1).max(500),
  expectedDate: dateSchema.optional().nullable(),
  responsiblePersonId: uuidSchema.optional().nullable(),
  status: benefitStatusSchema,
  fulfillmentNotes: z.string().optional().nullable(),
  fulfilledAt: dateTimeSchema.optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createSponsorBenefitSchema = z.object({
  sponsorshipId: uuidSchema,
  description: z.string().min(1).max(500),
  expectedDate: dateSchema.optional(),
  responsiblePersonId: uuidSchema.optional(),
});

export const budgetAllocationSchema = z.object({
  id: uuidSchema,
  sponsorshipId: uuidSchema,
  expenseCategoryId: uuidSchema,
  allocatedAmount: nonNegativeDecimalSchema,
  spentAmount: nonNegativeDecimalSchema.default(0),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createBudgetAllocationSchema = z.object({
  sponsorshipId: uuidSchema,
  expenseCategoryId: uuidSchema,
  allocatedAmount: nonNegativeDecimalSchema,
});

// Competition schemas
export const competitionStatusSchema = z.nativeEnum(CompetitionStatus);

export const competitionSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  rules: z.string().optional().nullable(),
  maxTeamSize: positiveIntSchema.default(1),
  minTeamSize: positiveIntSchema.default(1),
  registrationStartDate: dateTimeSchema.optional().nullable(),
  registrationEndDate: dateTimeSchema.optional().nullable(),
  status: competitionStatusSchema,
  scoringConfig: z.record(z.unknown()).optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createCompetitionSchema = z.object({
  eventId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  rules: z.string().optional(),
  maxTeamSize: positiveIntSchema.default(1),
  minTeamSize: positiveIntSchema.default(1),
  registrationStartDate: dateTimeSchema.optional(),
  registrationEndDate: dateTimeSchema.optional(),
  scoringConfig: z.record(z.unknown()).optional(),
});

export const competitionEntrySchema = z.object({
  id: uuidSchema,
  competitionId: uuidSchema,
  teamName: z.string().min(1).max(100).optional().nullable(),
  leaderId: uuidSchema,
  memberIds: z.array(uuidSchema).default([]),
  status: z.nativeEnum(CompetitionEntryStatus),
  registeredAt: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createCompetitionEntrySchema = z.object({
  competitionId: uuidSchema,
  teamName: z.string().max(100).optional(),
  memberIds: z.array(uuidSchema).default([]),
});

export const competitionScoreSchema = z.object({
  id: uuidSchema,
  competitionId: uuidSchema,
  entryId: uuidSchema,
  judgeId: uuidSchema,
  criteriaScores: z.record(z.number()),
  totalScore: z.number(),
  notes: z.string().optional().nullable(),
  submittedAt: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createCompetitionScoreSchema = z.object({
  competitionId: uuidSchema,
  entryId: uuidSchema,
  criteriaScores: z.record(z.number()),
  notes: z.string().optional(),
});

// Certificate schemas
export const certificateStatusSchema = z.nativeEnum(CertificateStatus);

export const certificateSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  userId: uuidSchema,
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  templateId: uuidSchema.optional().nullable(),
  pdfUrl: z.string().url().optional().nullable(),
  certificateNumber: z.string().min(1).max(100),
  issuedAt: dateTimeSchema,
  issuedBy: uuidSchema,
  status: certificateStatusSchema,
  revokedAt: dateTimeSchema.optional().nullable(),
  revokedBy: uuidSchema.optional().nullable(),
  revocationReason: z.string().optional().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createCertificateSchema = z.object({
  eventId: uuidSchema,
  userId: uuidSchema,
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  templateId: uuidSchema.optional(),
});

// Feedback schemas
export const feedbackTypeSchema = z.nativeEnum(FeedbackType);

export const feedbackQuestionSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  type: feedbackTypeSchema,
  question: z.string().min(1).max(500),
  options: z.array(z.string()).optional().nullable(),
  isRequired: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const createFeedbackQuestionSchema = z.object({
  eventId: uuidSchema,
  type: feedbackTypeSchema,
  question: z.string().min(1).max(500),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().nonnegative(),
});

export const feedbackResponseSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  userId: uuidSchema,
  registrationId: uuidSchema.optional().nullable(),
  answers: z.record(z.unknown()),
  submittedAt: dateTimeSchema,
  createdAt: dateTimeSchema,
});

export const createFeedbackResponseSchema = z.object({
  eventId: uuidSchema,
  answers: z.record(z.unknown()),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

// API Response schemas
export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([apiSuccessSchema(dataSchema), apiErrorSchema]);

// ============================================
// TYPE EXPORTS
// ============================================

export type UserRole = z.infer<typeof userRoleSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type SponsorshipStatus = z.infer<typeof sponsorshipStatusSchema>;
export type BenefitStatus = z.infer<typeof benefitStatusSchema>;
export type CompetitionStatus = z.infer<typeof competitionStatusSchema>;
export type CertificateStatus = z.infer<typeof certificateStatusSchema>;
export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type IssueStatus = z.infer<typeof IssueStatus>;
export type CompetitionEntryStatus = z.infer<typeof CompetitionEntryStatus>;

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export type Event = z.infer<typeof eventSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type SubmitEventForApproval = z.infer<typeof submitEventForApprovalSchema>;
export type ApproveEvent = z.infer<typeof approveEventSchema>;
export type RejectEvent = z.infer<typeof rejectEventSchema>;
export type PublishEvent = z.infer<typeof publishEventSchema>;
export type CancelEvent = z.infer<typeof cancelEventSchema>;

export type Venue = z.infer<typeof venueSchema>;
export type CreateVenue = z.infer<typeof createVenueSchema>;
export type UpdateVenue = z.infer<typeof updateVenueSchema>;

export type Registration = z.infer<typeof registrationSchema>;
export type CreateRegistration = z.infer<typeof createRegistrationSchema>;
export type CancelRegistration = z.infer<typeof cancelRegistrationSchema>;

export type Ticket = z.infer<typeof ticketSchema>;

export type Attendance = z.infer<typeof attendanceSchema>;
export type CheckIn = z.infer<typeof checkInSchema>;

export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TaskComment = z.infer<typeof taskCommentSchema>;
export type CreateTaskComment = z.infer<typeof createTaskCommentSchema>;

export type Issue = z.infer<typeof issueSchema>;
export type CreateIssue = z.infer<typeof createIssueSchema>;
export type UpdateIssue = z.infer<typeof updateIssueSchema>;

export type Budget = z.infer<typeof budgetSchema>;
export type CreateBudget = z.infer<typeof createBudgetSchema>;

export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type CreateExpenseCategory = z.infer<typeof createExpenseCategorySchema>;

export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpense = z.infer<typeof createExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;

export type Sponsor = z.infer<typeof sponsorSchema>;
export type CreateSponsor = z.infer<typeof createSponsorSchema>;

export type Sponsorship = z.infer<typeof sponsorshipSchema>;
export type CreateSponsorship = z.infer<typeof createSponsorshipSchema>;

export type SponsorContribution = z.infer<typeof sponsorContributionSchema>;
export type CreateSponsorContribution = z.infer<typeof createSponsorContributionSchema>;

export type SponsorBenefit = z.infer<typeof sponsorBenefitSchema>;
export type CreateSponsorBenefit = z.infer<typeof createSponsorBenefitSchema>;

export type BudgetAllocation = z.infer<typeof budgetAllocationSchema>;
export type CreateBudgetAllocation = z.infer<typeof createBudgetAllocationSchema>;

export type Competition = z.infer<typeof competitionSchema>;
export type CreateCompetition = z.infer<typeof createCompetitionSchema>;

export type CompetitionEntry = z.infer<typeof competitionEntrySchema>;
export type CreateCompetitionEntry = z.infer<typeof createCompetitionEntrySchema>;

export type CompetitionScore = z.infer<typeof competitionScoreSchema>;
export type CreateCompetitionScore = z.infer<typeof createCompetitionScoreSchema>;

export type Certificate = z.infer<typeof certificateSchema>;
export type CreateCertificate = z.infer<typeof createCertificateSchema>;

export type FeedbackQuestion = z.infer<typeof feedbackQuestionSchema>;
export type CreateFeedbackQuestion = z.infer<typeof createFeedbackQuestionSchema>;

export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;
export type CreateFeedbackResponse = z.infer<typeof createFeedbackResponseSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodTypeAny>>>;

// ============================================
// PERMISSIONS
// ============================================

export const permissions = {
  // User management
  'user:create': [UserRole.ADMIN],
  'user:read': [UserRole.ADMIN, UserRole.FACULTY, UserRole.ORGANIZER],
  'user:update': [UserRole.ADMIN],
  'user:delete': [UserRole.ADMIN],
  'user:assign-role': [UserRole.ADMIN],

  // Event management
  'event:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY],
  'event:read': [UserRole.ADMIN, UserRole.FACULTY, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.PARTICIPANT, UserRole.SPONSOR, UserRole.FINANCE_TEAM],
  'event:update': [UserRole.ADMIN, UserRole.ORGANIZER],
  'event:delete': [UserRole.ADMIN, UserRole.ORGANIZER],
  'event:submit-approval': [UserRole.ORGANIZER],
  'event:approve': [UserRole.ADMIN, UserRole.FACULTY],
  'event:reject': [UserRole.ADMIN, UserRole.FACULTY],
  'event:publish': [UserRole.ADMIN, UserRole.ORGANIZER],
  'event:cancel': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Venue management
  'venue:create': [UserRole.ADMIN, UserRole.ORGANIZER],
  'venue:read': [UserRole.ADMIN, UserRole.FACULTY, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.FINANCE_TEAM],
  'venue:update': [UserRole.ADMIN, UserRole.ORGANIZER],
  'venue:delete': [UserRole.ADMIN],

  // Registration
  'registration:create': [UserRole.PARTICIPANT, UserRole.ORGANIZER, UserRole.ADMIN],
  'registration:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.PARTICIPANT, UserRole.FACULTY],
  'registration:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.PARTICIPANT],
  'registration:delete': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Ticket
  'ticket:generate': [UserRole.ADMIN, UserRole.ORGANIZER],
  'ticket:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.PARTICIPANT],
  'ticket:validate': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER],

  // Attendance
  'attendance:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER],
  'attendance:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.FACULTY, UserRole.PARTICIPANT],

  // Task
  'task:create': [UserRole.ADMIN, UserRole.ORGANIZER],
  'task:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER, UserRole.FACULTY],
  'task:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER],
  'task:delete': [UserRole.ADMIN, UserRole.ORGANIZER],
  'task:assign': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Issue
  'issue:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VOLUNTEER],
  'issue:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY],
  'issue:update': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Finance
  'budget:create': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER],
  'budget:read': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER, UserRole.FACULTY],
  'budget:update': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'expense:create': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER],
  'expense:read': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER, UserRole.FACULTY],
  'expense:update': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER],
  'expense:approve': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'expense:delete': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'expense-category:create': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'expense-category:read': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.ORGANIZER],
  'expense-category:update': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'expense-category:delete': [UserRole.ADMIN, UserRole.FINANCE_TEAM],

  // Sponsor
  'sponsor:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'sponsor:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM, UserRole.SPONSOR],
  'sponsor:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'sponsor:delete': [UserRole.ADMIN],
  'sponsorship:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'sponsorship:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM, UserRole.SPONSOR],
  'sponsorship:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'contribution:create': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'contribution:read': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.SPONSOR],
  'benefit:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'benefit:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM, UserRole.SPONSOR],
  'benefit:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FINANCE_TEAM],
  'allocation:create': [UserRole.ADMIN, UserRole.FINANCE_TEAM],
  'allocation:read': [UserRole.ADMIN, UserRole.FINANCE_TEAM, UserRole.SPONSOR],
  'allocation:update': [UserRole.ADMIN, UserRole.FINANCE_TEAM],

  // Competition
  'competition:create': [UserRole.ADMIN, UserRole.ORGANIZER],
  'competition:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY, UserRole.PARTICIPANT, UserRole.VOLUNTEER],
  'competition:update': [UserRole.ADMIN, UserRole.ORGANIZER],
  'competition:delete': [UserRole.ADMIN, UserRole.ORGANIZER],
  'competition-entry:create': [UserRole.PARTICIPANT, UserRole.ORGANIZER, UserRole.ADMIN],
  'competition-entry:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY, UserRole.PARTICIPANT],
  'competition-score:create': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY],
  'competition-score:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY, UserRole.PARTICIPANT],
  'competition-score:update': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY],

  // Certificate
  'certificate:create': [UserRole.ADMIN, UserRole.ORGANIZER],
  'certificate:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY, UserRole.PARTICIPANT],
  'certificate:download': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.PARTICIPANT],
  'certificate:revoke': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Feedback
  'feedback:create': [UserRole.PARTICIPANT, UserRole.ADMIN, UserRole.ORGANIZER],
  'feedback:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY],
  'feedback-question:create': [UserRole.ADMIN, UserRole.ORGANIZER],
  'feedback-question:read': [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.FACULTY, UserRole.PARTICIPANT],
  'feedback-question:update': [UserRole.ADMIN, UserRole.ORGANIZER],
  'feedback-question:delete': [UserRole.ADMIN, UserRole.ORGANIZER],

  // Admin
  'admin:read-audit-logs': [UserRole.ADMIN],
  'admin:manage-settings': [UserRole.ADMIN],
  'admin:view-system-stats': [UserRole.ADMIN],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissions[permission].includes(role);
}

// ============================================
// CONSTANTS
// ============================================

export const EVENT_STATUS_ORDER: EventStatus[] = [
  EventStatus.DRAFT,
  EventStatus.PENDING_APPROVAL,
  EventStatus.APPROVED,
  EventStatus.REJECTED,
  EventStatus.PUBLISHED,
  EventStatus.IN_PROGRESS,
  EventStatus.COMPLETED,
  EventStatus.CANCELLED,
];

export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PENDING_APPROVAL, EventStatus.CANCELLED],
  [EventStatus.PENDING_APPROVAL]: [EventStatus.APPROVED, EventStatus.REJECTED, EventStatus.DRAFT, EventStatus.CANCELLED],
  [EventStatus.APPROVED]: [EventStatus.PUBLISHED, EventStatus.DRAFT, EventStatus.CANCELLED],
  [EventStatus.REJECTED]: [EventStatus.DRAFT, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [EventStatus.IN_PROGRESS, EventStatus.CANCELLED],
  [EventStatus.IN_PROGRESS]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
  [EventStatus.COMPLETED]: [],
  [EventStatus.CANCELLED]: [],
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const JWT_COOKIE_NAME = 'festora_token';
export const JWT_REFRESH_COOKIE_NAME = 'festora_refresh_token';