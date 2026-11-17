import { Link } from "react-router-dom";
import { Button, Card, CardBody, Badge } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  Calendar,
  Ticket,
  Users,
  CheckCircle,
  Shield,
  BarChart3,
  ArrowRight,
  Star,
  Zap,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Event Management",
    description: "Create, manage, and publish events with ease. From workshops to hackathons, handle every detail in one place.",
  },
  {
    icon: Ticket,
    title: "Smart Registration",
    description: "Automated registration workflows with waitlists, approvals, and custom forms. No more manual spreadsheets.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Assign tasks, track progress, and coordinate with volunteers and organizers. Built-in communication tools.",
  },
  {
    icon: CheckCircle,
    title: "QR Check-in",
    description: "Fast, secure entry verification with QR code tickets. Real-time attendance tracking and analytics.",
  },
  {
    icon: Shield,
    title: "Approval Workflows",
    description: "Multi-level approval system for events, budgets, and expenses. Faculty oversight with audit trails.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Comprehensive dashboards with attendance trends, feedback analysis, and financial reports.",
  },
];

const stats = [
  { value: "500+", label: "Events Managed" },
  { value: "50K+", label: "Registrations" },
  { value: "99%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const testimonials = [
  {
    quote: "FESTORA transformed how our college manages events. What used to take weeks now takes hours.",
    author: "Dr. Sarah Mitchell",
    role: "Dean of Student Affairs",
    avatar: "SM",
  },
  {
    quote: "The QR check-in feature alone saved us 200+ hours during our annual tech fest. Incredible ROI.",
    author: "Rajesh Kumar",
    role: "Event Organizer",
    avatar: "RK",
  },
  {
    quote: "Finally, a platform that understands academic event workflows. The approval system is a game-changer.",
    author: "Prof. Emily Chen",
    role: "Faculty Advisor",
    avatar: "EC",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-secondary-200">
        <nav className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">FESTORA</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors">
              Events
            </Link>
            <Link href="#features" className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors">
              Testimonials
            </Link>
            <Link href="/login" className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                <span>New: AI-powered event recommendations</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900 tracking-tight mb-6">
                Powering Every Event.<br />
                <span className="text-primary-600">Elevating Every Experience.</span>
              </h1>
              <p className="text-lg sm:text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
                The all-in-one platform for college event management. From creation to certificates,
                streamline every step of your event lifecycle.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/events">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Events
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" />
          </div>
        </section>

        <section id="features" className="py-20 lg:py-32 bg-white">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                Everything you need to run successful events
              </h2>
              <p className="text-lg text-secondary-600">
                Comprehensive tools designed specifically for academic event workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <article key={index} className="card p-6 hover:shadow-card-hover transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">{feature.title}</h3>
                  <p className="text-secondary-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-secondary-50">
          <div className="container-app">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-6">
                  Built for the complete event lifecycle
                </h2>
                <p className="text-lg text-secondary-600 mb-8">
                  From the first draft to the final certificate, FESTORA handles all 11 steps of your event lifecycle
                  with purpose-built tools for each phase.
                </p>
                <div className="space-y-4">
                  {[
                    "Create & Draft Events",
                    "Faculty Approval Workflows",
                    "Publish & Promote",
                    "Online Registration & Waitlists",
                    "QR Ticket Generation",
                    "Entry Verification & Check-in",
                    "Real-time Attendance",
                    "Event Execution Tools",
                    "Feedback Collection",
                    "Certificate Generation",
                    "Analytics & Reports",
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-secondary-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="card p-6 text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary-600 mb-1">{stat.value}</div>
                    <div className="text-secondary-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 lg:py-32 bg-white">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                Trusted by leading institutions
              </h2>
              <p className="text-lg text-secondary-600">
                See what event organizers and faculty are saying about FESTORA.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <article key={index} className="card p-6">
                  <div className="flex gap-1 mb-4" aria-label="5 star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-secondary-700 mb-6 italic">"{testimonial.quote}"</blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-secondary-900">{testimonial.author}</div>
                      <div className="text-sm text-secondary-500">{testimonial.role}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32 bg-primary-600">
          <div className="container-app text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to transform your event management?
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Join 500+ colleges already using FESTORA. Start your free trial today.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-secondary-900 text-secondary-300 py-12">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FESTORA</span>
              </div>
              <p className="text-secondary-400 text-sm">Powering Every Event. Elevating Every Experience.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-secondary-500">© 2024 FESTORA. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"></path></svg>
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}