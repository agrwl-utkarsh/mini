import { useParams, Link } from "react-router-dom";
import { Button, Card, CardBody, Badge } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Tag,
  ArrowLeft,
  Share2,
  Heart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { clsx } from "@/lib/clsx";

const demoEvent = {
  id: "1",
  title: "TechFest 2024 - Annual Technical Festival",
  description: `
    <p>TechFest 2024 is the flagship annual technical festival of our institution, bringing together the brightest minds in technology, innovation, and entrepreneurship. This three-day extravaganza features a diverse range of events designed to challenge, inspire, and connect the next generation of tech leaders.</p>
    
    <h3>What to Expect</h3>
    <ul>
      <li><strong>Technical Competitions:</strong> Coding challenges, hackathons, robotics competitions, and CTF events</li>
      <li><strong>Workshops:</strong> Hands-on sessions on AI/ML, blockchain, cloud computing, cybersecurity, and more</li>
      <li><strong>Keynote Sessions:</strong> Industry leaders sharing insights on emerging technologies and career paths</li>
      <li><strong>Networking:</strong> Connect with peers, faculty, alumni, and industry professionals</li>
      <li><strong>Startup Showcase:</strong> Pitch your ideas to investors and win funding</li>
    </ul>
    
    <h3>Schedule Highlights</h3>
    <p><strong>Day 1:</strong> Inauguration, Keynote by Tech Industry Leader, Coding Competition Prelims</p>
    <p><strong>Day 2:</strong> Workshops, Hackathon Begins, Technical Paper Presentations, Startup Pitch</p>
    <p><strong>Day 3:</strong> Hackathon Finals, Robotics Competition, Valedictory Ceremony, Prize Distribution</p>
    
    <h3>Registration</h3>
    <p>Registration is open to all students. Early bird registration ends Feb 28, 2024. Group discounts available for teams of 3 or more.</p>
  `,
  shortDescription: "Three days of innovation, competitions, workshops, and networking with industry leaders.",
  coverImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
  status: "PUBLISHED",
  startDate: new Date("2024-03-15T09:00:00"),
  endDate: new Date("2024-03-17T18:00:00"),
  registrationStartDate: new Date("2024-01-15"),
  registrationEndDate: new Date("2024-03-10"),
  maxAttendees: 500,
  currentAttendees: 342,
  venue: {
    name: "Main Auditorium & Tech Block",
    address: "College Campus, Main Building",
    capacity: 600,
  },
  organizer: {
    name: "Computer Science Department",
    email: "cs-dept@college.edu",
  },
  tags: ["Technical", "Competition", "Workshop", "Hackathon", "Networking", "AI/ML"],
  speakers: [
    { name: "Dr. Ananya Sharma", role: "Director, AI Research Lab", company: "TechCorp Inc." },
    { name: "Rahul Verma", role: "Senior Engineer", company: "Google" },
    { name: "Priya Nair", role: "Startup Founder", company: "InnovateX" },
  ],
  sponsors: [
    { name: "TechCorp", tier: "Platinum", logo: "https://via.placeholder.com/120x60" },
    { name: "Google Developer Groups", tier: "Gold", logo: "https://via.placeholder.com/120x60" },
    { name: "Microsoft Learn", tier: "Silver", logo: "https://via.placeholder.com/120x60" },
    { name: "AWS Educate", tier: "Bronze", logo: "https://via.placeholder.com/120x60" },
  ],
};

