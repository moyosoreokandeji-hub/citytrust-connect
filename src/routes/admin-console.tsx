import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useDB, store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, UrgencyBadge, VerificationBadge } from "@/components/Badges";
import { AdminVerificationModal } from "@/components/AdminVerificationModal";
import { Users, ShieldCheck, ClipboardList, MessageSquareWarning, CheckCircle2, Clock, BarChart3, AlertTriangle, LockKeyhole, Network, FileCode2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-console")({
  head: () => ({ meta: [{ title: "Admin Console — CityTrust" }] }),
  component: Admin,
});

function Admin() {
  const [email, setEmail] = useState("staff@citytrust.org");
  const [password, setPassword] = useState("citytrust-access");
  const [reviewingArtisanId, setReviewingArtisanId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatMin, setNewCatMin] = useState("");
  const [newCatMax, setNewCatMax] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, { name: string; description: string; price_min: string; price_max: string; price_note: string }>>({});
  const db = useDB();
  const isAuthed = Boolean(db.authSessions?.adminUserId);

  function signIn() {
    if (!email.trim() || !password.trim()) {
      toast.error("Enter staff email and password");
      return;
    }
    const user = store.signIn(email, "admin", password);
    if (!user) {
      toast.error("Invalid admin credentials");
      return;
    }
    toast.success("Welcome to CityTrust Admin Console");
  }

  if (!isAuthed) {
    return <AdminLogin email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={signIn} />;
  }
  const metrics = {
    users: db.users.length,
    artisans: db.artisans.length,
    verified: db.artisans.filter((a) => a.verification_status === "verified").length,
    pendingVer: db.artisans.filter((a) => a.verification_status !== "verified").length,
    openReq: db.requests.filter((r) => !["completed", "reviewed"].includes(r.status)).length,
    completed: db.requests.filter((r) => ["completed", "reviewed"].includes(r.status)).length,
    complaints: db.complaints.filter((c) => c.status !== "resolved").length,
  };

  // category demand
  const demandByCat = db.categories.map((c) => ({
    name: c.name,
    count: db.requests.filter((r) => r.category_id === c.id).length,
  }));
  const maxDemand = Math.max(1, ...demandByCat.map((d) => d.count));

  const demandByZone = Array.from(new Set(db.requests.map((r) => r.location_zone))).map((z) => ({
    name: z,
    count: db.requests.filter((r) => r.location_zone === z).length,
  }));
  const maxZone = Math.max(1, ...demandByZone.map((d) => d.count));

  // complaint rate by category
  const complaintsByCat = db.categories.map((c) => {
    const catArtisanIds = db.artisans.filter((a) => a.category_id === c.id).map((a) => a.id);
    return { name: c.name, count: db.complaints.filter((cp) => catArtisanIds.includes(cp.artisan_id)).length };
  });
  const maxComplaintCat = Math.max(1, ...complaintsByCat.map((d) => d.count));

  // monthly completed (mocked across last 6 months)
  const monthlyCompleted = [
    { name: "Jan", count: 24 }, { name: "Feb", count: 31 }, { name: "Mar", count: 28 },
    { name: "Apr", count: 42 }, { name: "May", count: 47 },
    { name: "Jun", count: db.requests.filter((r) => ["completed", "reviewed"].includes(r.status)).length + 38 },
  ];
  const maxMonthly = Math.max(...monthlyCompleted.map((d) => d.count));

  const emergencyCount = db.requests.filter((r) => r.urgency === "emergency").length;

  function addCategory() {
    if (!newCat.trim()) return;
    store.addCategory(newCat, newCatDesc);
    const newest = store.get().categories.at(-1);
    if (newest) {
      store.updateCategory(newest.id, { price_min: newCatMin, price_max: newCatMax, price_note: "Admin suggested range for transparent negotiation." });
    }
    setNewCat("");
    setNewCatDesc("");
    setNewCatMin("");
    setNewCatMax("");
    toast.success("Category and price guide added");
  }

  function categoryDraft(c: any) {
    return categoryDrafts[c.id] ?? { name: c.name, description: c.description ?? "", price_min: c.price_min ?? "", price_max: c.price_max ?? "", price_note: c.price_note ?? "" };
  }

  function updateCategoryDraft(categoryId: string, field: "name" | "description" | "price_min" | "price_max" | "price_note", value: string) {
    const current = db.categories.find((c) => c.id === categoryId);
    if (!current) return;
    const base = categoryDraft(current);
    setCategoryDrafts((drafts) => ({ ...drafts, [categoryId]: { ...base, [field]: value } }));
  }

  function saveCategory(c: any) {
    store.updateCategory(c.id, categoryDraft(c));
    toast.success("Category updated");
  }

  function deleteCategory(c: any) {
    if (!window.confirm(`Delete ${c.name}? This is only allowed when no artisan/request is using it.`)) return;
    const ok = store.deleteCategory(c.id);
    if (!ok) {
      toast.error("This category is in use, so it cannot be deleted yet.");
      return;
    }
    toast.success("Category deleted");
  }

  function setAccountStatus(userId: string, status: "active" | "suspended" | "banned") {
    store.setUserStatus(userId, status);
    toast.success(status === "active" ? "Account reactivated" : `Account ${status}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">CityTrust Admin Console</h1>
            <p className="text-sm text-muted-foreground">City operations, verification queue, complaints and analytics.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { store.logout("admin"); toast("Admin signed out"); }}>Sign out</Button>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <strong>Restricted access.</strong> This console is designed for authorized CityTrust staff with role-based permissions for verification, complaints and city operations oversight.
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          <Link to="/architecture" className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:border-primary/40 hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Network className="h-5 w-5" /></div>
              <div>
                <div className="font-bold">Solution Architecture</div>
                <p className="mt-1 text-sm text-muted-foreground">View system design, roles, data flow and smart-city trust architecture.</p>
              </div>
            </div>
          </Link>
          <Link to="/api-contracts" className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:border-primary/40 hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><FileCode2 className="h-5 w-5" /></div>
              <div>
                <div className="font-bold">API & Data Contracts</div>
                <p className="mt-1 text-sm text-muted-foreground">Keep technical details inside the restricted admin workspace.</p>
              </div>
            </div>
          </Link>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Users} label="Total users" value={metrics.users} />
          <Metric icon={ShieldCheck} label="Verified artisans" value={`${metrics.verified}/${metrics.artisans}`} accent="success" />
          <Metric icon={Clock} label="Pending verifications" value={metrics.pendingVer} accent="warning" />
          <Metric icon={ClipboardList} label="Open requests" value={metrics.openReq} accent="info" />
          <Metric icon={CheckCircle2} label="Completed jobs" value={metrics.completed} accent="success" />
          <Metric icon={MessageSquareWarning} label="Open complaints" value={metrics.complaints} accent="destructive" />
          <Metric icon={AlertTriangle} label="Emergency requests" value={emergencyCount} accent="destructive" />
          <Metric icon={BarChart3} label="Categories" value={db.categories.length} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AnalyticsCard title="Service demand by category" data={demandByCat} max={maxDemand} />
          <AnalyticsCard title="Service demand by zone" data={demandByZone} max={maxZone} />
          <AnalyticsCard title="Complaint rate by category" data={complaintsByCat} max={maxComplaintCat} variant="destructive" />
          <AnalyticsCard title="Monthly completed jobs" data={monthlyCompleted} max={maxMonthly} variant="success" />
        </section>


        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-destructive">Emergency requests</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {db.requests.filter((r) => r.urgency === "emergency").map((r) => (
                <li key={r.id} className="rounded border border-border bg-background px-3 py-2">
                  <div className="font-medium">{r.issue_description}</div>
                  <div className="text-xs text-muted-foreground">{r.location_zone} · <StatusBadge status={r.status} /></div>
                </li>
              ))}
              {db.requests.filter((r) => r.urgency === "emergency").length === 0 && <li className="text-muted-foreground">No active emergencies.</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top trusted artisans</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[...db.artisans].sort((a, b) => b.trust_score - a.trust_score).slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between rounded border border-border bg-background px-3 py-2">
                  <span>{a.business_name}</span><span className="text-xs text-trust font-semibold">Trust {a.trust_score}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repeat complaints</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[...db.artisans].filter((a) => a.complaint_count >= 2).sort((a, b) => b.complaint_count - a.complaint_count).slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between rounded border border-border bg-background px-3 py-2">
                  <span>{a.business_name}</span><span className="text-xs text-destructive font-semibold">{a.complaint_count} complaints</span>
                </li>
              ))}
              {db.artisans.filter((a) => a.complaint_count >= 2).length === 0 && <li className="text-muted-foreground">No repeat complaint artisans.</li>}
            </ul>
          </div>
        </section>

        {/* Pending verifications */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pending verification</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Business</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Files</th><th className="px-4 py-3">Trust</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {db.artisans.filter((a) => a.verification_status !== "verified").map((a) => {
                  const c = db.categories.find((c) => c.id === a.category_id);
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{a.business_name}</td>
                      <td className="px-4 py-3">{c?.name}</td>
                      <td className="px-4 py-3">{a.location_zone}</td>
                      <td className="px-4 py-3">{a.verification_documents?.length ?? 0}</td>
                      <td className="px-4 py-3">{a.trust_score}</td>
                      <td className="px-4 py-3"><VerificationBadge status={a.verification_status} /></td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button size="sm" onClick={() => setReviewingArtisanId(a.id)}>Review documents</Button>
                        <Button size="sm" variant="outline" onClick={() => { store.setVerification(a.id, "rejected"); toast("Rejected"); }}>Quick reject</Button>
                      </td>
                    </tr>
                  );
                })}
                {db.artisans.filter((a) => a.verification_status !== "verified").length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">All caught up.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Requests */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">All service requests</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Urgency</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {db.requests.map((r) => {
                  const c = db.categories.find((c) => c.id === r.category_id);
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 max-w-xs truncate">{r.issue_description}</td>
                      <td className="px-4 py-3">{c?.name}</td>
                      <td className="px-4 py-3">{r.location_zone}</td>
                      <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Complaints */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Complaints</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Complaint</th><th className="px-4 py-3">Artisan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {db.complaints.map((cp) => {
                  const a = db.artisans.find((a) => a.id === cp.artisan_id);
                  return (
                    <tr key={cp.id} className="border-t border-border">
                      <td className="px-4 py-3 max-w-md">{cp.complaint_text}</td>
                      <td className="px-4 py-3">{a?.business_name}</td>
                      <td className="px-4 py-3 capitalize">{cp.status}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => store.setComplaintStatus(cp.id, "investigating")}>Investigate</Button>
                        <Button size="sm" variant="outline" onClick={() => store.setComplaintStatus(cp.id, "escalated")}>Escalate</Button>
                        <Button size="sm" onClick={() => store.setComplaintStatus(cp.id, "resolved")}>Resolve</Button>
                      </td>
                    </tr>
                  );
                })}
                {db.complaints.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No complaints.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Account controls */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Account control center</h3>
              <p className="text-sm text-muted-foreground">Suspend or ban risky residents/artisans. Suspended and banned artisans disappear from resident discovery and blocked users cannot sign in.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {db.users.filter((u) => u.role !== "admin").map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3"><div className="font-semibold">{u.full_name}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${u.status === "banned" ? "bg-destructive/10 text-destructive" : u.status === "suspended" ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-success"}`}>{u.status ?? "active"}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setAccountStatus(u.id, "active")}>Reactivate</Button>
                        <Button size="sm" variant="outline" onClick={() => setAccountStatus(u.id, "suspended")}>Suspend</Button>
                        <Button size="sm" variant="destructive" onClick={() => setAccountStatus(u.id, "banned")}>Ban</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {db.users.filter((u) => u.role !== "admin").length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No resident or artisan accounts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Categories */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-lg font-semibold">Manage categories & price guide</h3>
            <p className="mt-1 text-sm text-muted-foreground">These suggested ranges appear inside resident/artisan chat so pricing starts from a transparent CityTrust guide.</p>
            <div className="mt-4 space-y-3">
              {db.categories.map((c) => {
                const d = categoryDraft(c);
                return (
                  <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={d.name} onChange={(e) => updateCategoryDraft(c.id, "name", e.target.value)} placeholder="Category name" />
                      <Input value={d.description} onChange={(e) => updateCategoryDraft(c.id, "description", e.target.value)} placeholder="Description" />
                      <Input value={d.price_min} onChange={(e) => updateCategoryDraft(c.id, "price_min", e.target.value)} placeholder="Minimum e.g. ₦5k" />
                      <Input value={d.price_max} onChange={(e) => updateCategoryDraft(c.id, "price_max", e.target.value)} placeholder="Maximum e.g. ₦25k" />
                      <Input className="md:col-span-2" value={d.price_note} onChange={(e) => updateCategoryDraft(c.id, "price_note", e.target.value)} placeholder="Price note shown to users" />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => deleteCategory(c)}>Delete</Button>
                      <Button size="sm" onClick={() => saveCategory(c)}>Save changes</Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl border border-dashed border-border bg-background p-4 md:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]">
              <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category…" />
              <Input value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Description…" />
              <Input value={newCatMin} onChange={(e) => setNewCatMin(e.target.value)} placeholder="Min" />
              <Input value={newCatMax} onChange={(e) => setNewCatMax(e.target.value)} placeholder="Max" />
              <Button onClick={addCategory}>Add</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-lg font-semibold">Recent admin activity</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {db.actions.length === 0 && <li className="text-muted-foreground">No recent actions yet — verify, suspend, ban, reject, or update to log activity.</li>}
              {db.actions.slice(0, 10).map((a) => (
                <li key={a.id} className="rounded border border-border bg-background px-3 py-2">
                  <span className="font-medium capitalize">{a.action_type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground"> · target {a.target_id} · {new Date(a.created_at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <AdminVerificationModal
        artisanId={reviewingArtisanId}
        open={Boolean(reviewingArtisanId)}
        onOpenChange={(open) => { if (!open) setReviewingArtisanId(null); }}
      />
    </div>
  );
}

function AdminLogin({ email, setEmail, password, setPassword, onSubmit }: {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0.006_215),oklch(0.96_0.025_210))]">
      <Header />
      <main className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center px-4 py-10">
        <div className="absolute inset-x-0 top-0 -z-0 h-80 bg-[radial-gradient(circle_at_18%_10%,oklch(0.7_0.13_190/.22),transparent_34%),radial-gradient(circle_at_84%_12%,oklch(0.55_0.14_230/.18),transparent_28%)]" />
        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-border bg-card shadow-[0_40px_130px_-60px_oklch(0.3_0.13_220/.65)] lg:grid-cols-[1fr_0.95fr] ct-animate-scale-in">
          <section className="relative hidden min-h-[640px] overflow-hidden bg-[image:var(--gradient-hero)] p-10 text-primary-foreground lg:block">
            <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute right-12 top-16 h-32 w-32 rounded-full border border-white/25 ct-animate-orbit">
              <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-white/80" />
              <span className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-white/60" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" /> Authorized operations access
                </div>
                <h1 className="mt-6 max-w-md text-4xl font-black tracking-[-0.035em]">CityTrust Admin Console</h1>
                <p className="mt-4 max-w-md text-sm leading-7 opacity-90">Manage provider verification, service requests, complaints, emergency cases, category demand and Redemption City operations insight from one controlled workspace.</p>
              </div>

              <div className="grid gap-4">
                {[
                  { title: "Verification Queue", text: "Approve, reject or review provider verification status." },
                  { title: "Complaint Resolution", text: "Investigate, escalate and resolve request-linked reports." },
                  { title: "City Insight", text: "Understand demand by zone, category and urgency level." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white/15 p-4 backdrop-blur ct-hover-lift">
                    <div className="font-bold">{item.title}</div>
                    <p className="mt-1 text-sm opacity-85">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-12 ct-animate-fade-up ct-delay-2">
            <div className="mx-auto max-w-md">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight">Staff sign in</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Access verification, service requests, complaints, analytics and city operations tools.</p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="text-sm font-semibold">Staff email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@citytrust.org" className="mt-2 h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter staff password" onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }} className="mt-2 h-12 rounded-xl" />
                </div>
                <Button onClick={onSubmit} size="lg" className="h-12 w-full rounded-xl shadow-[var(--shadow-glow)]">Sign in to Admin Console</Button>
              </div>

              <div className="mt-7 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                <div className="flex items-center gap-2 font-bold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Role-based operations control</div>
                <p className="mt-1">Staff access is structured for verification decisions, complaint handling, service oversight and city analytics.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: string }) {
  const color =
    accent === "success" ? "text-success bg-success/10" :
    accent === "warning" ? "text-warning-foreground bg-warning/15" :
    accent === "info" ? "text-info bg-info/10" :
    accent === "destructive" ? "text-destructive bg-destructive/10" :
    "text-primary bg-primary/10";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, data, max, variant = "primary" }: { title: string; data: { name: string; count: number }[]; max: number; variant?: "primary" | "destructive" | "success" }) {
  const bar =
    variant === "destructive" ? "bg-destructive/80" :
    variant === "success" ? "bg-success/80" :
    "bg-[image:var(--gradient-hero)]";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <div key={d.name}>
            <div className="flex justify-between text-sm"><span>{d.name}</span><span className="text-muted-foreground">{d.count}</span></div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${(d.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
      </div>
    </div>
  );
}
