import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Flame, Wrench, Search, MessageSquare, AlertTriangle, ListChecks,
  MapPin, Star, BookmarkCheck, Image as ImageIcon, ShieldCheck, Send,
  ClipboardList, Camera, ChevronRight, Activity, CheckCircle2, Mail, Phone,
  User as UserIcon, LogOut, Home, CalendarDays, Settings, Menu,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, UrgencyBadge, VerificationBadge, TrustBadge } from "@/components/Badges";
import { ResidentVerificationCard, ResidentTrustBadge } from "@/components/ResidentVerificationCard";
import { ArtisanCard } from "@/components/ArtisanCard";
import { MessageCenterDialog } from "@/components/MessageCenterDialog";
import { ChatModal } from "@/components/ChatModal";
import {
  isUserActive, rankArtisans, store, useDB, ZONES_LIST,
  type Urgency, type ServiceRequest,
} from "@/lib/store";
import { artisanAvatar, categoryImage, RESIDENT_DASHBOARD_BG } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";

export const Route = createFileRoute("/resident")({
  head: () => ({
    meta: [
      { title: "Resident Dashboard — CityTrust Redemption City" },
      { name: "description", content: "Trusted verified artisans for Redemption City residents, churches, hostels, businesses and facility managers — request, message, track and review jobs." },
    ],
  }),
  component: ResidentDashboard,
});

type ResidentSection = "dashboard" | "requests" | "book" | "complaints" | "saved" | "profile";

