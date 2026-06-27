import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { useDB, store, ZONES_LIST, type ServiceRequest } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, UrgencyBadge, VerificationBadge, TrustBadge } from "@/components/Badges";
import { VerificationProgressCard } from "@/components/VerificationProgressCard";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { MessageCenterDialog } from "@/components/MessageCenterDialog";
import { SmartImage } from "@/components/SmartImage";
import { categoryImage, portfolioImages } from "@/lib/images";
import { toast } from "sonner";
import {
  BriefcaseBusiness, CheckCircle2, ClipboardList, Gauge, Home, LogOut,
  MessageSquare, Settings, ShieldCheck, Star, UserRound, WalletCards,
  Clock, MapPin, BadgeCheck, Wrench, Image as ImageIcon, Menu,
} from "lucide-react";

export const Route = createFileRoute("/artisan/")({
  head: () => ({ meta: [{ title: "Artisan Portal — CityTrust" }] }),
  component: ArtisanPortal,
});

type ArtisanSection = "dashboard" | "requests" | "active" | "verification" | "profile" | "portfolio" | "settings";

function resizeProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Could not prepare image preview."));
      img.onload = () => {
        const maxSize = 520;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not resize image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function ArtisanPortal() {
  const db = useDB();
  const artisanUserId = db.authSessions?.artisanUserId ?? null;

  useEffect(() => {
    if (!artisanUserId && typeof window !== "undefined") {
      window.location.replace("/artisan-account");
    }
  }, [artisanUserId]);

  if (!artisanUserId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <h1 className="text-2xl font-bold">Artisan sign-in required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please sign in or create an artisan account to continue.</p>
            <Button asChild className="mt-6"><Link to="/artisan-account">Open Artisan Access</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return <ArtisanPortalContent artisanUserId={artisanUserId} />;
}

function ArtisanPortalContent({ artisanUserId }: { artisanUserId: string }) {
  const db = useDB();
  const currentArtisanUser = db.users.find((u) => u.id === artisanUserId && u.role === "artisan");
  const [section, setSection] = useState<ArtisanSection>("dashboard");
  const [messagesOpen, setMessagesOpen] = useState(false);

  useEffect(() => {
    store.ensureArtisanDirectory();
  }, []);

  const me = db.artisans.find((a) => a.user_id === artisanUserId) ?? null;
  const myJobs = useMemo(() => me ? db.requests.filter((r) => r.artisan_id === me.id) : [], [db.requests, me?.id]);
  const pending = myJobs.filter((r) => ["matched", "pending"].includes(r.status));
  const active = myJobs.filter((r) => ["accepted", "on_the_way", "in_progress"].includes(r.status));
  const done = myJobs.filter((r) => ["completed", "reviewed", "disputed"].includes(r.status));
  const conversations = db.messages.filter((m) => me && m.artisan_id === me.id).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 sm:px-4 lg:flex-row lg:gap-6 lg:px-6">
        <ArtisanPortalSidebar
          artisanName={me?.business_name ?? "Artisan"}
          activeSection={section}
          pendingCount={pending.length}
          activeCount={active.length}
          messageCount={conversations}
          onSelect={setSection}
          onOpenMessages={() => setMessagesOpen(true)}
          onLogout={() => { store.logout("artisan"); window.location.replace("/artisan-account"); }}
        />
        <ArtisanMobileTabs
          activeSection={section}
          pendingCount={pending.length}
          activeCount={active.length}
          messageCount={conversations}
          onSelect={setSection}
          onOpenMessages={() => setMessagesOpen(true)}
        />
        <main className="w-full min-w-0 flex-1 space-y-5 lg:space-y-6">
          <div className="flex flex-col gap-4 rounded-[1.35rem] border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:rounded-[1.6rem] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CityTrust artisan workspace</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{sectionTitle(section)}</h1>
              <p className="text-sm text-muted-foreground">Manage jobs, verification, resident messages, and service reputation from one portal.</p>
            </div>
            <div className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm shadow-sm sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Signed in artisan</span>
              <span className="font-bold text-foreground">{me?.business_name ?? currentArtisanUser?.full_name ?? "Artisan Workspace"}</span>
              <span className="text-xs text-muted-foreground">{currentArtisanUser?.email ?? "Professional provider account"}</span>
            </div>
          </div>

          {!me && (
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
              <h2 className="text-xl font-bold">Complete artisan onboarding</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create your artisan profile to start receiving requests.</p>
              <div className="mt-5"><OnboardingWizard onSubmitted={() => store.ensureArtisanDirectory()} /></div>
            </div>
          )}

          {me && section === "dashboard" && <ArtisanDashboardOverview me={me} pending={pending} active={active} done={done} db={db} onOpenMessages={() => setMessagesOpen(true)} onSelect={setSection} />}
          {me && section === "requests" && <ArtisanRequestsPage title="Service requests" description="Accept or decline new resident requests assigned to your profile." jobs={pending} db={db} />}
          {me && section === "active" && <ArtisanRequestsPage title="Active jobs" description="Update jobs as work starts, progresses, and completes." jobs={[...active, ...done]} db={db} />}
          {me && section === "verification" && <VerificationPage me={me} onSubmitted={() => store.ensureArtisanDirectory()} />}
          {me && section === "profile" && (
  <ArtisanProfilePage
    me={me}
    db={db}
    onSelect={setSection}
  />
)}
          {me && section === "portfolio" && <ArtisanPortfolioPage me={me} db={db} />}
          {me && section === "settings" && <ArtisanSettingsPage me={me} db={db} onLogout={() => { store.logout("artisan"); window.location.replace("/artisan-account"); }} />}
        </main>
      </div>
      {me && <MessageCenterDialog role="artisan" artisanId={me.id} open={messagesOpen} onOpenChange={setMessagesOpen} />}
    </div>
  );
}


function ArtisanMobileTabs({ activeSection, pendingCount, activeCount, messageCount, onSelect, onOpenMessages }: { activeSection: ArtisanSection; pendingCount: number; activeCount: number; messageCount: number; onSelect: (section: ArtisanSection) => void; onOpenMessages: () => void }) {
  const items: Array<{ label: string; section?: ArtisanSection; Icon: any; badge?: number; action?: () => void }> = [
    { label: "Dashboard", section: "dashboard", Icon: Home },
    { label: "Requests", section: "requests", Icon: ClipboardList, badge: pendingCount },
    { label: "Active", section: "active", Icon: BriefcaseBusiness, badge: activeCount },
    { label: "Verification", section: "verification", Icon: ShieldCheck },
    { label: "Messages", Icon: MessageSquare, badge: messageCount, action: onOpenMessages },
    { label: "Profile", section: "profile", Icon: UserRound },
    { label: "Portfolio", section: "portfolio", Icon: WalletCards },
    { label: "Settings", section: "settings", Icon: Settings },
  ];

  return (
    <div className="lg:hidden">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"><Menu className="h-4 w-4" /> Artisan menu</div>
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

function sectionTitle(section: ArtisanSection) {
  return {
    dashboard: "Dashboard",
    requests: "Service Requests",
    active: "Active Jobs",
    verification: "Verification Center",
    profile: "Profile",
    portfolio: "Portfolio",
    settings: "Settings",
  }[section];
}

function ArtisanDashboardOverview({ me, pending, active, done, db, onOpenMessages, onSelect }: any) {
  const category = db.categories.find((c: any) => c.id === me.category_id);
  const stats = [
    { label: "Pending requests", value: pending.length, Icon: ClipboardList },
    { label: "Active jobs", value: active.length, Icon: BriefcaseBusiness },
    { label: "Completed", value: done.length, Icon: CheckCircle2 },
    { label: "Trust score", value: me.trust_score, Icon: ShieldCheck },
  ];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.35rem] border border-border bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-[var(--shadow-elegant)] sm:rounded-[1.6rem] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">{category?.name} · {me.location_zone}</div>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">{me.business_name}</h2>
            <p className="mt-1 max-w-2xl text-sm opacity-90">Track incoming requests, verify your profile, message residents, and build trust across Redemption City.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.verification_status === "verified" ? (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-emerald-700">
    <BadgeCheck className="h-3.5 w-3.5" />
    Verified
  </span>
) : (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-700">
    Verification Required
  </span>
)}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm ring-1 ring-white/25"><ShieldCheck className="h-3.5 w-3.5 text-teal-200" /> Trust {me.trust_score}</span>
            </div>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onOpenMessages}><MessageSquare className="mr-2 h-4 w-4" /> Open Messages</Button>
        </div>
      </section>

      <div className="ct-animate-fade-up ct-delay-1 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div className="text-2xl font-bold">{s.value}</div><s.Icon className="h-5 w-5 text-primary" /></div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div></div>)}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <button onClick={() => onSelect("requests")} className="rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40">
          <ClipboardList className="mb-3 h-5 w-5 text-primary" /><h3 className="font-semibold">Review new requests</h3><p className="mt-1 text-sm text-muted-foreground">Accept or decline resident service requests.</p>
        </button>
        <button onClick={() => onSelect("active")} className="rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40">
          <BriefcaseBusiness className="mb-3 h-5 w-5 text-primary" /><h3 className="font-semibold">Update active jobs</h3><p className="mt-1 text-sm text-muted-foreground">Move accepted jobs through the work timeline.</p>
        </button>
        <button onClick={() => onSelect("verification")} className="rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40">
          <ShieldCheck className="mb-3 h-5 w-5 text-primary" /><h3 className="font-semibold">Complete verification</h3><p className="mt-1 text-sm text-muted-foreground">Keep your CityTrust profile ready for more matches.</p>
        </button>
      </section>
    </div>
  );
}

