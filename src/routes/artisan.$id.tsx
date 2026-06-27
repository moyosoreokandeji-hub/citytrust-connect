import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { isUserActive, useDB, store, trustBreakdown } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VerificationBadge, TrustBadge, CheckPill } from "@/components/Badges";
import { ChatModal } from "@/components/ChatModal";
import { TrustScoreModal } from "@/components/TrustScoreModal";
import { MapPin, Star, Briefcase, Phone, Mail, ArrowLeft, Clock, Plus, Minus, ShieldCheck, BadgeCheck, MessageCircle, PencilLine } from "lucide-react";
import { artisanAvatar, portfolioImages } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";

export const Route = createFileRoute("/artisan/$id")({
  component: ArtisanProfilePage,
});

function compactPhone(phone?: string) {
  return phone?.replace(/[^+\d]/g, "") ?? "";
}

function ArtisanProfilePage() {
  const { id } = Route.useParams();
  const db = useDB();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [trustOpen, setTrustOpen] = useState(false);
  const a = db.artisans.find((x) => x.id === id);
  if (!a) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="mx-auto max-w-3xl p-8">Artisan not found. <Link to="/dashboard" className="text-primary underline">Back</Link></div>
    </div>
  );
  const user = db.users.find((u) => u.id === a.user_id);
  const accountActive = isUserActive(user);
  const cat = db.categories.find((c) => c.id === a.category_id);
  const reviews = db.reviews.filter((r) => r.artisan_id === a.id);
  const portfolio = portfolioImages(a.category_id);
  const factors = trustBreakdown(a);
  const isOwnerArtisan = db.authSessions?.artisanUserId === a.user_id;
  if (!accountActive && !isOwnerArtisan) return (
    <div className="min-h-screen bg-background"><Header />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
          <h1 className="text-2xl font-bold">Artisan profile unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">This account has been suspended or banned by CityTrust admin review.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to Find Artisans</Link></Button>
        </div>
      </main>
    </div>
  );
  const residentUserId = db.authSessions?.residentUserId;
  const isResidentSignedIn = Boolean(residentUserId);
  const backTarget = isOwnerArtisan ? "/artisan" : isResidentSignedIn ? "/resident" : "/dashboard";
  const backLabel = isOwnerArtisan ? "Back to artisan workspace" : isResidentSignedIn ? "Back to resident dashboard" : "Back to find artisans";

  function ensureResidentAction() {
    if (!isResidentSignedIn) {
      toast.error("Please sign in as a resident to continue.");
      navigate({ to: "/resident-account" });
      return false;
    }
    return true;
  }

  function openResidentChat() {
    if (!ensureResidentAction()) return;
    setChatOpen(true);
  }

  function requestService() {
    if (!ensureResidentAction()) return;
    const req = store.createRequest({
      user_id: residentUserId!,
      category_id: a!.category_id,
      issue_description: `Direct request to ${a!.business_name}`,
      urgency: "medium",
      location_zone: a!.location_zone,
      preferred_time: "ASAP",
      artisan_id: a!.id,
    });
    navigate({ to: "/request/$id", params: { id: req.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Link to={backTarget as any} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{backLabel}</Link>

        {isOwnerArtisan && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            <div className="font-bold">Public profile preview</div>
            <p className="mt-1 text-primary/80">This is how residents discover your service profile. Resident-only actions like Request Service and Call Artisan are hidden while you are signed in as this artisan.</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="h-32 w-full bg-[image:var(--gradient-hero)]" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <SmartImage src={a.profile_image || artisanAvatar(a.id)} alt={a.business_name} variant="avatar" className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-md" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{a.business_name}</h1>
                    <VerificationBadge status={a.verification_status} />
                    <TrustBadge score={a.trust_score} onClick={() => setTrustOpen(true)} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{cat?.name} · {user?.full_name}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isOwnerArtisan ? (
                  <>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/artisan"><ArrowLeft className="mr-1 h-4 w-4" /> Workspace</Link>
                    </Button>
                    <Button asChild size="lg">
                      <Link to="/artisan"><PencilLine className="mr-1 h-4 w-4" /> Edit in settings</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" variant="outline" onClick={openResidentChat}>
                      <MessageCircle className="mr-1 h-4 w-4" /> Message
                    </Button>
                    {user?.phone && (
                      <Button asChild size="lg" variant="outline">
                        <a href={`tel:${compactPhone(user.phone)}`}><Phone className="mr-1 h-4 w-4" /> Call</a>
                      </Button>
                    )}
                    <Button size="lg" onClick={requestService}>{isResidentSignedIn ? "Request Service" : "Sign in to request"}</Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Stat Icon={MapPin} label="Zone" value={a.location_zone} />
              <Stat Icon={Star} label="Rating" value={`${a.rating.toFixed(1)} (${reviews.length})`} />
              <Stat Icon={Briefcase} label="Jobs · Exp" value={`${a.completed_jobs} · ${a.experience_years}y`} />
              <Stat Icon={Clock} label="Response" value={`~${a.response_time_mins} min`} />
            </div>

            <p className="mt-5 text-sm text-muted-foreground">{a.bio}</p>
            <div className="mt-3 text-sm"><span className="font-medium">Price range:</span> {a.price_range} · <span className="font-medium capitalize">{a.availability_status}</span></div>
            {user && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-success" />
              <h2 className="font-semibold">Verification Center</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">6-step verification process for every CityTrust artisan.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CheckRow label="Identity document" status={a.checks.identity} />
              <CheckRow label="Selfie verification" status={a.checks.selfie} />
              <CheckRow label="Skill proof" status={a.checks.skill_proof} />
              <CheckRow label="Reference check" status={a.checks.reference} />
              <CheckRow label="Work portfolio" status={a.checks.portfolio} />
              <CheckRow label="Admin approval" status={a.checks.admin_approval} />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Final verification badge: </span><VerificationBadge status={a.verification_status} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold">Trust score breakdown</h2>
            <p className="mt-1 text-sm text-muted-foreground">Why this artisan scored <span className="font-semibold text-foreground">{a.trust_score}</span>.</p>
            <ul className="mt-4 space-y-2">
              {factors.map((f) => (
                <li key={f.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {f.positive ? <Plus className="h-4 w-4 text-success" /> : <Minus className="h-4 w-4 text-destructive" />}
                    {f.label}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{f.value.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Work portfolio</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {portfolio.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
                <SmartImage src={src} alt={`${cat?.name ?? "Service"} work sample ${i + 1}`} categoryId={a.category_id} fallbackLabel={`${cat?.name ?? "Service"} sample`} className="flex h-full w-full items-center justify-center object-cover transition hover:scale-105" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <span className="text-xs text-muted-foreground">Only residents with completed service requests can leave verified reviews.</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning" />)}
                  </div>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <BadgeCheck className="h-3 w-3" /> Verified Job Review
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm">{r.comment}</p>
                <div className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          </div>
        </section>
      </main>

      {!isOwnerArtisan && <ChatModal artisan={a} open={chatOpen} onOpenChange={setChatOpen} />}
      <TrustScoreModal artisan={a} open={trustOpen} onOpenChange={setTrustOpen} />
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function CheckRow({ label, status }: { label: string; status: "pending" | "under_review" | "verified" | "rejected" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <CheckPill status={status} />
    </div>
  );
}