function ResidentDashboard() {
  const db = useDB();
  const residentUserId = db.authSessions?.residentUserId ?? null;

  useEffect(() => {
    if (!residentUserId && typeof window !== "undefined") window.location.replace("/resident-account");
  }, [residentUserId]);

  if (!residentUserId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <h1 className="text-2xl font-bold">Resident sign-in required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please sign in or create a resident account to continue.</p>
            <Button asChild className="mt-6"><Link to="/resident-account">Open Resident Access</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return <ResidentDashboardContent residentUserId={residentUserId} />;
}

function ResidentDashboardContent({ residentUserId }: { residentUserId: string }) {
  const db = useDB();
  const me = db.users.find((u) => u.id === residentUserId)!;
  const [section, setSection] = useState<ResidentSection>("dashboard");
  const [messagesOpen, setMessagesOpen] = useState(false);

  const myRequests = db.requests.filter((r) => r.user_id === residentUserId);
  const activeRequests = myRequests.filter((r) => !["completed", "reviewed", "disputed"].includes(r.status));
  const completedRequests = myRequests.filter((r) => r.status === "completed" || r.status === "reviewed");
  const openComplaints = db.complaints.filter((c) => c.user_id === residentUserId && c.status !== "resolved");
  const saved = db.artisans.filter((a) => db.savedArtisanIds.includes(a.id) && isUserActive(db.users.find((u: any) => u.id === a.user_id)));
  const messageCount = db.messages.filter((m) => m.resident_id === residentUserId).length;

  const [rCat, setRCat] = useState(db.categories[0]?.id ?? "");
  const [rZone, setRZone] = useState(me?.location_zone ?? ZONES_LIST[0]);
  const [rUrg, setRUrg] = useState<Urgency>("medium");
  const [rDesc, setRDesc] = useState("");
  const [rTime, setRTime] = useState("Today");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [match, setMatch] = useState<{ id: string; score: number; reasons: string[] } | null>(null);
  const ranked = useMemo(() => rankArtisans(db, { category_id: rCat, location_zone: rZone, urgency: rUrg }), [db, rCat, rZone, rUrg]);

  const [reviewFor, setReviewFor] = useState<ServiceRequest | null>(null);
  const [complaintFor, setComplaintFor] = useState<ServiceRequest | null>(null);

  function runMatch() {
    if (!rDesc.trim()) { toast.error("Describe the issue first."); return; }
    const top = ranked[0];
    if (!top) { toast.error("No verified artisan found for this request."); return; }
    setMatch({ id: top.artisan.id, score: top.score, reasons: top.reasons });
    toast.success("Best verified artisan selected");
  }

  function submit(emergency = false) {
    if (!rDesc.trim()) { toast.error("Describe the issue first."); return; }
    const urgency: Urgency = emergency ? "emergency" : rUrg;
    const top = match ?? { id: ranked[0]?.artisan.id };
    store.createRequest({ user_id: residentUserId, category_id: rCat, issue_description: rDesc, urgency, location_zone: rZone, preferred_time: rTime, artisan_id: top?.id ?? null });
    setRDesc(""); setHasPhoto(false); setMatch(null); setSection("requests");
    toast.success(emergency ? "Emergency request dispatched" : "Service request created");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 lg:flex-row lg:gap-6 lg:px-6">
        <ResidentPortalSidebar
          residentName={me?.full_name ?? "Resident"}
          activeSection={section}
          activeCount={activeRequests.length}
          complaintCount={openComplaints.length}
          messageCount={messageCount}
          onSelect={setSection}
          onOpenMessages={() => setMessagesOpen(true)}
          onLogout={() => { store.logout("resident"); window.location.replace("/resident-account"); }}
        />
        <ResidentMobileTabs
          activeSection={section}
          activeCount={activeRequests.length}
          complaintCount={openComplaints.length}
          messageCount={messageCount}
          onSelect={setSection}
          onOpenMessages={() => setMessagesOpen(true)}
          onLogout={() => { store.logout("resident"); window.location.replace("/resident-account"); }}
        />
        <main className="w-full min-w-0 flex-1 space-y-5 lg:space-y-6">
          {section === "dashboard" && (
            <ResidentDashboardOverview
              me={me}
              activeRequests={activeRequests}
              completedRequests={completedRequests}
              openComplaints={openComplaints}
              saved={saved}
              onSelect={setSection}
              onOpenMessages={() => setMessagesOpen(true)}
              onEmergency={() => { setSection("book"); setRUrg("emergency"); }}
            />
          )}
          {section === "book" && <BookServicePage db={db} rCat={rCat} setRCat={setRCat} rZone={rZone} setRZone={setRZone} rUrg={rUrg} setRUrg={setRUrg} rTime={rTime} setRTime={setRTime} rDesc={rDesc} setRDesc={setRDesc} hasPhoto={hasPhoto} setHasPhoto={setHasPhoto} match={match} ranked={ranked} runMatch={runMatch} submit={submit} />}
          {section === "requests" && <ResidentRequestsPage db={db} residentUserId={residentUserId} myRequests={myRequests} completedRequests={completedRequests} setReviewFor={setReviewFor} setComplaintFor={setComplaintFor} setMessagesOpen={setMessagesOpen} />}
          {section === "complaints" && <ResidentComplaintsPage db={db} residentUserId={residentUserId} myRequests={myRequests} setComplaintFor={setComplaintFor} />}
          {section === "saved" && <SavedArtisansPage db={db} saved={saved} setMessagesOpen={setMessagesOpen} setSection={setSection} />}
          {section === "profile" && <ResidentProfilePage me={me} />}
        </main>
      </div>

      <MessageCenterDialog role="resident" residentId={residentUserId} open={messagesOpen} onOpenChange={setMessagesOpen} />
      <ReviewDialog request={reviewFor} onClose={() => setReviewFor(null)} />
      <ComplaintDialog request={complaintFor} onClose={() => setComplaintFor(null)} />
    </div>
  );
}

function ResidentDashboardOverview({ me, activeRequests, completedRequests, openComplaints, saved, onSelect, onOpenMessages, onEmergency }: any) {
  const stats = [
    { label: "Active requests", value: activeRequests.length, Icon: Activity },
    { label: "Completed", value: completedRequests.length, Icon: CheckCircle2 },
    { label: "Open complaints", value: openComplaints.length, Icon: AlertTriangle },
    { label: "Saved artisans", value: saved.length, Icon: BookmarkCheck },
  ];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-border bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-[var(--shadow-elegant)] sm:rounded-[1.6rem] sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: `url('${RESIDENT_DASHBOARD_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Resident Dashboard · Redemption City</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Welcome back, {me?.full_name?.split(" ")[0] ?? "Resident"}</h1>
            <p className="mt-1 max-w-xl text-sm opacity-90">Trusted access to verified plumbers, electricians, cleaners, carpenters, AC techs and facility maintenance — accountable, tracked and city-supported.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" /> {me?.location_zone}</span><ResidentTrustBadge trust={me?.resident_trust ?? "basic"} /></div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto xl:grid-cols-4">
            {stats.map((s) => <div key={s.label} className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"><div className="flex items-center justify-between"><div className="text-2xl font-bold leading-none">{s.value}</div><s.Icon className="h-4 w-4 opacity-80" /></div><div className="mt-1.5 text-[11px] uppercase tracking-wide opacity-80">{s.label}</div></div>)}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Quick actions</h2><span className="text-xs text-muted-foreground">Choose a task to continue</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { Icon: Wrench, label: "Request a Service", hint: "Create a new job", action: () => onSelect("book") },
            { Icon: Search, label: "Find Verified Artisans", hint: "Browse trusted pros", to: "/dashboard" as const },
            { Icon: Flame, label: "Emergency Request", hint: "Urgent dispatch", action: onEmergency, danger: true },
            { Icon: ListChecks, label: "View My Requests", hint: "Track all jobs", action: () => onSelect("requests") },
            { Icon: MessageSquare, label: "Messages", hint: "Chat with artisans", action: onOpenMessages },
            { Icon: AlertTriangle, label: "File a Complaint", hint: "Report an issue", action: () => onSelect("complaints") },
          ].map((q) => {
            const cls = `group flex min-h-[102px] items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] sm:min-h-[112px] ${q.danger ? "border-destructive/30" : "border-border"}`;
            const inner = <><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${q.danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><q.Icon className="h-5 w-5" /></div><div><div className="font-semibold leading-tight">{q.label}</div><div className="mt-1 text-sm text-muted-foreground">{q.hint}</div></div></>;
            if (q.to) return <Link key={q.label} to={q.to} className={cls}>{inner}</Link>;
            return <button key={q.label} type="button" onClick={q.action} className={cls}>{inner}</button>;
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/5 p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-destructive text-destructive-foreground"><Flame className="h-5 w-5" /></div><div><h3 className="font-semibold text-destructive">Emergency Request</h3><p className="mt-0.5 max-w-xl text-sm text-foreground/80">For urgent repairs such as power issues, water leakage, lock problems, or critical facility maintenance.</p></div></div><Button variant="destructive" className="w-full sm:w-auto" onClick={onEmergency}><Flame className="mr-1 h-4 w-4" /> Start emergency request</Button></div>
      </section>
    </div>
  );
}

function BookServicePage({ db, rCat, setRCat, rZone, setRZone, rUrg, setRUrg, rTime, setRTime, rDesc, setRDesc, hasPhoto, setHasPhoto, match, ranked, runMatch, submit }: any) {
  const matchedArtisan = match ? db.artisans.find((a: any) => a.id === match.id) : null;
  const matchedCategory = matchedArtisan ? db.categories.find((c: any) => c.id === matchedArtisan.category_id) : null;
  return (
    <section className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="rounded-[1.35rem] border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:rounded-[1.6rem] sm:p-5 lg:col-span-2">
        <div className="mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Create a service request</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Service category</Label><Select value={rCat} onValueChange={setRCat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{db.categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Location zone</Label><Select value={rZone} onValueChange={setRZone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Urgency</Label><Select value={rUrg} onValueChange={(v) => setRUrg(v as Urgency)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["low", "medium", "high", "emergency"] as Urgency[]).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Preferred date/time</Label><Input value={rTime} onChange={(e) => setRTime(e.target.value)} placeholder="e.g. Today 6pm" /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Issue description</Label><Textarea rows={4} value={rDesc} onChange={(e) => setRDesc(e.target.value)} placeholder="Describe the issue — e.g. Bathroom tap leaking, water pooling under sink." /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Issue photo (optional)</Label><button type="button" onClick={() => setHasPhoto((v: boolean) => !v)} className={`flex w-full items-center gap-3 rounded-lg border border-dashed p-4 text-left text-sm transition ${hasPhoto ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}>{hasPhoto ? <ImageIcon className="h-5 w-5" /> : <Camera className="h-5 w-5" />}{hasPhoto ? "Photo attached — click to remove" : "Attach a photo of the issue to help artisans assess the job."}</button></div>
        </div>
        <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap"><Button variant="outline" onClick={runMatch}><Search className="mr-1 h-4 w-4" /> Find Best Match</Button><Button onClick={() => submit(false)}>Submit request</Button><Button variant="destructive" onClick={() => submit(true)}><Flame className="mr-1 h-4 w-4" /> Dispatch emergency</Button></div>
      </div>
      <aside className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Best Match Recommendation</h2>
        {!matchedArtisan && <p className="mt-3 text-sm text-muted-foreground">Fill the form and tap <b>Find Best Match</b>. CityTrust ranks artisans on verification, category, zone, availability, rating and trust score.</p>}
        {matchedArtisan && <div className="mt-4"><ArtisanCard artisan={matchedArtisan} category={matchedCategory} score={match?.score} reasons={match?.reasons ?? []} /></div>}
      </aside>
    </section>
  );
}

function ResidentRequestsPage({ db, residentUserId, myRequests, completedRequests, setReviewFor, setComplaintFor, setMessagesOpen }: any) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">My service requests</h2><p className="text-sm text-muted-foreground">Track scope, status, timeline, and follow-up actions.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{myRequests.length} total</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          {myRequests.map((r: ServiceRequest) => {
            const a = db.artisans.find((x: any) => x.id === r.artisan_id);
            const c = db.categories.find((x: any) => x.id === r.category_id);
            return <article key={r.id} className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)]"><SmartImage src={categoryImage(r.category_id)} alt={c?.name ?? "Service"} variant="photo" className="h-36 w-full object-cover" /><div className="p-4"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={r.status} /><UrgencyBadge urgency={r.urgency} /></div><h3 className="mt-3 font-semibold">{r.issue_description}</h3><p className="mt-1 text-sm text-muted-foreground">{c?.name} · {a?.business_name ?? "Unassigned"} · {r.location_zone}</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to="/request/$id" params={{ id: r.id }}>View Timeline</Link></Button><Button size="sm" variant="outline" onClick={() => setMessagesOpen(true)}><MessageSquare className="mr-1 h-4 w-4" /> Message</Button>{r.status === "completed" && <Button size="sm" onClick={() => setReviewFor(r)}>Review</Button>}<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setComplaintFor(r)}>File Complaint</Button></div></div></article>;
          })}
          {myRequests.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground md:col-span-2">No requests yet. Book a service to start.</div>}
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Completed services & reviews</h2><span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"><ShieldCheck className="h-3 w-3" /> Only completed CityTrust jobs can receive verified reviews.</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          {completedRequests.map((r: ServiceRequest) => {
            const a = db.artisans.find((x: any) => x.id === r.artisan_id);
            const rv = db.reviews.find((x: any) => x.request_id === r.id && x.user_id === residentUserId);
            return <div key={r.id} className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{a?.business_name ?? "Artisan"}</div><p className="text-sm text-muted-foreground">{r.issue_description}</p></div><StatusBadge status={r.status} /></div>{rv ? <div className="mt-3 rounded-lg bg-success/5 p-3 text-sm"><div className="font-semibold text-success">Verified Job Review · {rv.rating}★</div><p className="mt-1">{rv.comment}</p></div> : <Button size="sm" className="mt-3" onClick={() => setReviewFor(r)}>Leave review</Button>}</div>;
          })}
          {completedRequests.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:col-span-2">Completed jobs will appear here.</div>}
        </div>
      </section>
    </div>
  );
}

