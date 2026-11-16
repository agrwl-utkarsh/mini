// FESTORA Development Seed Script
// Seeds the database with demo accounts for all 7 roles and sample data

import { PrismaClient, UserRole, EventStatus, EventType, RegistrationStatus, TicketStatus, TaskStatus, TaskPriority, IssueSeverity, IssueStatus, ExpenseStatus, SponsorshipStatus, BenefitStatus, CompetitionStatus, CompetitionEntryStatus, CertificateStatus, FeedbackType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Starting FESTORA database seed...');

  // ============================================
  // CLEAN UP (in development only)
  // ============================================
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notificationLog.deleteMany();
    await prisma.feedbackResponse.deleteMany();
    await prisma.feedbackQuestion.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.competitionScore.deleteMany();
    await prisma.competitionEntry.deleteMany();
    await prisma.competition.deleteMany();
    await prisma.budgetAllocation.deleteMany();
    await prisma.sponsorBenefit.deleteMany();
    await prisma.sponsorContribution.deleteMany();
    await prisma.sponsorship.deleteMany();
    await prisma.sponsor.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.expenseCategory.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.taskComment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.eventApproval.deleteMany();
    await prisma.event.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.user.deleteMany();
  }

  // ============================================
  // CREATE USERS (one per role + extras)
  // ============================================
  console.log('👥 Creating users...');

  const passwordHash = await hashPassword('Password123!');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@festora.edu',
      passwordHash,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      department: 'IT Administration',
      employeeId: 'EMP001',
      isActive: true,
      emailVerified: true,
    },
  });

  const faculty = await prisma.user.create({
    data: {
      email: 'faculty@festora.edu',
      passwordHash,
      name: 'Dr. Sarah Mitchell',
      role: UserRole.FACULTY,
      department: 'Computer Science',
      employeeId: 'FAC001',
      isActive: true,
      emailVerified: true,
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@festora.edu',
      passwordHash,
      name: 'Alex Rivera',
      role: UserRole.ORGANIZER,
      department: 'Student Affairs',
      employeeId: 'ORG001',
      isActive: true,
      emailVerified: true,
    },
  });

  const volunteer = await prisma.user.create({
    data: {
      email: 'volunteer@festora.edu',
      passwordHash,
      name: 'Jordan Kim',
      role: UserRole.VOLUNTEER,
      department: 'Event Management Club',
      studentId: 'STU2024001',
      isActive: true,
      emailVerified: true,
    },
  });

  const participant = await prisma.user.create({
    data: {
      email: 'participant@festora.edu',
      passwordHash,
      name: 'Maya Patel',
      role: UserRole.PARTICIPANT,
      department: 'Computer Science',
      studentId: 'STU2024002',
      isActive: true,
      emailVerified: true,
    },
  });

  const sponsorUser = await prisma.user.create({
    data: {
      email: 'sponsor@techcorp.com',
      passwordHash,
      name: 'Robert Chen',
      role: UserRole.SPONSOR,
      department: 'TechCorp Inc.',
      isActive: true,
      emailVerified: true,
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: 'finance@festora.edu',
      passwordHash,
      name: 'Lisa Thompson',
      role: UserRole.FINANCE_TEAM,
      department: 'Finance Office',
      employeeId: 'FIN001',
      isActive: true,
      emailVerified: true,
    },
  });

  // Additional users for testing
  const organizer2 = await prisma.user.create({
    data: {
      email: 'organizer2@festora.edu',
      passwordHash,
      name: 'Priya Sharma',
      role: UserRole.ORGANIZER,
      department: 'Cultural Committee',
      employeeId: 'ORG002',
      isActive: true,
      emailVerified: true,
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      email: 'volunteer2@festora.edu',
      passwordHash,
      name: 'Chris Johnson',
      role: UserRole.VOLUNTEER,
      department: 'Tech Club',
      studentId: 'STU2024003',
      isActive: true,
      emailVerified: true,
    },
  });

  const participant2 = await prisma.user.create({
    data: {
      email: 'participant2@festora.edu',
      passwordHash,
      name: 'Aisha Khan',
      role: UserRole.PARTICIPANT,
      department: 'Electronics',
      studentId: 'STU2024004',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // ============================================
  // CREATE VENUES
  // ============================================
  console.log('🏢 Creating venues...');

  const auditorium = await prisma.venue.create({
    data: {
      name: 'Main Auditorium',
      location: 'Building A, Ground Floor',
      capacity: 500,
      description: 'Large auditorium with stage, sound system, and projector',
      amenities: ['Projector', 'Sound System', 'Stage', 'AC', 'Podium'],
      isActive: true,
    },
  });

  const seminarHall = await prisma.venue.create({
    data: {
      name: 'Seminar Hall 101',
      location: 'Building B, First Floor',
      capacity: 100,
      description: 'Medium-sized hall for seminars and workshops',
      amenities: ['Projector', 'Whiteboard', 'AC', 'Video Conferencing'],
      isActive: true,
    },
  });

  const lab1 = await prisma.venue.create({
    data: {
      name: 'Computer Lab 1',
      location: 'Building C, Second Floor',
      capacity: 60,
      description: 'Fully equipped computer lab with 60 workstations',
      amenities: ['60 PCs', 'Projector', 'AC', 'High-speed Internet', 'IDE Software'],
      isActive: true,
    },
  });

  const sportsGround = await prisma.venue.create({
    data: {
      name: 'Sports Ground',
      location: 'Campus Sports Complex',
      capacity: 1000,
      description: 'Outdoor sports ground for athletic events',
      amenities: ['Track', 'Field', 'Seating', 'Scoreboard', 'Lighting'],
      isActive: true,
    },
  });

  const culturalHall = await prisma.venue.create({
    data: {
      name: 'Cultural Hall',
      location: 'Building D, Ground Floor',
      capacity: 300,
      description: 'Hall for cultural performances and events',
      amenities: ['Stage', 'Sound System', 'Lighting', 'Green Room', 'Seating'],
      isActive: true,
    },
  });

  console.log('✅ Venues created');

  // ============================================
  // CREATE EVENTS
  // ============================================
  console.log('📅 Creating events...');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Event 1: Published, upcoming
  const techFest = await prisma.event.create({
    data: {
      title: 'TechFest 2026',
      slug: 'techfest-2026',
      description: 'Annual technology festival featuring workshops, hackathons, and keynote speeches from industry leaders. Open to all students.',
      shortDescription: 'Annual technology festival with workshops and hackathons',
      type: EventType.TECHNICAL,
      category: 'Technology',
      tags: ['hackathon', 'workshop', 'keynote', 'networking'],
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
      capacity: 300,
      venueId: auditorium.id,
      venueName: auditorium.name,
      location: auditorium.location,
      organizerId: organizer.id,
      status: EventStatus.PUBLISHED,
      approvalRequired: true,
      approvedBy: faculty.id,
      approvedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
  });

  // Event 2: Approved, pending publish
  const aiWorkshop = await prisma.event.create({
    data: {
      title: 'AI/ML Workshop Series',
      slug: 'ai-ml-workshop-series',
      description: 'Hands-on workshop series covering fundamentals of machine learning, neural networks, and practical applications. 3-day intensive program.',
      shortDescription: '3-day hands-on AI/ML workshop',
      type: EventType.WORKSHOP,
      category: 'Technology',
      tags: ['ai', 'ml', 'workshop', 'hands-on'],
      startDate: new Date(nextWeek.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(nextWeek.getTime() + 13 * 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(nextWeek.getTime() + 8 * 24 * 60 * 60 * 1000),
      capacity: 60,
      venueId: lab1.id,
      venueName: lab1.name,
      location: lab1.location,
      organizerId: organizer.id,
      status: EventStatus.APPROVED,
      approvalRequired: true,
      approvedBy: faculty.id,
      approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Event 3: Draft
  const culturalNight = await prisma.event.create({
    data: {
      title: 'Cultural Night 2026',
      slug: 'cultural-night-2026',
      description: 'Annual cultural showcase featuring music, dance, drama, and art performances by student clubs.',
      shortDescription: 'Annual cultural showcase by student clubs',
      type: EventType.CULTURAL,
      category: 'Cultural',
      tags: ['music', 'dance', 'drama', 'art'],
      startDate: new Date(nextMonth.getTime() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(nextMonth.getTime() + 16 * 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(nextMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(nextMonth.getTime() + 13 * 24 * 60 * 60 * 1000),
      capacity: 400,
      venueId: culturalHall.id,
      venueName: culturalHall.name,
      location: culturalHall.location,
      organizerId: organizer2.id,
      status: EventStatus.DRAFT,
      approvalRequired: true,
    },
  });

  // Event 4: Completed (past event)
  const hackathon2025 = await prisma.event.create({
    data: {
      title: 'Hackathon 2025',
      slug: 'hackathon-2025',
      description: '24-hour hackathon focused on solving real-world problems. Teams of 3-4 students build innovative solutions.',
      shortDescription: '24-hour hackathon for students',
      type: EventType.COMPETITION,
      category: 'Technology',
      tags: ['hackathon', 'coding', 'innovation', 'prizes'],
      startDate: lastMonth,
      endDate: new Date(lastMonth.getTime() + 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(lastMonth.getTime() - 2 * 24 * 60 * 60 * 1000),
      capacity: 120,
      venueId: lab1.id,
      venueName: lab1.name,
      location: lab1.location,
      organizerId: organizer.id,
      status: EventStatus.COMPLETED,
      approvalRequired: true,
      approvedBy: faculty.id,
      approvedAt: new Date(lastMonth.getTime() - 35 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Event 5: In Progress
  const sportsMeet = await prisma.event.create({
    data: {
      title: 'Annual Sports Meet',
      slug: 'annual-sports-meet',
      description: 'Inter-department sports competition including track events, team sports, and fitness challenges.',
      shortDescription: 'Inter-department sports competition',
      type: EventType.SPORTS,
      category: 'Sports',
      tags: ['athletics', 'team-sports', 'fitness', 'competition'],
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      capacity: 500,
      venueId: sportsGround.id,
      venueName: sportsGround.name,
      location: sportsGround.location,
      organizerId: organizer2.id,
      status: EventStatus.IN_PROGRESS,
      approvalRequired: true,
      approvedBy: faculty.id,
      approvedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
    },
  });

  // Event 6: Pending approval
  const startupSummit = await prisma.event.create({
    data: {
      title: 'Startup Summit 2026',
      slug: 'startup-summit-2026',
      description: 'Entrepreneurship summit with pitch competitions, investor panels, and networking sessions for student founders.',
      shortDescription: 'Entrepreneurship summit for student founders',
      type: EventType.CONFERENCE,
      category: 'Entrepreneurship',
      tags: ['startup', 'pitch', 'investors', 'networking'],
      startDate: new Date(nextMonth.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
      registrationStartDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      capacity: 200,
      venueId: seminarHall.id,
      venueName: seminarHall.name,
      location: seminarHall.location,
      organizerId: organizer.id,
      status: EventStatus.PENDING_APPROVAL,
      approvalRequired: true,
    },
  });

  console.log('✅ Events created');

  // ============================================
  // CREATE EVENT APPROVALS
  // ============================================
  console.log('📝 Creating event approvals...');

  await prisma.eventApproval.create({
    data: {
      eventId: techFest.id,
      reviewerId: faculty.id,
      status: EventStatus.APPROVED,
      comments: 'Excellent proposal. Well-structured with clear objectives and budget.',
    },
  });

  await prisma.eventApproval.create({
    data: {
      eventId: aiWorkshop.id,
      reviewerId: faculty.id,
      status: EventStatus.APPROVED,
      comments: 'Great hands-on approach. Lab capacity matches expected attendance.',
    },
  });

  await prisma.eventApproval.create({
    data: {
      eventId: hackathon2025.id,
      reviewerId: faculty.id,
      status: EventStatus.APPROVED,
      comments: 'Approved. Ensure proper mentoring and judging criteria.',
    },
  });

  await prisma.eventApproval.create({
    data: {
      eventId: sportsMeet.id,
      reviewerId: faculty.id,
      status: EventStatus.APPROVED,
      comments: 'Good safety planning. Coordinate with sports department.',
    },
  });

  await prisma.eventApproval.create({
    data: {
      eventId: startupSummit.id,
      reviewerId: faculty.id,
      status: EventStatus.PENDING_APPROVAL,
      comments: 'Under review. Need more details on investor participation.',
    },
  });

  console.log('✅ Event approvals created');

  // ============================================
  // CREATE REGISTRATIONS
  // ============================================
  console.log('📋 Creating registrations...');

  const reg1 = await prisma.registration.create({
    data: {
      eventId: techFest.id,
      userId: participant.id,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  const reg2 = await prisma.registration.create({
    data: {
      eventId: techFest.id,
      userId: participant2.id,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const reg3 = await prisma.registration.create({
    data: {
      eventId: sportsMeet.id,
      userId: participant.id,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      attendedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const reg4 = await prisma.registration.create({
    data: {
      eventId: sportsMeet.id,
      userId: participant2.id,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      attendedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const reg5 = await prisma.registration.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      status: RegistrationStatus.CONFIRMED,
      registeredAt: new Date(lastMonth.getTime() - 20 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(lastMonth.getTime() - 19 * 24 * 60 * 60 * 1000),
      attendedAt: lastMonth,
    },
  });

  const reg6 = await prisma.registration.create({
    data: {
      eventId: aiWorkshop.id,
      userId: participant.id,
      status: RegistrationStatus.PENDING,
      registeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Registrations created');

  // ============================================
  // CREATE TICKETS
  // ============================================
  console.log('🎫 Creating tickets...');

  const generateToken = () => `FES-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const ticket1 = await prisma.ticket.create({
    data: {
      registrationId: reg1.id,
      token: generateToken(),
      status: TicketStatus.VALID,
      issuedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(techFest.endDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      registrationId: reg2.id,
      token: generateToken(),
      status: TicketStatus.VALID,
      issuedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(techFest.endDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      registrationId: reg3.id,
      token: generateToken(),
      status: TicketStatus.USED,
      issuedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      usedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      usedBy: volunteer.id,
      expiresAt: new Date(sportsMeet.endDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      registrationId: reg4.id,
      token: generateToken(),
      status: TicketStatus.USED,
      issuedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      usedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      usedBy: volunteer.id,
      expiresAt: new Date(sportsMeet.endDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      registrationId: reg5.id,
      token: generateToken(),
      status: TicketStatus.USED,
      issuedAt: new Date(lastMonth.getTime() - 19 * 24 * 60 * 60 * 1000),
      usedAt: lastMonth,
      usedBy: volunteer.id,
      expiresAt: new Date(lastMonth.getTime() + 48 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Tickets created');

  // ============================================
  // CREATE ATTENDANCE
  // ============================================
  console.log('✅ Creating attendance records...');

  await prisma.attendance.create({
    data: {
      eventId: sportsMeet.id,
      registrationId: reg3.id,
      ticketId: ticket3.id,
      scannedBy: volunteer.id,
      scannedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isManualEntry: false,
    },
  });

  await prisma.attendance.create({
    data: {
      eventId: sportsMeet.id,
      registrationId: reg4.id,
      ticketId: ticket4.id,
      scannedBy: volunteer.id,
      scannedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isManualEntry: false,
    },
  });

  await prisma.attendance.create({
    data: {
      eventId: hackathon2025.id,
      registrationId: reg5.id,
      ticketId: ticket5.id,
      scannedBy: volunteer.id,
      scannedAt: lastMonth,
      isManualEntry: false,
    },
  });

  console.log('✅ Attendance records created');

  // ============================================
  // CREATE TASKS
  // ============================================
  console.log('📋 Creating tasks...');

  await prisma.task.create({
    data: {
      eventId: techFest.id,
      title: 'Setup registration desk',
      description: 'Arrange tables, chairs, and registration materials at the auditorium entrance',
      assigneeId: volunteer.id,
      reporterId: organizer.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date(techFest.startDate.getTime() - 2 * 60 * 60 * 1000),
      estimatedHours: 2,
    },
  });

  await prisma.task.create({
    data: {
      eventId: techFest.id,
      title: 'Test audio/visual equipment',
      description: 'Verify projector, microphones, and sound system are working properly',
      assigneeId: volunteer2.id,
      reporterId: organizer.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      dueDate: new Date(techFest.startDate.getTime() - 4 * 60 * 60 * 1000),
      estimatedHours: 1.5,
      startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      eventId: techFest.id,
      title: 'Coordinate with keynote speakers',
      description: 'Confirm travel arrangements, slide decks, and speaking times for all keynotes',
      assigneeId: organizer.id,
      reporterId: organizer.id,
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 3,
      actualHours: 2.5,
      completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      eventId: sportsMeet.id,
      title: 'Prepare track and field equipment',
      description: 'Set up starting blocks, hurdles, measuring tapes, and timing equipment',
      assigneeId: volunteer.id,
      reporterId: organizer2.id,
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 4,
      actualHours: 3.5,
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      eventId: sportsMeet.id,
      title: 'Arrange medical support',
      description: 'Coordinate with campus health center for first aid station and ambulance on standby',
      assigneeId: volunteer2.id,
      reporterId: organizer2.id,
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.HIGH,
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      estimatedHours: 2,
    },
  });

  await prisma.task.create({
    data: {
      eventId: aiWorkshop.id,
      title: 'Prepare lab workstations',
      description: 'Install required ML libraries, datasets, and configure GPU access on all 60 workstations',
      assigneeId: volunteer.id,
      reporterId: organizer.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date(aiWorkshop.startDate.getTime() - 24 * 60 * 60 * 1000),
      estimatedHours: 6,
    },
  });

  console.log('✅ Tasks created');

  // ============================================
  // CREATE ISSUES
  // ============================================
  console.log('🚨 Creating issues...');

  await prisma.issue.create({
    data: {
      eventId: techFest.id,
      reportedBy: volunteer.id,
      title: 'Projector not displaying correct resolution',
      description: 'Main auditorium projector shows 1080p instead of 4K. Need to check HDMI cable and settings.',
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.OPEN,
    },
  });

  await prisma.issue.create({
    data: {
      eventId: sportsMeet.id,
      reportedBy: volunteer2.id,
      title: 'Water stations not refilled',
      description: 'Water stations at 200m and 400m marks are empty. Runners need hydration.',
      severity: IssueSeverity.HIGH,
      status: IssueStatus.IN_PROGRESS,
      assignedTo: organizer2.id,
    },
  });

  await prisma.issue.create({
    data: {
      eventId: hackathon2025.id,
      reportedBy: participant.id,
      title: 'WiFi connectivity issues in lab',
      description: 'Intermittent internet connection during hackathon affected team submissions',
      severity: IssueSeverity.HIGH,
      status: IssueStatus.RESOLVED,
      assignedTo: organizer.id,
      resolvedAt: new Date(lastMonth.getTime() + 12 * 60 * 60 * 1000),
      resolutionNotes: 'IT team restored connectivity. Backup mobile hotspots provided.',
    },
  });

  console.log('✅ Issues created');

  // ============================================
  // CREATE FINANCE DATA
  // ============================================
  console.log('💰 Creating finance data...');

  // Expense categories
  const catVenue = await prisma.expenseCategory.create({
    data: { name: 'Venue Rental', description: 'Venue booking and setup costs', color: '#3B82F6', isActive: true },
  });
  const catEquipment = await prisma.expenseCategory.create({
    data: { name: 'Equipment', description: 'Audio, visual, and technical equipment', color: '#10B981', isActive: true },
  });
  const catCatering = await prisma.expenseCategory.create({
    data: { name: 'Catering', description: 'Food and beverage expenses', color: '#F59E0B', isActive: true },
  });
  const catMarketing = await prisma.expenseCategory.create({
    data: { name: 'Marketing', description: 'Promotion, printing, and advertising', color: '#EF4444', isActive: true },
  });
  const catPrizes = await prisma.expenseCategory.create({
    data: { name: 'Prizes & Awards', description: 'Competition prizes and certificates', color: '#8B5CF6', isActive: true },
  });
  const catTravel = await prisma.expenseCategory.create({
    data: { name: 'Travel', description: 'Speaker and guest travel expenses', color: '#06B6D4', isActive: true },
  });
  const catMisc = await prisma.expenseCategory.create({
    data: { name: 'Miscellaneous', description: 'Other miscellaneous expenses', color: '#6B7280', isActive: true },
  });

  // Budgets
  await prisma.budget.create({
    data: {
      eventId: techFest.id,
      approvedAmount: 150000,
      currency: 'INR',
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.budget.create({
    data: {
      eventId: sportsMeet.id,
      approvedAmount: 200000,
      currency: 'INR',
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.budget.create({
    data: {
      eventId: hackathon2025.id,
      approvedAmount: 100000,
      currency: 'INR',
      approvedBy: finance.id,
      approvedAt: new Date(lastMonth.getTime() - 32 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.budget.create({
    data: {
      eventId: aiWorkshop.id,
      approvedAmount: 50000,
      currency: 'INR',
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Expenses for TechFest
  await prisma.expense.create({
    data: {
      eventId: techFest.id,
      categoryId: catVenue.id,
      description: 'Auditorium rental for 3 days including setup/teardown',
      amount: 45000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      recordedBy: organizer.id,
      status: ExpenseStatus.APPROVED,
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2026-001',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: techFest.id,
      categoryId: catEquipment.id,
      description: 'Additional sound system rental and backup projector',
      amount: 25000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      recordedBy: organizer.id,
      status: ExpenseStatus.APPROVED,
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2026-002',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: techFest.id,
      categoryId: catCatering.id,
      description: 'Lunch and refreshments for 300 attendees over 2 days',
      amount: 40000,
      currency: 'INR',
      expenseDate: new Date(techFest.startDate),
      recordedBy: organizer.id,
      status: ExpenseStatus.PENDING,
      receiptReference: 'INV-2026-003',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: techFest.id,
      categoryId: catMarketing.id,
      description: 'Posters, social media ads, and email campaign',
      amount: 15000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      recordedBy: organizer.id,
      status: ExpenseStatus.APPROVED,
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2026-004',
    },
  });

  // Expenses for Sports Meet
  await prisma.expense.create({
    data: {
      eventId: sportsMeet.id,
      categoryId: catVenue.id,
      description: 'Sports ground preparation and marking',
      amount: 30000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      recordedBy: organizer2.id,
      status: ExpenseStatus.APPROVED,
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2026-005',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: sportsMeet.id,
      categoryId: catEquipment.id,
      description: 'Timing system, starting blocks, and measurement equipment',
      amount: 40000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      recordedBy: organizer2.id,
      status: ExpenseStatus.APPROVED,
      approvedBy: finance.id,
      approvedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2026-006',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: sportsMeet.id,
      categoryId: catCatering.id,
      description: 'Energy drinks, water, and snacks for athletes',
      amount: 25000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      recordedBy: organizer2.id,
      status: ExpenseStatus.PENDING,
      receiptReference: 'INV-2026-007',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: sportsMeet.id,
      categoryId: catPrizes.id,
      description: 'Medals, trophies, and certificates for winners',
      amount: 35000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      recordedBy: organizer2.id,
      status: ExpenseStatus.PENDING,
      receiptReference: 'INV-2026-008',
    },
  });

  // Expenses for Hackathon 2025
  await prisma.expense.create({
    data: {
      eventId: hackathon2025.id,
      categoryId: catVenue.id,
      description: 'Lab access and utilities for 24 hours',
      amount: 15000,
      currency: 'INR',
      expenseDate: lastMonth,
      recordedBy: organizer.id,
      status: ExpenseStatus.PAID,
      approvedBy: finance.id,
      approvedAt: new Date(lastMonth.getTime() - 1 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2025-001',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: hackathon2025.id,
      categoryId: catCatering.id,
      description: 'Meals and caffeine for 120 participants for 24 hours',
      amount: 40000,
      currency: 'INR',
      expenseDate: lastMonth,
      recordedBy: organizer.id,
      status: ExpenseStatus.PAID,
      approvedBy: finance.id,
      approvedAt: new Date(lastMonth.getTime() - 1 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2025-002',
    },
  });

  await prisma.expense.create({
    data: {
      eventId: hackathon2025.id,
      categoryId: catPrizes.id,
      description: 'Cash prizes for top 3 teams and swag',
      amount: 30000,
      currency: 'INR',
      expenseDate: lastMonth,
      recordedBy: organizer.id,
      status: ExpenseStatus.PAID,
      approvedBy: finance.id,
      approvedAt: new Date(lastMonth.getTime() - 1 * 24 * 60 * 60 * 1000),
      receiptReference: 'INV-2025-003',
    },
  });

  // Expenses for AI Workshop
  await prisma.expense.create({
    data: {
      eventId: aiWorkshop.id,
      categoryId: catEquipment.id,
      description: 'GPU cloud credits for hands-on labs',
      amount: 20000,
      currency: 'INR',
      expenseDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      recordedBy: organizer.id,
      status: ExpenseStatus.PENDING,
      receiptReference: 'INV-2026-009',
    },
  });

  console.log('✅ Finance data created');

  // ============================================
  // CREATE SPONSOR DATA
  // ============================================
  console.log('🤝 Creating sponsor data...');

  const sponsor1 = await prisma.sponsor.create({
    data: {
      name: 'TechCorp Inc.',
      logoUrl: 'https://example.com/logos/techcorp.png',
      website: 'https://techcorp.com',
      contactName: 'Robert Chen',
      contactEmail: 'sponsor@techcorp.com',
      contactPhone: '+1-555-0100',
      address: '100 Tech Park, Silicon Valley, CA 94000',
      description: 'Leading technology solutions provider',
      isActive: true,
    },
  });

  const sponsor2 = await prisma.sponsor.create({
    data: {
      name: 'InnovateLabs',
      logoUrl: 'https://example.com/logos/innovatelabs.png',
      website: 'https://innovatelabs.io',
      contactName: 'Emily Watson',
      contactEmail: 'partnerships@innovatelabs.io',
      contactPhone: '+1-555-0200',
      address: '50 Innovation Drive, Boston, MA 02101',
      description: 'AI and ML research laboratory',
      isActive: true,
    },
  });

  const sponsor3 = await prisma.sponsor.create({
    data: {
      name: 'GreenEnergy Solutions',
      logoUrl: 'https://example.com/logos/greenenergy.png',
      website: 'https://greenenergy.com',
      contactName: 'Michael Torres',
      contactEmail: 'sponsorship@greenenergy.com',
      contactPhone: '+1-555-0300',
      address: '200 Solar Lane, Denver, CO 80202',
      description: 'Renewable energy technology company',
      isActive: true,
    },
  });

  // Sponsorships
  const sponsorship1 = await prisma.sponsorship.create({
    data: {
      eventId: techFest.id,
      sponsorId: sponsor1.id,
      title: 'Title Sponsor - TechFest 2026',
      description: 'Platinum sponsorship with naming rights, keynote slot, and booth space',
      promisedAmount: 100000,
      receivedAmount: 100000,
      currency: 'INR',
      status: SponsorshipStatus.ACTIVE,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(techFest.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const sponsorship2 = await prisma.sponsorship.create({
    data: {
      eventId: techFest.id,
      sponsorId: sponsor2.id,
      title: 'AI Track Sponsor',
      description: 'Sponsoring the AI/ML track with workshop session and demo booth',
      promisedAmount: 50000,
      receivedAmount: 50000,
      currency: 'INR',
      status: SponsorshipStatus.ACTIVE,
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(techFest.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const sponsorship3 = await prisma.sponsorship.create({
    data: {
      eventId: sportsMeet.id,
      sponsorId: sponsor3.id,
      title: 'Hydration Partner',
      description: 'Providing water stations and electrolyte drinks for all athletes',
      promisedAmount: 30000,
      receivedAmount: 30000,
      currency: 'INR',
      status: SponsorshipStatus.ACTIVE,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(sportsMeet.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const sponsorship4 = await prisma.sponsorship.create({
    data: {
      eventId: hackathon2025.id,
      sponsorId: sponsor1.id,
      title: 'Hackathon Platform Sponsor',
      description: 'Providing cloud credits and mentorship for hackathon participants',
      promisedAmount: 75000,
      receivedAmount: 75000,
      currency: 'INR',
      status: SponsorshipStatus.COMPLETED,
      startDate: new Date(lastMonth.getTime() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(lastMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Sponsor Contributions
  await prisma.sponsorContribution.create({
    data: {
      sponsorshipId: sponsorship1.id,
      amount: 50000,
      currency: 'INR',
      contributedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      reference: 'TXN-2026-001',
      recordedBy: finance.id,
    },
  });

  await prisma.sponsorContribution.create({
    data: {
      sponsorshipId: sponsorship1.id,
      amount: 50000,
      currency: 'INR',
      contributedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      reference: 'TXN-2026-002',
      recordedBy: finance.id,
    },
  });

  await prisma.sponsorContribution.create({
    data: {
      sponsorshipId: sponsorship2.id,
      amount: 50000,
      currency: 'INR',
      contributedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      reference: 'TXN-2026-003',
      recordedBy: finance.id,
    },
  });

  await prisma.sponsorContribution.create({
    data: {
      sponsorshipId: sponsorship3.id,
      amount: 30000,
      currency: 'INR',
      contributedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      reference: 'TXN-2026-004',
      recordedBy: finance.id,
    },
  });

  await prisma.sponsorContribution.create({
    data: {
      sponsorshipId: sponsorship4.id,
      amount: 75000,
      currency: 'INR',
      contributedAt: new Date(lastMonth.getTime() - 35 * 24 * 60 * 60 * 1000),
      reference: 'TXN-2025-001',
      recordedBy: finance.id,
    },
  });

  // Sponsor Benefits
  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship1.id,
      description: 'Logo on all event marketing materials (posters, website, social media)',
      expectedDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      responsiblePersonId: organizer.id,
      status: BenefitStatus.FULFILLED,
      fulfilledAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      fulfillmentNotes: 'Logo added to all digital and print materials',
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship1.id,
      description: '15-minute keynote speaking slot on Day 1',
      expectedDate: techFest.startDate,
      responsiblePersonId: organizer.id,
      status: BenefitStatus.PENDING,
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship1.id,
      description: 'Premium booth space (3x3m) in exhibition area',
      expectedDate: techFest.startDate,
      responsiblePersonId: organizer.id,
      status: BenefitStatus.PENDING,
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship2.id,
      description: 'AI Workshop session (90 minutes) on Day 2',
      expectedDate: new Date(techFest.startDate.getTime() + 24 * 60 * 60 * 1000),
      responsiblePersonId: organizer.id,
      status: BenefitStatus.PENDING,
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship2.id,
      description: 'Demo booth in AI exhibition zone',
      expectedDate: techFest.startDate,
      responsiblePersonId: organizer.id,
      status: BenefitStatus.PENDING,
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship3.id,
      description: 'Branded water stations at 5 locations',
      expectedDate: sportsMeet.startDate,
      responsiblePersonId: organizer2.id,
      status: BenefitStatus.IN_PROGRESS,
      fulfillmentNotes: 'Water stations being set up',
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship3.id,
      description: 'Logo on athlete bibs and signage',
      expectedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      responsiblePersonId: organizer2.id,
      status: BenefitStatus.FULFILLED,
      fulfilledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      fulfillmentNotes: 'Printed and distributed',
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship4.id,
      description: 'Cloud credits ($5000) for hackathon participants',
      expectedDate: lastMonth,
      responsiblePersonId: organizer.id,
      status: BenefitStatus.FULFILLED,
      fulfilledAt: lastMonth,
      fulfillmentNotes: 'Credits distributed to all registered teams',
    },
  });

  await prisma.sponsorBenefit.create({
    data: {
      sponsorshipId: sponsorship4.id,
      description: 'Technical mentors (3 engineers) for 24-hour duration',
      expectedDate: lastMonth,
      responsiblePersonId: organizer.id,
      status: BenefitStatus.FULFILLED,
      fulfilledAt: lastMonth,
      fulfillmentNotes: 'Mentors present throughout event',
    },
  });

  // Budget Allocations
  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship1.id,
      expenseCategoryId: catVenue.id,
      allocatedAmount: 45000,
      spentAmount: 45000,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship1.id,
      expenseCategoryId: catEquipment.id,
      allocatedAmount: 25000,
      spentAmount: 25000,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship1.id,
      expenseCategoryId: catMarketing.id,
      allocatedAmount: 15000,
      spentAmount: 15000,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship2.id,
      expenseCategoryId: catEquipment.id,
      allocatedAmount: 20000,
      spentAmount: 0,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship3.id,
      expenseCategoryId: catCatering.id,
      allocatedAmount: 30000,
      spentAmount: 0,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship4.id,
      expenseCategoryId: catEquipment.id,
      allocatedAmount: 30000,
      spentAmount: 30000,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship4.id,
      expenseCategoryId: catCatering.id,
      allocatedAmount: 40000,
      spentAmount: 40000,
    },
  });

  await prisma.budgetAllocation.create({
    data: {
      sponsorshipId: sponsorship4.id,
      expenseCategoryId: catPrizes.id,
      allocatedAmount: 5000,
      spentAmount: 5000,
    },
  });

  console.log('✅ Sponsor data created');

  // ============================================
  // CREATE COMPETITIONS
  // ============================================
  console.log('🏆 Creating competitions...');

  const hackathonComp = await prisma.competition.create({
    data: {
      eventId: hackathon2025.id,
      name: 'Hackathon 2025 - Main Competition',
      description: '24-hour hackathon building innovative solutions for social impact',
      rules: 'Teams of 3-4. Must use provided APIs. Final submission via GitHub. Demo required.',
      maxTeamSize: 4,
      minTeamSize: 3,
      registrationStartDate: new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(lastMonth.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: CompetitionStatus.COMPLETED,
      scoringConfig: {
        innovation: 30,
        technicalComplexity: 25,
        socialImpact: 25,
        presentation: 20,
      },
    },
  });

  const codingComp = await prisma.competition.create({
    data: {
      eventId: techFest.id,
      name: 'Code Sprint Challenge',
      description: '3-hour algorithmic coding competition',
      rules: 'Individual participation. 5 problems of varying difficulty. Standard input/output.',
      maxTeamSize: 1,
      minTeamSize: 1,
      registrationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(nextWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: CompetitionStatus.REGISTRATION_OPEN,
      scoringConfig: {
        correctness: 60,
        efficiency: 25,
        codeQuality: 15,
      },
    },
  });

  const sportsComp = await prisma.competition.create({
    data: {
      eventId: sportsMeet.id,
      name: 'Track & Field Championships',
      description: 'Inter-department athletics competition',
      rules: 'Standard IAAF rules. Departments may enter 2 athletes per event.',
      maxTeamSize: 2,
      minTeamSize: 1,
      registrationStartDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: CompetitionStatus.IN_PROGRESS,
      scoringConfig: {
        placement: 100,
      },
    },
  });

  // Competition Entries
  await prisma.competitionEntry.create({
    data: {
      competitionId: hackathonComp.id,
      teamName: 'Team Innovators',
      leaderId: participant.id,
      memberIds: [participant2.id],
      status: CompetitionEntryStatus.APPROVED,
      registeredAt: new Date(lastMonth.getTime() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.competitionEntry.create({
    data: {
      competitionId: hackathonComp.id,
      teamName: 'Code Warriors',
      leaderId: participant2.id,
      memberIds: [participant.id],
      status: CompetitionEntryStatus.APPROVED,
      registeredAt: new Date(lastMonth.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.competitionEntry.create({
    data: {
      competitionId: codingComp.id,
      teamName: null,
      leaderId: participant.id,
      memberIds: [],
      status: CompetitionEntryStatus.APPROVED,
      registeredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Competition Scores
  await prisma.competitionScore.create({
    data: {
      competitionId: hackathonComp.id,
      entryId: (await prisma.competitionEntry.findFirst({ where: { teamName: 'Team Innovators' } }))!.id,
      judgeId: faculty.id,
      criteriaScores: { innovation: 28, technicalComplexity: 24, socialImpact: 25, presentation: 18 },
      totalScore: 95,
      notes: 'Excellent social impact focus, great presentation',
      submittedAt: new Date(lastMonth.getTime() + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.competitionScore.create({
    data: {
      competitionId: hackathonComp.id,
      entryId: (await prisma.competitionEntry.findFirst({ where: { teamName: 'Code Warriors' } }))!.id,
      judgeId: faculty.id,
      criteriaScores: { innovation: 25, technicalComplexity: 25, socialImpact: 20, presentation: 16 },
      totalScore: 86,
      notes: 'Strong technical implementation, good demo',
      submittedAt: new Date(lastMonth.getTime() + 2 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Competitions created');

  // ============================================
  // CREATE CERTIFICATES
  // ============================================
  console.log('📜 Creating certificates...');

  await prisma.certificate.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      type: 'PARTICIPATION',
      title: 'Hackathon 2025 - Participation Certificate',
      description: 'Awarded for participating in the 24-hour Hackathon 2025',
      certificateNumber: 'HACK2025-PART-001',
      issuedAt: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
      issuedBy: organizer.id,
      status: CertificateStatus.ISSUED,
    },
  });

  await prisma.certificate.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      type: 'WINNER',
      title: 'Hackathon 2025 - 1st Place Winner',
      description: 'Awarded to Team Innovators for winning 1st place in Hackathon 2025',
      certificateNumber: 'HACK2025-WIN-001',
      issuedAt: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
      issuedBy: organizer.id,
      status: CertificateStatus.ISSUED,
    },
  });

  await prisma.certificate.create({
    data: {
      eventId: sportsMeet.id,
      userId: participant.id,
      type: 'PARTICIPATION',
      title: 'Annual Sports Meet 2026 - Participation Certificate',
      description: 'Awarded for participating in the Annual Sports Meet 2026',
      certificateNumber: 'SPORTS2026-PART-001',
      issuedAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      issuedBy: organizer2.id,
      status: CertificateStatus.ISSUED,
    },
  });

  console.log('✅ Certificates created');

  // ============================================
  // CREATE FEEDBACK
  // ============================================
  console.log('📊 Creating feedback...');

  const fbQ1 = await prisma.feedbackQuestion.create({
    data: {
      eventId: hackathon2025.id,
      type: FeedbackType.RATING,
      question: 'How would you rate the overall hackathon experience?',
      isRequired: true,
      order: 1,
    },
  });

  const fbQ2 = await prisma.feedbackQuestion.create({
    data: {
      eventId: hackathon2025.id,
      type: FeedbackType.RATING,
      question: 'How well organized was the event?',
      isRequired: true,
      order: 2,
    },
  });

  const fbQ3 = await prisma.feedbackQuestion.create({
    data: {
      eventId: hackathon2025.id,
      type: FeedbackType.TEXT,
      question: 'What did you like most about the hackathon?',
      isRequired: false,
      order: 3,
    },
  });

  const fbQ4 = await prisma.feedbackQuestion.create({
    data: {
      eventId: hackathon2025.id,
      type: FeedbackType.TEXT,
      question: 'What could be improved for next year?',
      isRequired: false,
      order: 4,
    },
  });

  const fbQ5 = await prisma.feedbackQuestion.create({
    data: {
      eventId: hackathon2025.id,
      type: FeedbackType.MULTIPLE_CHOICE,
      question: 'Which track was most interesting?',
      options: ['AI/ML', 'Web Dev', 'Mobile', 'Blockchain', 'IoT', 'Other'],
      isRequired: true,
      order: 5,
    },
  });

  // Feedback responses
  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      registrationId: reg5.id,
      questionId: fbQ1.id,
      answer: { rating: 5 },
      submittedAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      registrationId: reg5.id,
      questionId: fbQ2.id,
      answer: { rating: 4 },
      submittedAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      registrationId: reg5.id,
      questionId: fbQ3.id,
      answer: { text: 'Great mentorship, good food, exciting challenges' },
      submittedAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      registrationId: reg5.id,
      questionId: fbQ4.id,
      answer: { text: 'Better WiFi, more diverse problem statements' },
      submittedAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant.id,
      registrationId: reg5.id,
      questionId: fbQ5.id,
      answer: { choice: 'AI/ML' },
      submittedAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  );

  // Another participant feedback
  await prisma.feedbackResponse.create({
    data: {
      eventId: hackathon2025.id,
      userId: participant2.id,
      registrationId: (await prisma.registration.findFirst({ where: { eventId: hackathon2025.id, userId: participant2.id } }))?.id || reg5.id,
      questionId: fbQ1.id,
      answer: { rating: 4 },
      submittedAt: new Date(lastMonth.getTime() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Feedback created');

  // ============================================
  // CREATE NOTIFICATIONS
  // ============================================
  console.log('🔔 Creating notifications...');

  await prisma.notificationLog.create({
    data: {
      userId: participant.id,
      type: 'REGISTRATION_CONFIRMED',
      title: 'Registration Confirmed - TechFest 2026',
      message: 'Your registration for TechFest 2026 has been confirmed. Your ticket has been generated.',
      data: { eventId: techFest.id, registrationId: reg1.id },
      isRead: true,
      readAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notificationLog.create({
    data: {
      userId: participant.id,
      type: 'TICKET_GENERATED',
      title: 'Your Ticket is Ready - TechFest 2026',
      message: 'Your QR ticket for TechFest 2026 has been generated. Access it from your dashboard.',
      data: { eventId: techFest.id, ticketId: ticket1.id },
      isRead: false,
      createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notificationLog.create({
    data: {
      userId: organizer.id,
      type: 'EVENT_APPROVED',
      title: 'Event Approved - AI/ML Workshop Series',
      message: 'Your event "AI/ML Workshop Series" has been approved by faculty.',
      data: { eventId: aiWorkshop.id },
      isRead: true,
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notificationLog.create({
    data: {
      userId: volunteer.id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned - TechFest 2026',
      message: 'You have been assigned: "Setup registration desk" for TechFest 2026',
      data: { eventId: techFest.id, taskId: (await prisma.task.findFirst({ where: { title: 'Setup registration desk' } }))?.id },
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Notifications created');

  // ============================================
  // CREATE AUDIT LOGS
  // ============================================
  console.log('📋 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      userId: organizer.id,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: techFest.id,
      newData: { title: techFest.title, status: techFest.status },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: faculty.id,
      action: 'EVENT_APPROVED',
      entityType: 'Event',
      entityId: techFest.id,
      oldData: { status: EventStatus.PENDING_APPROVAL },
      newData: { status: EventStatus.APPROVED },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: organizer.id,
      action: 'EVENT_PUBLISHED',
      entityType: 'Event',
      entityId: techFest.id,
      oldData: { status: EventStatus.APPROVED },
      newData: { status: EventStatus.PUBLISHED },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: participant.id,
      action: 'REGISTRATION_CREATED',
      entityType: 'Registration',
      entityId: reg1.id,
      newData: { eventId: techFest.id, status: RegistrationStatus.CONFIRMED },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: finance.id,
      action: 'EXPENSE_APPROVED',
      entityType: 'Expense',
      entityId: (await prisma.expense.findFirst({ where: { description: 'Auditorium rental for 3 days including setup/teardown' } }))?.id || '',
      oldData: { status: ExpenseStatus.PENDING },
      newData: { status: ExpenseStatus.APPROVED },
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  console.log('✅ Audit logs created');

  console.log('🎉 FESTORA database seed completed successfully!');
  console.log('');
  console.log('📋 Demo Accounts (password: Password123!):');
  console.log('  👑 Admin:         admin@festora.edu');
  console.log('  👨‍🏫 Faculty:       faculty@festora.edu');
  console.log('  📋 Organizer:     organizer@festora.edu');
  console.log('  🙋 Volunteer:     volunteer@festora.edu');
  console.log('  🎫 Participant:   participant@festora.edu');
  console.log('  🤝 Sponsor:       sponsor@techcorp.com');
  console.log('  💰 Finance:       finance@festora.edu');
  console.log('');
  console.log('  Additional: organizer2@festora.edu, volunteer2@festora.edu, participant2@festora.edu');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });