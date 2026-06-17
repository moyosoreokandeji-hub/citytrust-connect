import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Hammer,
  Home,
  Lock,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Users,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { CATEGORY_IMAGES, HERO_IMAGES, artisanAvatar } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CityTrust — Verified Service Access for Redemption City" },
      { name: "description", content: "Verified artisans, smart matching, job tracking, ratings, complaints, and city-level accountability — built for Redemption City." },
    ],
  }),
  component: Landing,
});

const CATEGORIES = [
  { id: "c1", name: "Plumbing", Icon: Droplets, description: "Leaks, taps, pipes and water systems" },
  { id: "c2", name: "Electrical", Icon: Zap, description: "Wiring, sockets, lighting and faults" },
  { id: "c3", name: "Cleaning", Icon: Home, description: "Homes, offices, hostels and facilities" },
  { id: "c4", name: "Carpentry", Icon: Hammer, description: "Furniture, doors, fittings and repairs" },
  { id: "c5", name: "AC Repair", Icon: Wind, description: "Cooling, servicing and installation" },
  { id: "c6", name: "Mechanics", Icon: Car, description: "Vehicle repair and maintenance" },
  { id: "c7", name: "Maintenance", Icon: Wrench, description: "General handyman support" },
];

const TRUST_POINTS = [
  { Icon: ShieldCheck, label: "Verified identity" },
  { Icon: ClipboardCheck, label: "Skill proof reviewed" },
  { Icon: MessageCircle, label: "Request-linked chat" },
  { Icon: Siren, label: "Emergency routing" },
];