const statusColors: Record<string, string> = {
  PUBLISHED: "success",
  APPROVED: "primary",
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  REJECTED: "danger",
  ONGOING: "primary",
  COMPLETED: "secondary",
  CANCELLED: "danger",
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = demoEvent;

  const isRegistrationOpen =
    event.registrationStartDate && event.registrationEndDate &&
    new Date() >= event.registrationStartDate && new Date() <= event.registrationEndDate;

  const isEventUpcoming = new Date() < event.startDate;
  const isEventOngoing = new Date() >= event.startDate && new Date() <= event.endDate;
  const isEventPast = new Date() > event.endDate;

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-30">
        <nav className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/events" className="btn-ghost p-2" aria-label="Back to events">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">FESTORA</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm hidden sm:block">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <article className="bg-white">
          <div className="relative h-64 sm:h-80 lg:h-96">
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="container-app">
                <div className="flex flex-wrap items-end gap-3 mb-2">
                  <Badge variant={statusColors[event.status] as any} className="text-sm px-3 py-1">
                    {event.status}
                  </Badge>
                  {isEventUpcoming && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50">
                      Upcoming
                    </Badge>
                  )}
                  {isEventOngoing && (
                    <Badge variant="outline" className="bg-primary-500/10 text-primary-700 border-primary-500/50">
                      Live Now
                    </Badge>
                  )}
                  {isEventPast && (
                    <Badge variant="outline" className="bg-secondary-500/10 text-secondary-700 border-secondary-500/50">
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.venue.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.currentAttendees}/{event.maxAttendees} registered
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="container-app py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-4">About this Event</h2>
                  <div className="prose prose-secondary max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-4">Key Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <h3 className="font-medium text-secondary-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary-600" />
                        Date & Time
                      </h3>
                      <p className="text-secondary-600">{formatDateTime(event.startDate)}</p>
                      <p className="text-secondary-600">to {formatDateTime(event.endDate)}</p>
                    </div>
                    <div className="card p-4">
                      <h3 className="font-medium text-secondary-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary-600" />
                        Venue
                      </h3>
                      <p className="text-secondary-600 font-medium">{event.venue.name}</p>
                      <p className="text-secondary-500 text-sm">{event.venue.address}</p>
                      <p className="text-secondary-500 text-sm">Capacity: {event.venue.capacity}</p>
                    </div>
                    <div className="card p-4">
                      <h3 className="font-medium text-secondary-900 mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary-600" />
                        Registration Period
                      </h3>
                      <p className="text-secondary-600">
                        {event.registrationStartDate ? formatDate(event.registrationStartDate) : "Open"} -
                        {event.registrationEndDate ? formatDate(event.registrationEndDate) : "Until event starts"}
                      </p>
                    </div>
                    <div className="card p-4">
                      <h3 className="font-medium text-secondary-900 mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" />
                        Organizer
                      </h3>
                      <p className="text-secondary-600 font-medium">{event.organizer.name}</p>
                      <p className="text-secondary-500 text-sm">{event.organizer.email}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-4">Speakers</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {event.speakers.map((speaker, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-lg">
                            {speaker.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">{speaker.name}</p>
                            <p className="text-sm text-secondary-500">{speaker.role}</p>
                            <p className="text-sm text-secondary-400">{speaker.company}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-4">Sponsors</h2>
                  <div className="flex flex-wrap items-center gap-6">
                    {event.sponsors.map((sponsor, index) => (
                      <div key={index} className="flex items-center gap-2 px-4 py-2 bg-secondary-50 rounded-lg">
                        <span className="text-xs font-medium text-secondary-500 uppercase">{sponsor.tier}</span>
                        <span className="font-medium text-secondary-900">{sponsor.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardBody className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-secondary-900">Registration</h3>
                      <Badge variant={isRegistrationOpen ? "success" : "secondary"}>
                        {isRegistrationOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-600">Registered</span>
                        <span className="font-medium text-secondary-900">{event.currentAttendees} / {event.maxAttendees}</span>
                      </div>
                      <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all"
                          style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-secondary-500">
                        {Math.round((event.currentAttendees / event.maxAttendees) * 100)}% full
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" disabled={!isRegistrationOpen || event.currentAttendees >= event.maxAttendees}>
                        {isRegistrationOpen ? "Register Now" : "Registration Closed"}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" className="w-full text-sm">
                      <Heart className="h-4 w-4" />
                      Save Event
                    </Button>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6 space-y-4">
                    <h3 className="font-semibold text-secondary-900">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4" />
                        Add to Calendar
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Share2 className="h-4 w-4" />
                        Share Event
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Heart className="h-4 w-4" />
                        Save for Later
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </article>
      </main>

      <footer className="bg-secondary-900 text-secondary-300 py-8">
        <div className="container-app text-center text-sm">
          <p>© 2024 FESTORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}