function ResidentComplaintsPage({ db, residentUserId, myRequests, setComplaintFor }: any) {
  return (
    <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="mb-4"><h2 className="text-xl font-bold">Complaint center</h2><p className="text-sm text-muted-foreground">Report issues and monitor CityTrust accountability follow-up.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><div className="font-semibold">File a complaint</div></div><div className="mt-3 space-y-2">{myRequests.slice(0, 6).map((r: ServiceRequest) => <button key={r.id} onClick={() => setComplaintFor(r)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-destructive/40 hover:bg-destructive/5"><span className="truncate pr-2">{r.issue_description}</span><span className="shrink-0 text-muted-foreground">File →</span></button>)}{myRequests.length === 0 && <div className="text-sm text-muted-foreground">No requests to report.</div>}</div></div>
        <div className="rounded-2xl border border-border bg-background p-4"><div className="font-semibold">My complaints</div><div className="mt-3 space-y-2">{db.complaints.filter((c: any) => c.user_id === residentUserId).map((c: any) => { const a = db.artisans.find((x: any) => x.id === c.artisan_id); return <div key={c.id} className="rounded-lg border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><div className="truncate text-sm font-medium">{a?.business_name ?? "Artisan"}</div><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">{c.status}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.complaint_text}</p></div>; })}{db.complaints.filter((c: any) => c.user_id === residentUserId).length === 0 && <div className="text-sm text-muted-foreground">No complaints filed.</div>}</div></div>
      </div>
    </section>
  );
}

function SavedArtisansPage({ db, saved, setMessagesOpen, setSection }: any) {
  const [chatArtisan, setChatArtisan] = useState<any>(null);

  return (
    <>
    <section className="rounded-[1.6rem] border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Saved artisans</h2>
          <p className="text-sm text-muted-foreground">Quickly message or request trusted providers again.</p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto"><Link to="/dashboard">Browse more</Link></Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {saved.map((a: any) => {
          const cat = db.categories.find((c: any) => c.id === a.category_id);
          const artisanUser = db.users.find((u: any) => u.id === a.user_id);
          const artisanPhone = artisanUser?.phone?.replace(/\s/g, "");
          return (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-[var(--shadow-card)]">
              <div className="flex min-w-0 gap-3">
                <SmartImage
                  src={a.profile_image || artisanAvatar(a.id)}
                  alt={a.business_name}
                  variant="avatar"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-primary/10"
                />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-semibold leading-tight">{a.business_name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{cat?.name} · {a.location_zone}</p>
                  <div className="mt-2 flex flex-wrap gap-2"><VerificationBadge status={a.verification_status} /><TrustBadge score={a.trust_score} /></div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Button size="sm" variant="outline" onClick={() => setChatArtisan(a)} className="w-full justify-center">
                  <MessageSquare className="mr-1 h-4 w-4" /> Message
                </Button>
                {artisanPhone && (
                  <Button asChild size="sm" variant="outline" className="w-full justify-center">
                    <a href={`tel:${artisanPhone}`}><Phone className="mr-1 h-4 w-4" /> Call</a>
                  </Button>
                )}
                <Button size="sm" onClick={() => { setSection("book"); toast("Select service details to request this artisan"); }} className="w-full justify-center">
                  Request
                </Button>
              </div>
            </div>
          );
        })}
        {saved.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground lg:col-span-2 2xl:col-span-3">No saved artisans yet.</div>}
      </div>
    </section>
    {chatArtisan && <ChatModal artisan={chatArtisan} open={Boolean(chatArtisan)} onOpenChange={(open) => { if (!open) setChatArtisan(null); }} />}
    </>
  );
}

