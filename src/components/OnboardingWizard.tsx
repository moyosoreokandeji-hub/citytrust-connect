import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store, useDB, ZONES_LIST, type VerificationChecks } from "@/lib/store";
import { toast } from "sonner";
import { Check, IdCard, Camera, Award, Images, Upload, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";

type Uploads = Partial<Record<keyof VerificationChecks, boolean>>;

interface Form {
  full_name: string; email: string; phone: string; business_name: string; bio: string;
  category_id: string; location_zone: string; experience_years: number; price_range: string;
  availability: "available" | "busy" | "offline";
  ref_name: string; ref_phone: string; ref_rel: string; emergency_contact: string;
}

const STEPS = ["Basic Profile", "Skill & Service", "Verification Documents", "Review & Submit"] as const;

export function OnboardingWizard({ onSubmitted }: { onSubmitted: (userId: string) => void }) {
  const db = useDB();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    full_name: "", email: "", phone: "",
    business_name: "", bio: "",
    category_id: db.categories[0]?.id ?? "",
    location_zone: ZONES_LIST[0],
    experience_years: 1, price_range: "₦5k-₦25k",
    availability: "available",
    ref_name: "", ref_phone: "", ref_rel: "", emergency_contact: "",
  });
  const [uploads, setUploads] = useState<Uploads>({ identity: false, selfie: false, skill_proof: false, portfolio: false });
  const [submitted, setSubmitted] = useState(false);

  function next() {
    if (step === 0 && (!form.full_name || !form.business_name || !form.phone)) {
      toast.error("Please fill name, business and phone"); return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  function submit() {
    const a = store.createArtisan({
      ...form,
      reference: form.ref_name ? { name: form.ref_name, phone: form.ref_phone, relationship: form.ref_rel } : undefined,
      emergency_contact: form.emergency_contact,
      uploads,
    });
    setSubmitted(true);
    toast.success("Application submitted for admin review");
    onSubmitted(a.user_id);
  }

  const cat = db.categories.find((c) => c.id === form.category_id);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step || submitted;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={`text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
            </div>
          );
        })}
      </div>

      <div className="space-y-5 p-5">
        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success"><ShieldCheck className="h-6 w-6" /></div>
            <h3 className="mt-3 text-lg font-semibold">Application submitted</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your verification is now <strong>Under Review</strong>. Submitted documents remain under review until approved by a CityTrust admin.</p>
          </div>
        ) : (
          <>
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Samuel Adeyemi" /></Field>
                <Field label="Business / service name"><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Adeyemi Plumbing Works" /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" /></Field>
                <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
                <Field label="Location zone (Redemption City)">
                  <Select value={form.location_zone} onValueChange={(v) => setForm({ ...form, location_zone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Service category">
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{db.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Years of experience"><Input type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} /></Field>
                <Field label="Price range"><Input value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} placeholder="₦5k-₦25k" /></Field>
                <Field label="Availability">
                  <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v as Form["availability"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Main service zone">
                  <Select value={form.location_zone} onValueChange={(v) => setForm({ ...form, location_zone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Service description"><Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Briefly describe the services you offer to Redemption City residents, churches, hostels and facility managers." /></Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Verification documents are reviewed by a CityTrust admin before approval.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <UploadBox Icon={IdCard} title="Government / National ID" hint="Upload document for admin review." done={!!uploads.identity} onClick={() => setUploads({ ...uploads, identity: !uploads.identity })} />
                  <UploadBox Icon={Camera} title="Selfie / Profile Verification" hint="Upload document for admin review." done={!!uploads.selfie} onClick={() => setUploads({ ...uploads, selfie: !uploads.selfie })} />
                  <UploadBox Icon={Award} title="Skill Proof" hint="Upload document for admin review." done={!!uploads.skill_proof} onClick={() => setUploads({ ...uploads, skill_proof: !uploads.skill_proof })} />
                  <UploadBox Icon={Images} title="Work Portfolio" hint="Add completed work photos to support your profile." done={!!uploads.portfolio} onClick={() => setUploads({ ...uploads, portfolio: !uploads.portfolio })} />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference contact</div>
                  <p className="mb-2 text-xs text-muted-foreground">Add a reference who can confirm your service experience.</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Reference name"><Input value={form.ref_name} onChange={(e) => setForm({ ...form, ref_name: e.target.value })} /></Field>
                    <Field label="Reference phone"><Input value={form.ref_phone} onChange={(e) => setForm({ ...form, ref_phone: e.target.value })} /></Field>
                    <Field label="Relationship"><Input value={form.ref_rel} onChange={(e) => setForm({ ...form, ref_rel: e.target.value })} placeholder="e.g. Previous client" /></Field>
                  </div>
                </div>
                <Field label="Emergency contact"><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Phone number for emergency dispatch" /></Field>
                <p className="text-xs text-muted-foreground">Submitted documents remain under review until approved by an admin.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Review your submission</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryCard title="Basic Profile" rows={[
                    ["Name", form.full_name || "—"], ["Business", form.business_name || "—"],
                    ["Phone", form.phone || "—"], ["Email", form.email || "—"],
                    ["Zone", form.location_zone], ["Category", cat?.name ?? "—"],
                  ]} />
                  <SummaryCard title="Skill & Service" rows={[
                    ["Experience", `${form.experience_years} years`], ["Price range", form.price_range],
                    ["Availability", form.availability], ["Service zone", form.location_zone],
                    ["Description", form.bio || "—"],
                  ]} />
                  <SummaryCard title="Verification Documents" rows={[
                    ["Gov ID", uploads.identity ? "Uploaded" : "Not uploaded"],
                    ["Selfie", uploads.selfie ? "Uploaded" : "Not uploaded"],
                    ["Skill proof", uploads.skill_proof ? "Uploaded" : "Not uploaded"],
                    ["Portfolio", uploads.portfolio ? "Uploaded" : "Not uploaded"],
                  ]} />
                  <SummaryCard title="Reference & Emergency" rows={[
                    ["Reference", form.ref_name ? `${form.ref_name} (${form.ref_rel || "—"})` : "—"],
                    ["Ref phone", form.ref_phone || "—"],
                    ["Emergency contact", form.emergency_contact || "—"],
                  ]} />
                </div>
                <div className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
                  By submitting, your application enters the CityTrust admin verification queue. Status will move from <strong>Submitted</strong> to <strong>Under Review</strong> and finally <strong>Verified</strong>.
                </div>
              </div>
            )}
          </>
        )}

        {!submitted && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" onClick={back} disabled={step === 0}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={submit}><ShieldCheck className="mr-1 h-4 w-4" /> Submit for Admin Review</Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function UploadBox({ Icon, title, hint, done, onClick }: { Icon: any; title: string; hint: string; done: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-start gap-3 rounded-lg border-2 border-dashed p-3 text-left transition ${done ? "border-success bg-success/5" : "border-border bg-background hover:border-primary hover:bg-primary/5"}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}{done && <span className="ml-1 text-xs text-success">· Submitted</span>}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><Upload className="h-3 w-3" /> {done ? "Click to remove" : "Click to upload"}</div>
      </div>
    </button>
  );
}

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <dl className="space-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="max-w-[60%] truncate text-right font-medium capitalize">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
