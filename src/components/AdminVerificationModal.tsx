import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useDB, store, type ArtisanProfile } from "@/lib/store";
import { CheckPill, TrustBadge, VerificationBadge } from "./Badges";
import { AlertTriangle, ShieldCheck, BadgeCheck, FileText, Eye, UserRound, Phone, Mail, MapPin, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";

const FIELDS: { key: keyof ArtisanProfile["checks"]; label: string }[] = [
  { key: "identity", label: "Government ID" },
  { key: "selfie", label: "Selfie verification" },
  { key: "skill_proof", label: "Skill proof / certificate" },
  { key: "reference", label: "Reference contact" },
  { key: "portfolio", label: "Work portfolio" },
  { key: "admin_approval", label: "Admin approval" },
];

export function AdminVerificationModal({ artisanId, open, onOpenChange }: { artisanId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const a = db.artisans.find((x) => x.id === artisanId);
  const user = a ? db.users.find((u) => u.id === a.user_id) : null;
  const cat = a ? db.categories.find((c) => c.id === a.category_id) : null;
  const [notes, setNotes] = useState("");

  if (!a) return null;

  const docs = a.verification_documents ?? [];
  const missing = Object.entries(a.checks).filter(([, v]) => v === "pending").map(([k]) => k);
  const risk = missing.length >= 2;

  function approve() {
    store.setVerification(a!.id, "verified", notes || "Verified after profile, reference and documents review");
    toast.success(`${a!.business_name} approved`);
    setNotes("");
    onOpenChange(false);
  }
  function reject() {
    store.setVerification(a!.id, "rejected", notes || "Verification rejected after admin document review");
    toast(`${a!.business_name} rejected`);
    setNotes("");
    onOpenChange(false);
  }
  function moreInfo() {
    store.requestMoreInfo(a!.id, notes || "More information requested for verification documents");
    toast("More info requested");
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Verification Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                {a.profile_image ? (
                  <img src={a.profile_image} alt={a.business_name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-6 w-6" /></div>
                )}
                <div className="min-w-0">
                  <div className="text-base font-semibold">{a.business_name}</div>
                  <div className="text-xs text-muted-foreground">{cat?.name} · {a.location_zone} · {a.experience_years} years experience</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VerificationBadge status={a.verification_status} />
                    <TrustBadge score={a.trust_score} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <div className="font-bold uppercase tracking-wide text-foreground">Application ID</div>
                <div>{a.id}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InfoCard icon={UserRound} label="Owner" value={user?.full_name ?? "Not provided"} />
            <InfoCard icon={Phone} label="Phone" value={user?.phone ?? "Not provided"} />
            <InfoCard icon={Mail} label="Email" value={user?.email ?? "Not provided"} />
            <InfoCard icon={MapPin} label="Zone" value={a.location_zone} />
            <InfoCard icon={BriefcaseBusiness} label="Price range" value={a.price_range || "Not provided"} />
            <InfoCard icon={ShieldCheck} label="Availability" value={a.availability_status} />
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service description</div>
            <p className="text-sm leading-6">{a.bio || "No service description provided."}</p>
          </div>

          {risk && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Risk flag: {missing.length} required item(s) missing — {missing.join(", ").replace(/_/g, " ")}.</span>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span>{label}</span>
                <CheckPill status={a.checks[key]} />
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Submitted verification documents</h3>
                <p className="text-xs text-muted-foreground">Admin reviews these before approving or rejecting the artisan.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{docs.length} file(s)</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {docs.map((doc) => (
                <div key={`${doc.key}-${doc.file_name}`} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> {doc.label}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{doc.file_name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{doc.file_type || "Document"} · {new Date(doc.uploaded_at).toLocaleString()}</div>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-bold text-success">Submitted</span>
                  </div>
                  {doc.preview_url ? (
                    <a href={doc.preview_url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={doc.preview_url} alt={doc.label} className="h-44 w-full object-cover transition hover:scale-[1.01]" />
                      <div className="flex items-center justify-center gap-1 border-t border-border bg-background px-3 py-2 text-xs font-semibold text-primary"><Eye className="h-3.5 w-3.5" /> Open preview</div>
                    </a>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                      File metadata received. In production, PDF/certificate files will open from secure cloud storage.
                    </div>
                  )}
                </div>
              ))}
              {docs.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground md:col-span-2">
                  No uploaded verification files yet. Admin can request more information before approval.
                </div>
              )}
            </div>
          </section>

          {a.reference && (
            <div className="rounded-lg border border-border bg-background p-3 text-xs">
              <div className="mb-1 inline-flex items-center gap-1 font-semibold text-foreground"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Reference</div>
              <div className="text-muted-foreground">{a.reference.name} · {a.reference.phone} · {a.reference.relationship}</div>
              {a.emergency_contact && <div className="mt-1 text-muted-foreground">Emergency: {a.emergency_contact}</div>}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Decision notes</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add decision notes, missing requirement, or approval reason" />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={moreInfo}>Request More Info</Button>
            <Button variant="destructive" onClick={reject}>Reject</Button>
            <Button onClick={approve}>Approve Verification</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}