function ArtisanRequestsPage({ title, description, jobs, db }: { title: string; description: string; jobs: ServiceRequest[]; db: any }) {
  return (
    <section className="rounded-[1.35rem] border border-border bg-card p-4 shadow-[var(--shadow-elegant)] sm:rounded-[1.6rem] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{jobs.length} total</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((r) => <ArtisanJobCard key={r.id} request={r} db={db} />)}
        {jobs.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">Nothing here yet.</div>}
      </div>
    </section>
  );
}

function ArtisanJobCard({ request, db }: { request: ServiceRequest; db: any }) {
  const c = db.categories.find((cat: any) => cat.id === request.category_id);
  const resident = db.users.find((u: any) => u.id === request.user_id);
  const isPending = ["matched", "pending"].includes(request.status);
  const isActive = ["accepted", "on_the_way", "in_progress"].includes(request.status);
  const artisan =
  db.artisans.find((a: any) => a.id === request.artisan_id);

const acceptedJobs =
  db.requests.filter(
    (r: any) =>
      r.artisan_id === request.artisan_id &&
      ["accepted", "on_the_way", "in_progress", "completed", "reviewed", "disputed"].includes(r.status)
  );
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)]">
      <SmartImage src={categoryImage(request.category_id)} alt={c?.name ?? "Service request"} variant="photo" className="h-36 w-full object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{c?.name}</h3><p className="text-xs text-muted-foreground">{resident?.full_name ?? "Resident"}</p></div><StatusBadge status={request.status} /></div>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{request.issue_description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><UrgencyBadge urgency={request.urgency} /><span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"><MapPin className="h-3 w-3" />{request.location_zone}</span><span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"><Clock className="h-3 w-3" />{request.preferred_time}</span></div>
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
          {isPending && <><Button
  size="sm"
  onClick={() => {
    if (
      artisan?.verification_status !== "verified" &&
      acceptedJobs.length >= 1
    ) {
      toast.error(
        "Verification required. Unverified artisans can only accept one customer request."
      );
      return;
    }

    store.updateRequestStatus(request.id, "accepted");
    toast.success("Job accepted");
  }}
>
  Accept
</Button><Button size="sm" variant="outline" onClick={() => toast("Request left pending")}>Decline</Button></>}
          {isActive && (request.status === "accepted" ? <Button size="sm" onClick={() => { store.updateRequestStatus(request.id, "in_progress"); toast.success("Marked in progress"); }}>Start work</Button> : <Button size="sm" onClick={() => { store.updateRequestStatus(request.id, "completed"); toast.success("Marked completed"); }}>Complete</Button>)}
          <Button asChild size="sm" variant="outline"><Link to="/request/$id" params={{ id: request.id }}>View timeline</Link></Button>
        </div>
      </div>
    </article>
  );
}

