import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Layers, Database, Server, ShieldCheck, Gauge, MessageCircle, CreditCard, Siren, BarChart3, Code2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/architecture")({
  head: () => ({ meta: [{ title: "System Architecture — CityTrust" }] }),
  component: Architecture,
});

function Architecture() {
  const layers = [
    { Icon: Layers, title: "Current Frontend", text: "React + TanStack Start, Vite, TypeScript and Tailwind CSS." },
    { Icon: Layers, title: "Production Frontend", text: "Next.js + React + Tailwind CSS." },
    { Icon: Server, title: "Backend", text: "Node.js / Express or Next.js API routes." },
    { Icon: Database, title: "Database", text: "PostgreSQL." },
    { Icon: Code2, title: "ORM", text: "Prisma." },
    { Icon: ShieldCheck, title: "Auth", text: "JWT / Auth.js with role-based access control (resident, artisan, admin)." },
    { Icon: Gauge, title: "Smart Matching", text: "Rule-based scoring now, expandable to assisted categorization later." },
  ];

  const weights = [
    { label: "Verified artisan", points: "+30" },
    { label: "Category match", points: "+25" },
    { label: "Same service zone", points: "+15" },
    { label: "Currently available", points: "+10" },
    { label: "Rating above 4.0", points: "+10" },
    { label: "Trust score above 80", points: "+10" },
    { label: "Fast emergency response (≤25 min)", points: "+10 (urgent / emergency only)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
          <p className="mt-2 text-muted-foreground">How CityTrust connects residents, verified artisans and city operations across Redemption City.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layers.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold">Request → Match → Service flow</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Resident creates a service request (category, zone, urgency, description).</li>
            <li>2. CityTrust Matcher scores every artisan using the weighted rules below.</li>
            <li>3. Top artisan is recommended with a short explanation and live trust breakdown.</li>
            <li>4. Pre-service scope agreement (price, ETA, materials) → Accepted → On the way → In progress → Completed.</li>
            <li>5. Resident leaves a verified job review or files a complaint; admin investigates, escalates or resolves.</li>
            <li>6. Trust scores update from verification, ratings, completion rate, response time and complaint history.</li>
          </ol>
        </div>

        {/* Smart matching weights */}
        <div className="rounded-2xl border border-border bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Smart matching weights</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Each candidate artisan is scored by these rules. Higher total = better match. The top-scoring artisan is recommended first, with reason chips explaining why.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {weights.map((w) => (
              <div key={w.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span>{w.label}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{w.points}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
            For <strong>urgent</strong> and <strong>emergency</strong> requests, the matcher additionally boosts nearby verified artisans who are available and have fast historical response times.
          </div>
        </div>

        {/* API contracts callout */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="font-semibold">API contracts (production backend)</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full REST endpoint specs with request/response examples for residents, artisans and admin.</p>
          </div>
          <Button asChild>
            <Link to="/api-contracts">View API contracts <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* WhatsApp / SMS future card */}
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Future integration: WhatsApp & SMS alerts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Residents and artisans will be able to receive service updates, scope confirmations, ETAs, reminders and emergency alerts directly through WhatsApp and SMS — keeping the accountability loop alive even when users are off the app.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border bg-card px-2.5 py-1">Job status updates</span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1">Artisan ETA</span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1">Scope agreement reminders</span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1">Emergency dispatch alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Other future */}
        <div>
          <h2 className="text-lg font-semibold">Other planned integrations</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[
              { Icon: CreditCard, title: "Escrow protection (pay on completion)" },
              { Icon: Siren, title: "Emergency dispatch network" },
              { Icon: BarChart3, title: "City operations analytics" },
              { Icon: Zap, title: "Assisted issue categorization" },
            ].map(({ Icon, title }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