function Landing() {
  const [serviceSearch, setServiceSearch] = useState("");
  const [searchHint, setSearchHint] = useState(false);

  function handleLandingSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = serviceSearch.trim();
    if (!term) {
      setSearchHint(true);
      return;
    }
    setSearchHint(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("citytrust:landing-search", term);
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <Header />

      <section className="relative border-b border-border bg-[linear-gradient(180deg,oklch(0.99_0.006_215)_0%,oklch(0.965_0.025_205)_100%)]">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_15%_20%,oklch(0.75_0.13_190/.22),transparent_28%),radial-gradient(circle_at_82%_18%,oklch(0.62_0.16_225/.18),transparent_30%)]" />
        <div className="absolute left-0 top-0 -z-0 h-full w-full opacity-[0.18] [background-image:linear-gradient(oklch(0.75_0.04_210)_1px,transparent_1px),linear-gradient(90deg,oklch(0.75_0.04_210)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="ct-animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Kingdom Hack 3.0 · Verified Service Access
            </div>
            <h1 className="mt-6 max-w-3xl text-balance text-[clamp(3.35rem,7.4vw,6.3rem)] font-black leading-[0.92] tracking-[-0.055em]">
              Trusted services for <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">Redemption City</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg">
              CityTrust connects residents, churches, hostels, businesses, facility managers, and visitors with verified artisans, transparent job tracking, secure messaging, verified reviews, complaint handling, and city operations insight.
            </p>

            <form onSubmit={handleLandingSearch} className="ct-animate-fade-up ct-delay-1 mt-8 max-w-2xl">
              <div className="group flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-[0_24px_80px_-36px_oklch(0.4_0.12_220/.55)] backdrop-blur transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  value={serviceSearch}
                  onChange={(event) => {
                    setServiceSearch(event.target.value);
                    if (searchHint) setSearchHint(false);
                  }}
                  placeholder="Search plumbing, AC repair, cleaning, electrical..."
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" size="lg" className="rounded-xl px-6 shadow-[var(--shadow-glow)]">
                  Find service <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              {searchHint && <p className="mt-2 text-sm font-medium text-destructive">Enter a service first, for example plumbing, electrical, cleaning, or AC repair.</p>}
            </form>

            <div className="ct-animate-fade-up ct-delay-2 mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl shadow-[var(--shadow-glow)]">
                <Link to="/resident-account">Find an Artisan</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl bg-card/80">
                <Link to="/artisan-account">Become Verified</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-xl">
                <a href="#city-operations">Explore City Operations</a>
              </Button>
            </div>

            <div className="ct-animate-fade-up ct-delay-3 mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_POINTS.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
                  <Icon className="h-4 w-4 text-primary" /> {label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative ct-animate-scale-in ct-delay-2">
            <div className="absolute -inset-5 -z-0 rounded-[2rem] bg-[image:var(--gradient-hero)] opacity-15 blur-2xl" />
            <div className="pointer-events-none absolute -right-8 top-8 z-10 hidden h-28 w-28 rounded-full border border-primary/20 lg:block ct-animate-orbit">
              <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_24px_oklch(0.58_0.12_200/.7)]" />
              <span className="absolute bottom-2 left-4 h-2 w-2 rounded-full bg-accent" />
            </div>
            <div className="pointer-events-none absolute -left-8 bottom-16 z-10 hidden h-20 w-20 rounded-[1.4rem] border border-primary/15 bg-white/20 backdrop-blur-md lg:block ct-animate-float-slow" />
            <div className="relative grid gap-4 lg:grid-cols-[1fr_0.86fr]">
              <div className="overflow-hidden rounded-[2rem] border border-card bg-card p-2 shadow-[0_34px_120px_-50px_oklch(0.32_0.12_220/.65)] ct-hover-lift">
                <SmartImage src={HERO_IMAGES[0]} alt="Verified artisan at work" categoryId="c2" fallbackLabel="Verified Service" className="flex h-[420px] w-full items-center justify-center rounded-[1.5rem] object-cover" />
              </div>
              <div className="grid gap-4">
                <SmartImage src={HERO_IMAGES[2]} alt="Plumbing service" categoryId="c1" fallbackLabel="Plumbing Service" className="flex h-48 w-full items-center justify-center rounded-[1.5rem] border border-card object-cover shadow-[var(--shadow-card)] ct-hover-lift" />
                <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-[var(--shadow-card)] ct-hover-lift">
                  <div className="flex items-center gap-3">
                    <SmartImage src={artisanAvatar("hero-1")} alt="Verified artisan" variant="avatar" className="h-12 w-12 rounded-full" />
                    <div>
                      <div className="font-bold">Samuel · Plumbing</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success"><BadgeCheck className="h-3 w-3" /> Verified</span>
                        <span>Rating 4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
                    Recommended for a Phase 2 plumbing request · ETA 22 min
                  </div>
                </div>
                <SmartImage src={HERO_IMAGES[1]} alt="Cleaning service" categoryId="c3" fallbackLabel="Cleaning Service" className="flex h-44 w-full items-center justify-center rounded-[1.5rem] border border-card object-cover shadow-[var(--shadow-card)] ct-hover-lift" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { value: "7", label: "Service categories" },
            { value: "3", label: "Connected roles" },
            { value: "24/7", label: "Emergency-ready flow" },
            { value: "100%", label: "Tracked job accountability" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ct-hover-lift">
              <div className="text-3xl font-black text-primary">{item.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Services</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Browse verified service categories</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Each category connects to artisans with verification status, trust score, response time, reviews, and complaint records.</p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-xl">
            <Link to="/dashboard">View all services <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ id, name, Icon, description }) => (
            <Link key={id} to="/dashboard" className="group overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ct-animate-fade-up ct-hover-lift">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <SmartImage src={CATEGORY_IMAGES[id]} alt={name} categoryId={id} fallbackLabel={name} className="flex h-full w-full items-center justify-center object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/15 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-primary-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/18 backdrop-blur"><Icon className="h-5 w-5" /></div>
                  <ArrowRight className="h-5 w-5 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
              </div>
              <div className="p-5">
                <div className="font-bold">{name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">How it works</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">One flow from request to accountability</h2>
            <p className="mt-3 text-muted-foreground">CityTrust keeps every action connected: request, recommendation, agreement, status, review, and complaint resolution.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { n: "01", t: "Describe the need", d: "Choose category, zone, urgency and job details.", Icon: ClipboardList },
              { n: "02", t: "Get the best fit", d: "The matcher prioritizes verification, location, availability and trust.", Icon: ShieldCheck },
              { n: "03", t: "Agree and track", d: "Confirm scope, chat with the artisan and follow the timeline.", Icon: MessageCircle },
              { n: "04", t: "Review or escalate", d: "Completed jobs get verified reviews; issues go to the admin console.", Icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.n} className="rounded-[1.4rem] border border-border bg-card p-5 shadow-[var(--shadow-card)] ct-hover-lift">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.Icon className="h-5 w-5" /></div>
                  <span className="text-xs font-black tracking-[0.25em] text-muted-foreground">{s.n}</span>
                </div>
                <h3 className="mt-5 font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-muted">
            <SmartImage src="/images/uploads/citytrustimage.png" alt="CityTrust verification and service access system" fallbackLabel="Verified Service Access" className="flex aspect-[4/3] w-full items-center justify-center object-cover ct-animate-pan" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-card/90 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Verified service access</div>
              <p className="mt-1 text-xs text-muted-foreground">Identity, skill proof, references, job history and complaint records work together.</p>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">About CityTrust</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">A trust layer for everyday services in Redemption City</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              CityTrust is not just an artisan list. It is a service access and accountability platform designed around verified providers, request-linked communication, scope agreement, job tracking, verified reviews, complaint handling, and city-wide operations data.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { Icon: BadgeCheck, t: "Verification center" },
                { Icon: BarChart3, t: "City operations analytics" },
                { Icon: Lock, t: "Escrow-ready model" },
                { Icon: Users, t: "Resident and artisan portals" },
              ].map((item) => (
                <div key={item.t} className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm font-medium ct-hover-lift">
                  <item.Icon className="h-4 w-4 text-primary" /> {item.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="city-operations" className="bg-[image:var(--gradient-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">City operations</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Built for Redemption City stakeholders</h2>
            <p className="mt-2 text-muted-foreground">One trust layer for people who live, work, worship, manage facilities, serve and visit.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Users, t: "Residents", d: "Fast access to verified repair support." },
              { Icon: Building2, t: "Churches & Hostels", d: "Facility upkeep with traceable accountability." },
              { Icon: Wrench, t: "Facility Managers", d: "Vetted vendors and a connected work trail." },
              { Icon: MapPin, t: "Visitors", d: "Trusted help while staying in the city." },
              { Icon: ShieldCheck, t: "Businesses", d: "Reliable service for daily operations." },
              { Icon: Siren, t: "Urgent Requests", d: "Priority routing for critical maintenance." },
              { Icon: BadgeCheck, t: "Verified Artisans", d: "Earn trust, reviews and steady work." },
              { Icon: BarChart3, t: "Admin Teams", d: "Demand, zones and complaint insights." },
            ].map((x) => (
              <div key={x.t} className="rounded-[1.4rem] border border-border bg-card p-5 shadow-[var(--shadow-card)] ct-hover-lift">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><x.Icon className="h-5 w-5" /></div>
                <div className="mt-4 font-bold">{x.t}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-[image:var(--gradient-hero)] p-8 text-primary-foreground shadow-[var(--shadow-glow)] md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"><Lock className="h-3.5 w-3.5" /> Future-ready capability</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Escrow Protection · Pay on Completion</h2>
              <p className="mt-3 max-w-2xl leading-7 opacity-90">A future payment protection layer where funds can be held securely and released after approved job completion, with disputes routed through CityTrust operations.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Resident initiates job", "Scope is agreed", "Artisan completes work", "Release after approval"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/15 p-4 text-sm font-semibold backdrop-blur">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Trust & safety</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Every provider earns their trust score</h2>
            <p className="mt-2 text-muted-foreground">A layered review process before service providers become active across Redemption City.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: BadgeCheck, t: "Identity verification", d: "Government ID checked against the applicant profile." },
              { Icon: Wrench, t: "Skill proof review", d: "Portfolio samples and trade evidence reviewed by admins." },
              { Icon: Users, t: "Reference check", d: "Prior clients and supervisors can confirm service history." },
              { Icon: ShieldCheck, t: "Trust score", d: "A live score based on reviews, response time and reliability." },
              { Icon: ClipboardList, t: "Complaint history", d: "Formal complaints are tracked and resolved with status updates." },
              { Icon: CheckCircle2, t: "Admin approval", d: "Final sign-off is required before a provider becomes active." },
            ].map((f) => (
              <div key={f.t} className="rounded-[1.4rem] border border-border bg-card p-5 shadow-[var(--shadow-card)] ct-hover-lift">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><f.Icon className="h-5 w-5" /></div>
                <div className="mt-3 font-bold">{f.t}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} CityTrust · Verified Service Access for Redemption City</div>
          <div className="flex gap-4">
            <a href="#city-operations" className="hover:text-foreground">City Operations</a>
            <Link to="/resident-account" className="hover:text-foreground">Resident Access</Link>
            <Link to="/artisan-account" className="hover:text-foreground">Artisan Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
