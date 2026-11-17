import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, Badge } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { clsx } from "@/lib/clsx";

const demoEvents = [
  {
    id: "1",
    title: "TechFest 2024 - Annual Technical Festival",
    shortDescription: "Three days of innovation, competitions, workshops, and networking with industry leaders.",
    coverImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    status: "PUBLISHED",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-17"),
    venue: "Main Auditorium & Tech Block",
    maxAttendees: 500,
    currentAttendees: 342,
    tags: ["Technical", "Competition", "Workshop"],
    organizer: "Computer Science Department",
  },
  {
    id: "2",
    title: "AI & Machine Learning Workshop",
    shortDescription: "Hands-on workshop covering fundamentals of ML, neural networks, and practical applications.",
    coverImageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",
    status: "PUBLISHED",
    startDate: new Date("2024-02-20"),
    endDate: new Date("2024-02-20"),
    venue: "CS Lab 101",
    maxAttendees: 50,
    currentAttendees: 47,
    tags: ["Workshop", "AI/ML", "Hands-on"],
    organizer: "AI Club",
  },
  {
    id: "3",
    title: "Startup Pitch Competition",
    shortDescription: "Present your startup idea to a panel of investors and win funding and mentorship.",
    coverImageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
    status: "PUBLISHED",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-03-01"),
    venue: "Entrepreneurship Center",
    maxAttendees: 100,
    currentAttendees: 78,
    tags: ["Competition", "Entrepreneurship", "Pitch"],
    organizer: "E-Cell",
  },
  {
    id: "4",
    title: "Cultural Fest - Rhythms 2024",
    shortDescription: "Annual cultural festival featuring music, dance, drama, and art competitions.",
    coverImageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    status: "APPROVED",
    startDate: new Date("2024-04-10"),
    endDate: new Date("2024-04-12"),
    venue: "Open Air Theatre",
    maxAttendees: 1000,
    currentAttendees: 0,
    tags: ["Cultural", "Music", "Dance", "Arts"],
    organizer: "Cultural Committee",
  },
  {
    id: "5",
    title: "Cybersecurity Capture The Flag",
    shortDescription: "24-hour CTF competition testing your hacking and defense skills.",
    coverImageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    status: "DRAFT",
    startDate: new Date("2024-05-15"),
    endDate: new Date("2024-05-16"),
    venue: "Cyber Lab",
    maxAttendees: 30,
    currentAttendees: 0,
    tags: ["Competition", "Cybersecurity", "CTF"],
    organizer: "Security Club",
  },
  {
    id: "6",
    title: "Research Paper Writing Seminar",
    shortDescription: "Learn how to write and publish high-quality research papers from experienced faculty.",
    coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    status: "PUBLISHED",
    startDate: new Date("2024-02-28"),
    endDate: new Date("2024-02-28"),
    venue: "Seminar Hall A",
    maxAttendees: 80,
    currentAttendees: 65,
    tags: ["Seminar", "Research", "Academic"],
    organizer: "Research Cell",
  },
];

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

export function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEvents = demoEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200">
        <nav className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">FESTORA</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="py-12">
        <div className="container-app">
          <PageHeader
            title="Discover Events"
            description="Explore upcoming events, workshops, and competitions on campus"
            action={
              <Button variant="outline" className="hidden sm:flex">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            }
          />

          <div className="card mb-6">
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="search"
                    placeholder="Search events by title, description, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                    aria-label="Search events"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-auto"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                  </select>
                  <div className="hidden sm:flex border-l border-secondary-200 px-4" />
                  <Button variant={viewMode === "grid" ? "primary" : "outline"} onClick={() => setViewMode("grid")} aria-label="Grid view">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </Button>
                  <Button variant={viewMode === "list" ? "primary" : "outline"} onClick={() => setViewMode("list")} aria-label="List view">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </Button>
                </div>
              </div>
            </CardBody>
          </div>

          <div className="mb-4 text-sm text-secondary-600">
            Showing {filteredEvents.length} of {demoEvents.length} events
          </div>

          {viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="card overflow-hidden hover:shadow-card-hover transition-shadow h-full flex flex-col">
                  <div className="relative h-40 bg-secondary-100 overflow-hidden">
                    <img
                      src={event.coverImageUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={statusColors[event.status] as any}>{event.status}</Badge>
                    </div>
                  </div>
                  <CardBody className="flex-1 flex flex-col p-4">
                    <div className="flex items-center gap-2 text-xs text-secondary-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.startDate)}
                        {event.startDate.getTime() !== event.endDate.getTime() && (
                          <> - {formatDate(event.endDate)}</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </span>
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-secondary-600 mb-3 line-clamp-2 flex-1">{event.shortDescription}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {event.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{event.tags.length - 3} more</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                      <div className="flex items-center gap-1 text-sm text-secondary-500">
                        <Users className="h-4 w-4" />
                        <span>{event.currentAttendees}/{event.maxAttendees}</span>
                      </div>
                      <span className="text-sm font-medium text-primary-600 flex items-center gap-1">
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardBody>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600 hidden md:table-cell">Date & Venue</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600 hidden lg:table-cell">Organizer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Registration</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="px-4 py-4">
                        <Link to={`/events/${event.id}`} className="font-medium text-secondary-900 hover:text-primary-600">
                          {event.title}
                        </Link>
                        <p className="text-sm text-secondary-500 line-clamp-1 mt-1">{event.shortDescription}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{event.venue}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-sm text-secondary-600">
                        {event.organizer}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusColors[event.status] as any}>{event.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                          <Users className="h-4 w-4" />
                          <span>{event.currentAttendees}/{event.maxAttendees}</span>
                        </div>
                        <div className="h-1.5 w-24 bg-secondary-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all"
                            style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link to={`/events/${event.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-end gap-1">
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="card p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No events found</h3>
              <p className="text-secondary-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-secondary-900 text-secondary-300 py-8">
        <div className="container-app text-center text-sm">
          <p>© 2024 FESTORA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}