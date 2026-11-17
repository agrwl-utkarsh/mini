import { useAuthStore } from "@/stores/authStore";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  Calendar,
  Users,
  Ticket,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Award,
  Clock,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { clsx } from "@/lib/clsx";

const stats = [
  { label: "My Events", value: "12", icon: Calendar, color: "text-primary-600", bg: "bg-primary-100" },
  { label: "Registrations", value: "342", icon: Ticket, color: "text-green-600", bg: "bg-green-100" },
  { label: "Attendees", value: "1,234", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Tasks Pending", value: "8", icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-100" },
  { label: "Budget Used", value: "₹45,000", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-100" },
  { label: "Certificates Issued", value: "56", icon: Award, color: "text-pink-600", bg: "bg-pink-100" },
];

const recentEvents = [
  { id: "1", title: "TechFest 2024", date: "Mar 15-17, 2024", status: "PUBLISHED", registrations: 342, max: 500 },
  { id: "2", title: "AI Workshop", date: "Feb 20, 2024", status: "COMPLETED", registrations: 47, max: 50 },
  { id: "3", title: "Startup Pitch", date: "Mar 1, 2024", status: "PUBLISHED", registrations: 78, max: 100 },
  { id: "4", title: "Cultural Fest", date: "Apr 10-12, 2024", status: "APPROVED", registrations: 0, max: 1000 },
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

const upcomingTasks = [
  { id: "1", title: "Finalize venue booking", event: "TechFest 2024", due: "Tomorrow", priority: "HIGH" },
  { id: "2", title: "Send speaker confirmations", event: "AI Workshop", due: "In 2 days", priority: "MEDIUM" },
  { id: "3", title: "Review sponsorship proposals", event: "Startup Pitch", due: "In 5 days", priority: "HIGH" },
  { id: "4", title: "Prepare marketing materials", event: "Cultural Fest", due: "Next week", priority: "LOW" },
];

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
  URGENT: "bg-red-100 text-red-700",
};

export function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name || "Organizer"}! Here's what's happening with your events.`}
        action={
          <Link to="/dashboard/events/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                </div>
                <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={clsx("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link to="/dashboard/events" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-600">Registrations</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-600 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="px-4 py-3">
                        <Link to={`/dashboard/events/${event.id}`} className="font-medium text-secondary-900 hover:text-primary-600">
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {event.date}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx("badge", statusColors[event.status] as any)}>{event.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {event.registrations}/{event.max}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right pr-4">
                        <Link to={`/dashboard/events/${event.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming Tasks</CardTitle>
            <Link to="/dashboard/tasks" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-secondary-100">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-secondary-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-secondary-900">{task.title}</h4>
                      <p className="text-sm text-secondary-500 mt-1">{task.event}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx("badge text-xs", priorityColors[task.priority])}>{task.priority}</span>
                      <span className="text-xs text-secondary-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.due}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/dashboard/events/new" className="card p-4 hover:shadow-card-hover transition-shadow text-center group">
                <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <p className="font-medium text-secondary-900">Create Event</p>
                <p className="text-sm text-secondary-500 mt-1">Start a new event</p>
              </Link>
              <Link to="/dashboard/events" className="card p-4 hover:shadow-card-hover transition-shadow text-center group">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-secondary-900">Manage Registrations</p>
                <p className="text-sm text-secondary-500 mt-1">View & approve registrations</p>
              </Link>
              <Link to="/dashboard/tasks" className="card p-4 hover:shadow-card-hover transition-shadow text-center group">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-secondary-900">Team Tasks</p>
                <p className="text-sm text-secondary-500 mt-1">Assign & track tasks</p>
              </Link>
              <Link to="/dashboard/finance" className="card p-4 hover:shadow-card-hover transition-shadow text-center group">
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-medium text-secondary-900">Finance</p>
                <p className="text-sm text-secondary-500 mt-1">Budgets & expenses</p>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-secondary-100">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary-900">New registration for TechFest 2024</p>
                    <p className="text-xs text-secondary-500">2 minutes ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary-900">Speaker confirmed for AI Workshop</p>
                    <p className="text-xs text-secondary-500">1 hour ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary-900">Budget approval pending for Startup Pitch</p>
                    <p className="text-xs text-secondary-500">3 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-secondary-900">Certificates generated for AI Workshop</p>
                    <p className="text-xs text-secondary-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}