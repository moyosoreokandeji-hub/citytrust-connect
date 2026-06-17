import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store, useDB, ZONES_LIST } from "@/lib/store";

type AccountRole = "resident" | "artisan";
type Mode = "signin" | "create";

export function AccountAccess({ role }: { role: AccountRole }) {
  const db = useDB();
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);

  const isResident = role === "resident";
  const target = isResident ? "/resident" : "/artisan";
  const title = isResident ? "Resident Access" : "Artisan Access";
  const subtitle = isResident
    ? "Request trusted services, track jobs, message verified providers, confirm scope and manage complaints from one account."
    : "Manage verification, service requests, client messages, job updates and trust history from one professional portal.";

  const signedInUserId = role === "resident" ? db.authSessions?.residentUserId : db.authSessions?.artisanUserId;
  const signedInUser = signedInUserId ? db.users.find((u) => u.id === signedInUserId) : null;

  useEffect(() => {
    if (signedInUserId && typeof window !== "undefined") {
      window.location.replace(target);
    }
  }, [signedInUserId, target]);

  const [email, setEmail] = useState(isResident ? "amaka@citytrust.io" : "samuel.adeyemi@citytrust.io");
  const [password, setPassword] = useState("citytrust2026");
  const [fullName, setFullName] = useState(isResident ? "Amaka Nwosu" : "Samuel Adeyemi");
  const [phone, setPhone] = useState(isResident ? "+234 800 000 0001" : "+234 800 000 1000");
  const [zone, setZone] = useState("Phase 2");

  const [businessName, setBusinessName] = useState("Adeyemi Plumbing Works");
  const [categoryId, setCategoryId] = useState(db.categories[0]?.id ?? "c1");
  const [experienceYears, setExperienceYears] = useState("8");
  const [priceRange, setPriceRange] = useState("₦5k-₦25k");
  const [bio, setBio] = useState("Trusted service provider serving residents and facilities across Redemption City.");

  function redirectToTarget() {
    if (typeof window !== "undefined") window.location.replace(target);
  }

  function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }
    if (!password.trim()) {
      toast.error("Enter your password.");
      return;
    }
    const user = store.signIn(email, role);
    if (!user) {
      toast.error(`No ${role} account found with that email. Create an account to continue.`);
      setMode("create");
      return;
    }
    toast.success(`${isResident ? "Resident" : "Artisan"} account opened`);
    redirectToTarget();
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Complete your name, email, and phone number.");
      return;
    }

    if (isResident) {
      store.createResident({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), location_zone: zone });
      toast.success("Resident account created");
      redirectToTarget();
      return;
    }

    if (!businessName.trim() || !bio.trim()) {
      toast.error("Add your business name and service description.");
      return;
    }

    const artisan = store.createArtisan({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category_id: categoryId,
      business_name: businessName.trim(),
      bio: bio.trim(),
      experience_years: Number(experienceYears) || 1,
      location_zone: zone,
      price_range: priceRange.trim() || "To be agreed",
      uploads: { identity: true, selfie: true, skill_proof: true, portfolio: true },
      reference: { name: "Reference Contact", phone: "+234 800 000 2000", relationship: "Previous client" },
      emergency_contact: "+234 800 000 3000",
    });
    store.setCurrentUser(artisan.user_id);
    toast.success("Artisan account created and submitted for verification");
    redirectToTarget();
  }

  if (signedInUserId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/10 text-success">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-tight">Opening {isResident ? "Resident Portal" : "Artisan Portal"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{signedInUser?.full_name ? `${signedInUser.full_name} is already signed in.` : "Your account is already signed in."}</p>
            <Button asChild className="mt-6 rounded-xl"><Link to={target as any}>Continue</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  const featureCards = isResident
    ? [
        { Icon: ClipboardList, title: "Request services", text: "Create a job request and get a trusted provider recommendation." },
        { Icon: MessageCircle, title: "Message providers", text: "Keep conversations linked to the exact service request." },
        { Icon: ShieldCheck, title: "Track accountability", text: "Follow scope, timeline, reviews and complaints in one place." },
      ]
    : [
        { Icon: BadgeCheck, title: "Build trust", text: "Submit profile details, skill proof, references and portfolio evidence." },
        { Icon: Wrench, title: "Manage jobs", text: "Accept requests, update status and communicate with residents." },
        { Icon: CheckCircle2, title: "Grow reputation", text: "Completed jobs improve ratings, trust score and visibility." },
      ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0.006_215),oklch(0.965_0.022_205))]">
      <Header />
      <main className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(circle_at_20%_20%,oklch(0.72_0.13_190/.18),transparent_35%),radial-gradient(circle_at_80%_0%,oklch(0.58_0.12_220/.16),transparent_28%)]" />

        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-7 shadow-[0_34px_120px_-60px_oklch(0.3_0.13_220/.55)] backdrop-blur lg:min-h-[680px] lg:p-8 ct-animate-fade-up">
          <div className="absolute inset-x-0 top-0 h-40 bg-[image:var(--gradient-hero)] opacity-90" />
          <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-white/25 ct-animate-orbit">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/80" />
            <span className="absolute bottom-1 left-4 h-2 w-2 rounded-full bg-white/60" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {isResident ? <UserRound className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                {isResident ? "Resident portal" : "Verified provider portal"}
              </div>
              <h1 className="mt-14 max-w-lg text-[clamp(2.4rem,5vw,3.9rem)] font-black leading-[0.98] tracking-[-0.045em] text-white">{title}</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/90 md:text-base">{subtitle}</p>
            </div>

            <div className="mt-10 grid gap-3">
              {featureCards.map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm ct-hover-lift">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground"><LockKeyhole className="h-4 w-4 text-primary" /> Secure role access</div>
              <p className="mt-1">CityTrust keeps resident requests, provider jobs, messages and verification records connected to the right account role.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_34px_120px_-60px_oklch(0.3_0.13_220/.55)] md:p-7 ct-animate-fade-up ct-delay-2">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Create account
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your {isResident ? "resident dashboard" : "artisan workspace"}.</p>
              </div>
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={isResident ? "resident@example.com" : "artisan@example.com"} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" className="h-12 rounded-xl pr-12" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="h-12 w-full rounded-xl shadow-[var(--shadow-glow)]">Sign in <ArrowRight className="ml-1 h-4 w-4" /></Button>
              <div className="text-center text-sm text-muted-foreground">
                New to CityTrust? <button type="button" onClick={() => setMode("create")} className="font-bold text-primary hover:underline">Create an account</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Create {isResident ? "resident" : "artisan"} account</h2>
                <p className="mt-1 text-sm text-muted-foreground">Complete the details below to start using CityTrust.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Phone number</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Location zone</Label>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {!isResident && (
                <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Business / service name</Label>
                    <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Service category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{db.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience years</Label>
                    <Input value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} inputMode="numeric" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price range</Label>
                    <Input value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Service description</Label>
                    <Textarea rows={3} value={bio} onChange={(event) => setBio(event.target.value)} className="rounded-xl" />
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="h-12 w-full rounded-xl shadow-[var(--shadow-glow)]">Create account <ArrowRight className="ml-1 h-4 w-4" /></Button>
              <div className="text-center text-sm text-muted-foreground">
                Already registered? <button type="button" onClick={() => setMode("signin")} className="font-bold text-primary hover:underline">Sign in</button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
