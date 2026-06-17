import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Code2 } from "lucide-react";

export const Route = createFileRoute("/api-contracts")({
  head: () => ({ meta: [{ title: "API Contracts — CityTrust" }] }),
  component: ApiContractsPage,
});

interface Endpoint {
  method: "GET" | "POST" | "PATCH";
  path: string;
  purpose: string;
  request?: object;
  response: object;
}

const endpoints: Endpoint[] = [
  {
    method: "POST", path: "/api/auth/register", purpose: "Register a new resident or artisan account.",
    request: { role: "resident", full_name: "Ada Obi", email: "ada@example.com", phone: "+234...", password: "***", location_zone: "Phase 2" },
    response: { user: { id: "u_123", role: "resident" }, token: "jwt..." },
  },
  {
    method: "POST", path: "/api/auth/login", purpose: "Authenticate a user and issue a JWT session.",
    request: { email: "ada@example.com", password: "***" },
    response: { token: "jwt...", user: { id: "u_123", role: "resident" } },
  },
  {
    method: "GET", path: "/api/artisans", purpose: "List verified artisans with filters (category, zone, availability).",
    response: { artisans: [{ id: "a1", business_name: "Adeyemi Plumbing", trust_score: 92, rating: 4.8 }] },
  },
  {
    method: "GET", path: "/api/artisans/:id", purpose: "Fetch full artisan profile with trust breakdown and portfolio.",
    response: { id: "a1", business_name: "Adeyemi Plumbing", checks: { identity: "verified", admin_approval: "verified" }, trust_score: 92 },
  },
  {
    method: "POST", path: "/api/artisans/apply", purpose: "Submit artisan onboarding application for verification.",
    request: { full_name: "Tunde Bello", business_name: "Bello Carpentry", category_id: "c4", location_zone: "Phase 3", uploads: { identity: true, selfie: true, skill_proof: true, portfolio: true }, reference: { name: "John Doe", phone: "+234...", relationship: "Previous client" } },
    response: { id: "a_new", verification_status: "under_review" },
  },
  {
    method: "PATCH", path: "/api/admin/artisans/:id/verify", purpose: "Admin action: approve, reject, or request more info on an artisan.",
    request: { decision: "verified", notes: "All documents check out." },
    response: { id: "a1", verification_status: "verified" },
  },
  {
    method: "POST", path: "/api/service-requests", purpose: "Resident creates a new service request.",
    request: { category_id: "c1", issue_description: "Kitchen sink leaking", urgency: "high", location_zone: "Phase 2", preferred_time: "Today evening" },
    response: { id: "r_123", status: "pending" },
  },
  {
    method: "GET", path: "/api/service-requests", purpose: "List service requests for the current user (resident or artisan).",
    response: { requests: [{ id: "r_123", status: "matched", artisan_id: "a1" }] },
  },
  {
    method: "GET", path: "/api/service-requests/:id", purpose: "Fetch a single service request with timeline, scope and chat preview.",
    response: { id: "r_123", status: "in_progress", scope: { price_estimate: "₦8k-₦15k", eta: "Within 1 hr", status: "agreed" } },
  },
  {
    method: "PATCH", path: "/api/service-requests/:id/status", purpose: "Update a service request status (accepted, on_the_way, in_progress, completed).",
    request: { status: "in_progress" },
    response: { id: "r_123", status: "in_progress" },
  },
  {
    method: "POST", path: "/api/reviews", purpose: "Submit a verified review after a completed service request.",
    request: { request_id: "r_123", artisan_id: "a1", rating: 5, comment: "Excellent work" },
    response: { id: "rv_1", verified: true },
  },
  {
    method: "POST", path: "/api/complaints", purpose: "File a formal complaint linked to a service request.",
    request: { request_id: "r_123", artisan_id: "a1", complaint_text: "Technician arrived late." },
    response: { id: "cp_1", status: "open" },
  },
  {
    method: "PATCH", path: "/api/admin/complaints/:id/status", purpose: "Admin updates a complaint (investigating, escalated, resolved).",
    request: { status: "resolved", notes: "Refund issued." },
    response: { id: "cp_1", status: "resolved" },
  },
  {
    method: "GET", path: "/api/admin/dashboard", purpose: "Admin overview: users, verifications, requests, complaints.",
    response: { users: 412, verified_artisans: 87, open_requests: 23, open_complaints: 4 },
  },
  {
    method: "GET", path: "/api/admin/analytics", purpose: "City-level analytics: demand by category and zone, emergencies, top artisans.",
    response: { demand_by_category: [{ name: "Plumbing", count: 38 }], demand_by_zone: [{ name: "Phase 2", count: 41 }], emergencies: 2 },
  },
];

const methodColor = (m: string) =>
  m === "GET" ? "bg-info/10 text-info" :
  m === "POST" ? "bg-success/10 text-success" :
  "bg-warning/15 text-warning-foreground";

function CodeBlock({ data }: { data: object }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

function ApiContractsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Code2 className="h-3.5 w-3.5" /> Production backend reference
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">API Contracts</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Planned REST endpoints for the production CityTrust backend (Node.js / Express or Next.js API routes, PostgreSQL with Prisma, JWT auth).
            The current interface uses in-browser project data while these contracts define how the live API will be shaped in production.
          </p>
        </div>

        <div className="space-y-4">
          {endpoints.map((e) => (
            <article key={e.method + e.path} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <header className="flex flex-wrap items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${methodColor(e.method)}`}>{e.method}</span>
                <code className="font-mono text-sm">{e.path}</code>
              </header>
              <p className="mt-2 text-sm text-muted-foreground">{e.purpose}</p>
              <div className={`mt-3 grid gap-3 ${e.request ? "md:grid-cols-2" : ""}`}>
                {e.request && (
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request body</div>
                    <CodeBlock data={e.request} />
                  </div>
                )}
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Response</div>
                  <CodeBlock data={e.response} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
