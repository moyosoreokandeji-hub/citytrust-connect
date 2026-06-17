import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ArtisanCard } from "@/components/ArtisanCard";
import { StatusBadge, UrgencyBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rankArtisans, store, useDB, ZONES_LIST, type Urgency } from "@/lib/store";
import { toast } from "sonner";
import { ClipboardList, Search } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Find Artisans — CityTrust" }] }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB();
  const [q, setQ] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("citytrust:landing-search") ?? "";
  });
  const [cat, setCat] = useState<string>("all");
  const [zone, setZone] = useState<string>("all");
  const [onlyVerified, setOnlyVerified] = useState(false);

  // request form state
  const [rCat, setRCat] = useState(db.categories[0]?.id ?? "");
  const [rZone, setRZone] = useState(ZONES_LIST[0]);
  const [rUrg, setRUrg] = useState<Urgency>("medium");
  const [rDesc, setRDesc] = useState("");
  const [rTime, setRTime] = useState("Today");
  const [matchResult, setMatchResult] = useState<{ id: string; score: number; reasons: string[] } | null>(null);

  const filtered = useMemo(() => {
    return db.artisans.filter((a) => {
      if (cat !== "all" && a.category_id !== cat) return false;
      if (zone !== "all" && a.location_zone !== zone) return false;
      if (onlyVerified && a.verification_status !== "verified") return false;
      if (q && !(`${a.business_name} ${a.bio}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [db, q, cat, zone, onlyVerified]);

  const myRequests = db.requests.filter((r) => r.user_id === db.currentUserId);

  function runMatch() {
    if (!rDesc.trim()) { toast.error("Describe the issue first."); return; }
    const ranked = rankArtisans(db, { category_id: rCat, location_zone: rZone });
    const top = ranked[0];
    if (!top) return;
    setMatchResult({ id: top.artisan.id, score: top.score, reasons: top.reasons });
    toast.success("Best verified artisan selected");
  }

  function submitRequest() {
    if (!rDesc.trim()) { toast.error("Describe the issue first."); return; }
    const req = store.createRequest({
      user_id: db.currentUserId,
      category_id: rCat,
      issue_description: rDesc,
      urgency: rUrg,
      location_zone: rZone,
      preferred_time: rTime,
      artisan_id: matchResult?.id ?? null,
    });
    toast.success("Service request created");
    setRDesc("");
    setMatchResult(null);
    return req;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Resident Dashboard</h1>
          <p className="text-sm text-muted-foreground">Search verified artisans, create a request, and track your jobs.</p>
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elegant)]">
          <div className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Search artisans…" value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-2" />
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {db.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All zones</SelectItem>
                {ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={onlyVerified ? "default" : "outline"} onClick={() => setOnlyVerified((v) => !v)}>
              {onlyVerified ? "Verified only ✓" : "Verified only"}
            </Button>
          </div>
        </section>

        {/* Artisan grid */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Available artisans <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <ArtisanCard key={a.id} artisan={a} category={db.categories.find((c) => c.id === a.category_id)} />
            ))}
            {filtered.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No artisans match those filters.</div>}
          </div>
        </section>

        {/* Service request form */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)] lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Create a service request</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={rCat} onValueChange={setRCat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {db.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location zone</Label>
                <Select value={rZone} onValueChange={setRZone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Urgency</Label>
                <Select value={rUrg} onValueChange={(v) => setRUrg(v as Urgency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low", "medium", "high", "emergency"] as Urgency[]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred time</Label>
                <Input value={rTime} onChange={(e) => setRTime(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Describe the issue</Label>
                <Textarea rows={3} value={rDesc} onChange={(e) => setRDesc(e.target.value)} placeholder="e.g. Kitchen tap leaking under the sink…" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runMatch} variant="outline"><Search className="mr-1 h-4 w-4" /> Find Best Match</Button>
              <Button onClick={submitRequest}>Submit request</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-[image:var(--gradient-card)] p-5 shadow-[var(--shadow-elegant)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Best Match Result</h3>
            {matchResult ? (() => {
              const a = db.artisans.find((x) => x.id === matchResult.id)!;
              const c = db.categories.find((c) => c.id === a.category_id);
              return (
                <div className="mt-3">
                  <ArtisanCard artisan={a} category={c} score={matchResult.score} reasons={matchResult.reasons} />
                </div>
              );
            })() : (
              <p className="mt-3 text-sm text-muted-foreground">Fill the form and click "Find Best Match" to see the best artisan for your request, scored on verification, category, zone, availability, rating and trust.</p>
            )}
          </div>
        </section>

        {/* My requests */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">My requests</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Artisan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => {
                  const a = db.artisans.find((x) => x.id === r.artisan_id);
                  const c = db.categories.find((c) => c.id === r.category_id);
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 max-w-xs truncate">{r.issue_description}</td>
                      <td className="px-4 py-3">{c?.name}</td>
                      <td className="px-4 py-3">{r.location_zone}</td>
                      <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                      <td className="px-4 py-3">{a ? a.business_name : <span className="text-muted-foreground">Unassigned</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline"><Link to="/request/$id" params={{ id: r.id }}>Open</Link></Button>
                      </td>
                    </tr>
                  );
                })}
                {myRequests.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