function ResidentProfilePage({ me }: any) {
  return (
    <div className="space-y-6">
      <ResidentVerificationCard />
      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resident profile</h2></div><ResidentTrustBadge trust={me?.resident_trust ?? "basic"} /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={me?.full_name ?? ""} /></div><div className="space-y-1.5"><Label>Phone</Label><div className="relative"><Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" defaultValue={me?.phone ?? ""} /></div></div><div className="space-y-1.5"><Label>Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" defaultValue={me?.email ?? ""} /></div></div><div className="space-y-1.5"><Label>Location zone</Label><Select defaultValue={me?.location_zone ?? ZONES_LIST[0]}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select></div></div><p className="mt-3 text-xs text-muted-foreground">Submitted documents remain under review until approved by a CityTrust admin.</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => toast.success("Profile saved")}>Save profile</Button></div></section>
      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-card)]"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Built for Redemption City</h2><div className="mt-3 flex flex-wrap gap-2 text-xs">{["Residents", "Churches", "Hostels", "Facility managers", "Businesses", "Visitors", "City operations"].map((t) => <span key={t} className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{t}</span>)}</div></section>
    </div>
  );
}


function ResidentMobileTabs({ activeSection, activeCount, complaintCount, messageCount, onSelect, onOpenMessages, onLogout }: { activeSection: ResidentSection; activeCount: number; complaintCount: number; messageCount: number; onSelect: (section: ResidentSection) => void; onOpenMessages: () => void; onLogout: () => void }) {
  const items: Array<{ label: string; section?: ResidentSection; Icon: any; badge?: number; action?: () => void }> = [
    { label: "Dashboard", section: "dashboard", Icon: Home },
    { label: "Requests", section: "requests", Icon: ClipboardList, badge: activeCount },
    { label: "Book", section: "book", Icon: CalendarDays },
    { label: "Messages", Icon: MessageSquare, badge: messageCount, action: onOpenMessages },
    { label: "Complaints", section: "complaints", Icon: AlertTriangle, badge: complaintCount },
    { label: "Saved", section: "saved", Icon: BookmarkCheck },
    { label: "Profile", section: "profile", Icon: Settings },
    { label: "Logout", Icon: LogOut, action: onLogout },
  ];

  return (
    <div className="lg:hidden">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"><Menu className="h-4 w-4" /> Resident menu</div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = item.section && item.section === activeSection;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => item.action ? item.action() : item.section && onSelect(item.section)}
              className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/70 text-foreground hover:bg-muted"}`}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
              {typeof item.badge === "number" && item.badge > 0 && <span className="ml-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">{item.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResidentPortalSidebar({ residentName, activeSection, activeCount, complaintCount, messageCount, onSelect, onOpenMessages, onLogout }: { residentName: string; activeSection: ResidentSection; activeCount: number; complaintCount: number; messageCount: number; onSelect: (section: ResidentSection) => void; onOpenMessages: () => void; onLogout: () => void }) {
  const firstName = residentName.split(" ")[0] || "Resident";
  const items: Array<{ label: string; section?: ResidentSection; Icon: any; badge?: number; action?: () => void }> = [
    { label: "Dashboard", section: "dashboard", Icon: Home },
    { label: "My Requests", section: "requests", Icon: ClipboardList, badge: activeCount },
    { label: "Book a Service", section: "book", Icon: CalendarDays },
    { label: "Messages", Icon: MessageSquare, badge: messageCount, action: onOpenMessages },
    { label: "Complaints", section: "complaints", Icon: AlertTriangle, badge: complaintCount },
    { label: "Saved Artisans", section: "saved", Icon: BookmarkCheck },
    { label: "Profile Settings", section: "profile", Icon: Settings },
  ];

  return (
    <aside className="ct-animate-fade-up sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 overflow-hidden rounded-[1.6rem] border border-slate-800/20 bg-slate-950 text-white shadow-[0_24px_80px_rgba(2,8,23,0.22)] lg:block">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.38),transparent_55%)]" />
      <div className="relative flex h-full min-h-0 flex-col p-5">
        <div className="mb-6 shrink-0">
          <div className="text-2xl font-black tracking-tight">CITYTRUST</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-200"><span className="h-px w-8 bg-teal-300" /> Redemption City</div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {items.map((item) => {
            const active = item.section && item.section === activeSection;
            return (
              <button key={item.label} type="button" onClick={() => item.action ? item.action() : item.section && onSelect(item.section)} className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition ${active ? "bg-white/12 text-white shadow-inner" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}>
                <span className="flex items-center gap-3"><item.Icon className="h-4 w-4" />{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-slate-950">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="mt-4 shrink-0 rounded-3xl border border-white/10 bg-white/8 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/20 text-sm font-black text-teal-100">{firstName.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0"><div className="truncate text-sm font-bold">{residentName}</div><div className="text-xs text-slate-300">Resident account</div></div>
          </div>
          <button type="button" onClick={onLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </aside>
  );
}


function ReviewDialog({ request, onClose }: { request: ServiceRequest | null; onClose: () => void }) {
  const db = useDB();
  const a = request ? db.artisans.find((x) => x.id === request.artisan_id) : null;
  const [rating, setRating] = useState(5);
  const [quality, setQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [comment, setComment] = useState("");

  function submit() {
    if (!request || !a) return;
    if (request.status !== "completed") { toast.error("Only completed jobs can be reviewed."); return; }
    const avg = Math.round(((rating + quality + timeliness + professionalism) / 4) * 10) / 10;
    store.addReview({ request_id: request.id, user_id: request.user_id, artisan_id: a.id, rating: avg, comment });
    toast.success("Verified job review submitted"); setComment(""); onClose();
  }

  return <Dialog open={!!request} onOpenChange={(v) => { if (!v) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Leave a verified review</DialogTitle></DialogHeader>{a && <div className="space-y-3"><div className="flex items-center gap-2 rounded-lg bg-success/5 p-2.5 text-xs text-success"><ShieldCheck className="h-4 w-4" /> Verified Job Review · this review will be tagged as completed via CityTrust.</div><div className="text-sm text-muted-foreground">For {a.business_name}</div>{[{ label: "Overall rating", value: rating, set: setRating }, { label: "Service quality", value: quality, set: setQuality }, { label: "Timeliness", value: timeliness, set: setTimeliness }, { label: "Professionalism", value: professionalism, set: setProfessionalism }].map((r) => <div key={r.label}><div className="mb-1 flex items-center justify-between text-xs"><span>{r.label}</span><span className="font-semibold">{r.value}★</span></div><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => r.set(n)} className={n <= r.value ? "text-warning" : "text-muted-foreground"}><Star className={`h-5 w-5 ${n <= r.value ? "fill-current" : ""}`} /></button>)}</div></div>)}<div className="space-y-1.5"><Label>Comment</Label><Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details that help other residents." /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}><Send className="mr-1 h-4 w-4" /> Submit review</Button></div></div>}</DialogContent></Dialog>;
}

function ComplaintDialog({ request, onClose }: { request: ServiceRequest | null; onClose: () => void }) {
  const db = useDB();
  const a = request ? db.artisans.find((x) => x.id === request.artisan_id) : null;
  const [reason, setReason] = useState("Service quality");
  const [text, setText] = useState("");

  function submit() {
    if (!request || !a) { toast.error("No artisan assigned to this request."); return; }
    store.addComplaint({ request_id: request.id, user_id: request.user_id, artisan_id: a.id, complaint_text: `[${reason}] ${text}` });
    toast.success("Complaint filed — CityTrust will investigate."); setText(""); onClose();
  }

  return <Dialog open={!!request} onOpenChange={(v) => { if (!v) onClose(); }}><DialogContent><DialogHeader><DialogTitle>File a complaint</DialogTitle></DialogHeader><div className="space-y-3"><div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs"><div className="font-medium">{a?.business_name ?? "Artisan"}</div><div className="text-muted-foreground line-clamp-2">{request?.issue_description}</div></div><div className="space-y-1.5"><Label>Reason</Label><Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Service quality", "Pricing dispute", "No-show / lateness", "Unprofessional conduct", "Damage caused", "Other"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe what went wrong so CityTrust can investigate." /></div><div className="rounded-lg bg-info/10 p-2.5 text-[11px] text-info">Complaint tracking statuses: Open · Investigating · Resolved · Escalated.</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" onClick={submit}>Submit complaint</Button></div></div></DialogContent></Dialog>;
}

export const _icons = { ClipboardList };