function VerificationPage({ me, onSubmitted }: any) {
  return (
    <div className="space-y-5">
      <VerificationProgressCard artisan={me} />
      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <div className="mb-3"><h2 className="text-xl font-bold">Verification onboarding</h2><p className="text-sm text-muted-foreground">Complete or update your verification details for CityTrust admin review.</p></div>
        <OnboardingWizard onSubmitted={onSubmitted} />
      </section>
    </div>
  );
}

function ArtisanProfilePage({ me, db, onSelect }: any) {
  const category = db.categories.find((c: any) => c.id === me.category_id);
  return (
    <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
  onClick={() => onSelect("settings")}
>
  Edit Profile
</Button>
          <div className="text-sm text-muted-foreground">Public service profile</div>
          <SmartImage
            src={me.profile_image || categoryImage(me.category_id)}
            alt={me.business_name}
            variant="avatar"
            className="mb-4 h-32 w-32 rounded-full border object-cover"
          />
          
          <h2 className="text-2xl font-bold">{me.business_name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{category?.name} · {me.location_zone} · {me.experience_years} years experience</p>
          <p className="mt-4 max-w-2xl text-sm">{me.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2"><VerificationBadge status={me.verification_status} /><TrustBadge score={me.trust_score} /><span className="rounded-full bg-muted px-2 py-0.5 text-xs">Rating {me.rating.toFixed(1)}</span><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{me.price_range}</span></div>{me.verification_status !== "verified" && (
  <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
    <h3 className="font-semibold text-amber-900">
      Verification Required
    </h3>

    <p className="mt-2 text-sm text-amber-800">
      Unverified artisans can receive only one customer request.
      Complete verification to unlock unlimited customer access,
      improve trust score visibility and receive more service matches.
    </p>

    <button
      onClick={() => onSelect("verification")}
      className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
    >
      Complete Verification
    </button>
  </div>
)}
        </div>
        <Button asChild variant="outline"><Link to="/artisan/$id" params={{ id: me.id }}>View public page</Link></Button>
      </div>
    </section>
  );
}

function ArtisanPortfolioPage({ me, db }: any) {
  const category = db.categories.find((c: any) => c.id === me.category_id);
  const [samples, setSamples] = useState(() =>
    portfolioImages(me.category_id).map((src, index) => ({
      id: `${me.id}-sample-${index + 1}`,
      src,
      title: `${category?.name ?? "Service"} sample work ${index + 1}`,
      category: category?.name ?? "Service",
      featured: index === 0,
    })),
  );

  function updateSample(id: string, field: "title" | "category", value: string) {
    setSamples((current) => current.map((sample) => (sample.id === id ? { ...sample, [field]: value } : sample)));
  }

  function setFeatured(id: string) {
    setSamples((current) => current.map((sample) => ({ ...sample, featured: sample.id === id })));
    toast.success("Featured work sample updated");
  }

  function addSample() {
    setSamples((current) => [
      ...current,
      {
        id: `${me.id}-sample-${Date.now()}`,
        src: categoryImage(me.category_id),
        title: `${category?.name ?? "Service"} sample work ${current.length + 1}`,
        category: category?.name ?? "Service",
        featured: false,
      },
    ]);
  }

  return (
    <section className="ct-animate-fade-up rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Portfolio & work samples</h2>
          <p className="text-sm text-muted-foreground">Edit the sample work residents see before requesting your service.</p>
        </div>
        <Button type="button" variant="outline" onClick={addSample}><ImageIcon className="mr-2 h-4 w-4" /> Add sample</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {samples.map((sample, index) => (
          <div key={sample.id} className="ct-hover-lift overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)]">
            <div className="relative">
              <SmartImage src={sample.src} alt={sample.title} variant="photo" className="h-44 w-full object-cover" />
              {sample.featured && <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Featured</span>}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sample title</Label>
                <Input value={sample.title} onChange={(event) => updateSample(sample.id, "title", event.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category label</Label>
                <Input value={sample.category} onChange={(event) => updateSample(sample.id, "category", event.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button type="button" size="sm" variant={sample.featured ? "default" : "outline"} onClick={() => setFeatured(sample.id)}>Mark featured</Button>
                <Button type="button" size="sm" variant="ghost" disabled={samples.length <= 1} onClick={() => setSamples((current) => current.filter((item) => item.id !== sample.id))}>Remove</Button>
              </div>
              <p className="text-xs text-muted-foreground">Sample {index + 1} appears on your CityTrust public profile and resident request screens.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArtisanSettingsPage({ me, db, onLogout }: any) {
  const user = db.users.find((u: any) => u.id === me.user_id);
  const [profileImage, setProfileImage] = useState(
  me.profile_image || ""
);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: me.business_name ?? "",
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    category_id: me.category_id ?? "c1",
    location_zone: me.location_zone ?? "Phase 1",
    price_range: me.price_range ?? "",
    availability_status: me.availability_status ?? "available",
    experience_years: String(me.experience_years ?? 1),
    response_time_mins: String(me.response_time_mins ?? 30),
    bio: me.bio ?? "",
    service_zones: me.location_zone ?? "",
    emergency_available: me.response_time_mins <= 25,
    reference_name: me.reference?.name ?? "",
    reference_phone: me.reference?.phone ?? "",
    reference_relationship: me.reference?.relationship ?? "",
    emergency_contact: me.emergency_contact ?? "",
  });

  useEffect(() => {
    setProfileImage(me.profile_image || "");
  }, [me.id, me.profile_image]);

  function update(field: keyof typeof form, value: string | boolean) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveSettings() {
    store.updateUser(me.user_id, {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      location_zone: form.location_zone,
    });
    store.updateArtisan(me.id, {
      business_name: form.business_name,
      category_id: form.category_id,
      profile_image: profileImage,
      location_zone: form.location_zone,
      price_range: form.price_range,
      availability_status: form.availability_status as any,
      experience_years: Number(form.experience_years) || me.experience_years,
      response_time_mins: Number(form.response_time_mins) || me.response_time_mins,
      bio: form.bio,
      reference: {
        name: form.reference_name,
        phone: form.reference_phone,
        relationship: form.reference_relationship,
      },
      emergency_contact: form.emergency_contact,
    });
    setSaved(true);
    toast.success("Artisan settings saved");
    window.setTimeout(() => setSaved(false), 2600);
  }
  


  return (
    <div className="ct-animate-fade-up space-y-5">
      <section className="rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Artisan settings</h2>
            <p className="text-sm text-muted-foreground">Update your public service profile, contact details, availability, and verification contacts.</p>
          </div>
          {saved && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">Saved successfully</span>}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="font-bold">Business profile</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><Label>Business / service name</Label><Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} /></div>
                <div><Label>Owner full name</Label><Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
                <div>
                  <Label>Service category</Label>
                  <Select value={form.category_id} onValueChange={(value) => update("category_id", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{db.categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Main location zone</Label>
                  <Select value={form.location_zone} onValueChange={(value) => update("location_zone", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ZONES_LIST.map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Price range</Label><Input value={form.price_range} onChange={(e) => update("price_range", e.target.value)} /></div>
                <div>
                  <Label>Availability</Label>
                  <Select value={form.availability_status} onValueChange={(value) => update("availability_status", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Years of experience</Label><Input value={form.experience_years} onChange={(e) => update("experience_years", e.target.value)} /></div>
                <div><Label>Average response time (mins)</Label><Input value={form.response_time_mins} onChange={(e) => update("response_time_mins", e.target.value)} /></div>
              </div>
              <div className="mt-4"><Label>Service description</Label><Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} className="min-h-28" /></div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="font-bold">Service coverage</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><Label>Service zones</Label><Input value={form.service_zones} onChange={(e) => update("service_zones", e.target.value)} placeholder="Phase 1, Phase 2, Central" /></div>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3">
                  <span><span className="block text-sm font-semibold">Emergency availability</span><span className="text-xs text-muted-foreground">Show residents you can take urgent jobs.</span></span>
                  <Switch checked={Boolean(form.emergency_available)} onCheckedChange={(checked) => update("emergency_available", checked)} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="font-bold">Profile preview</h3>
              <div className="mt-4 space-y-3">
  {profileImage ? (
    <div className="relative">
      <img
        src={profileImage}
        alt="Profile"
        className="h-40 w-full rounded-xl object-cover"
      />

      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute right-2 top-2"
        onClick={() => { setProfileImage(""); store.updateArtisan(me.id, { profile_image: "" }); setSaved(false); toast("Profile photo removed"); }}
      >
        Delete Photo
      </Button>
    </div>
  ) : (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed">
      No profile photo
    </div>
  )}

  <Input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const imageUrl = await resizeProfileImage(file);
        setProfileImage(imageUrl);
        store.updateArtisan(me.id, { profile_image: imageUrl });
        setSaved(false);
        toast.success("Profile photo saved to your public profile");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not upload profile photo");
      } finally {
        e.currentTarget.value = "";
      }
    }}
  />
</div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                <SmartImage src={profileImage || categoryImage(form.category_id)} alt="Service preview" variant="photo" className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="text-lg font-bold">{form.business_name || me.business_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{db.categories.find((c: any) => c.id === form.category_id)?.name} · {form.location_zone}</div>
                  <div className="mt-3 flex flex-wrap gap-2"><VerificationBadge status={me.verification_status} /><TrustBadge score={me.trust_score} /><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{form.availability_status}</span></div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{form.bio}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="font-bold">Verification contacts</h3>
              <div className="mt-4 space-y-3">
                <div><Label>Reference name</Label><Input value={form.reference_name} onChange={(e) => update("reference_name", e.target.value)} /></div>
                <div><Label>Reference phone</Label><Input value={form.reference_phone} onChange={(e) => update("reference_phone", e.target.value)} /></div>
                <div><Label>Reference relationship</Label><Input value={form.reference_relationship} onChange={(e) => update("reference_relationship", e.target.value)} /></div>
                <div><Label>Emergency contact</Label><Input value={form.emergency_contact} onChange={(e) => update("emergency_contact", e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Changes update the local CityTrust demo data immediately and affect your profile preview.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={saveSettings}>Save changes</Button>
            <Button type="button" variant="outline" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ArtisanPortalSidebar({ artisanName, activeSection, pendingCount, activeCount, messageCount, onSelect, onOpenMessages, onLogout }: { artisanName: string; activeSection: ArtisanSection; pendingCount: number; activeCount: number; messageCount: number; onSelect: (section: ArtisanSection) => void; onOpenMessages: () => void; onLogout: () => void }) {
  const initials = artisanName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "AP";
  const items: Array<{ label: string; section?: ArtisanSection; Icon: any; badge?: number; action?: () => void }> = [
    { label: "Dashboard", section: "dashboard", Icon: Home },
    { label: "Service Requests", section: "requests", Icon: ClipboardList, badge: pendingCount },
    { label: "Active Jobs", section: "active", Icon: BriefcaseBusiness, badge: activeCount },
    { label: "Verification Center", section: "verification", Icon: ShieldCheck },
    { label: "Messages", Icon: MessageSquare, badge: messageCount, action: onOpenMessages },
    { label: "Profile", section: "profile", Icon: UserRound },
    { label: "Portfolio", section: "portfolio", Icon: WalletCards },
    { label: "Settings", section: "settings", Icon: Settings },
  ];

  return (
    <aside className="ct-animate-fade-up sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 overflow-hidden rounded-[1.6rem] border border-slate-800/20 bg-slate-950 text-white shadow-[0_24px_80px_rgba(2,8,23,0.22)] lg:block">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.38),transparent_55%)]" />
      <div className="relative flex h-full min-h-0 flex-col p-5">
        <div className="mb-6 shrink-0">
          <div className="text-2xl font-black tracking-tight">CITYTRUST</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-200"><span className="h-px w-8 bg-teal-300" /> Artisan Portal</div>
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
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400/20 text-sm font-black text-teal-100">{initials}</div>
            <div className="min-w-0"><div className="truncate text-sm font-bold">{artisanName}</div><div className="text-xs text-slate-300">Service provider</div></div>
          </div>
          <button type="button" onClick={onLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    </aside>
  );
}


export const _icons = { Gauge, Star, Wrench, ImageIcon, BadgeCheck };
