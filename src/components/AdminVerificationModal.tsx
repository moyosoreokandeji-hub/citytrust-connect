import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useDB, store, type ArtisanProfile } from "@/lib/store";
import { CheckPill, TrustBadge, VerificationBadge } from "./Badges";
import { AlertTriangle, ShieldCheck, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

const FIELDS: { key: keyof ArtisanProfile["checks"]; label: string }[] = [
  { key: "identity", label: "Government ID" },
  { key: "selfie", label: "Selfie verification" },
  { key: "skill_proof", label: "Skill proof" },
  { key: "reference", label: "Reference contact" },
  { key: "portfolio", label: "Work portfolio" },
  { key: "admin_approval", label: "Admin approval" },
];

export function AdminVerificationModal({ artisanId, open, onOpenChange }: { artisanId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const a = db.artisans.find((x) => x.id === artisanId);
  const cat = a ? db.categories.find((c) => c.id === a.category_id) : null;
  const [notes, setNotes] = useState("");

  if (!a) return null;

  const missing = Object.entries(a.checks).filter(([, v]) => v === "pending").map(([k]) => k);
  const risk = missing.length >= 2;

  function approve() {
    store.setVerification(a!.id, "verified", notes);
    toast.success(`${a!.business_name} approved`);
    setNotes("");
    onOpenChange(false);
  }
  function reject() {
    store.setVerification(a!.id, "rejected", notes);
    toast(`${a!.business_name} rejected`);
    setNotes("");
    onOpenChange(false);
  }
  function moreInfo() {
    store.requestMoreInfo(a!.id, notes || "More information requested");
    toast("More info requested");
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Verification Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-base font-semibold">{a.business_name}</div>
                <div className="text-xs text-muted-foreground">{cat?.name} · {a.location_zone}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <VerificationBadge status={a.verification_status} />
                <TrustBadge score={a.trust_score} />
              </div>
            </div>
          </div>

          {risk && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Risk flag: {missing.length} required document(s) missing — {missing.join(", ").replace(/_/g, " ")}.</span>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span>{label}</span>
                <CheckPill status={a.checks[key]} />
              </div>
            ))}
          </div>

          {a.reference && (
            <div className="rounded-lg border border-border bg-background p-3 text-xs">
              <div className="mb-1 font-semibold text-foreground inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Reference</div>
              <div className="text-muted-foreground">{a.reference.name} · {a.reference.phone} · {a.reference.relationship}</div>
              {a.emergency_contact && <div className="mt-1 text-muted-foreground">Emergency: {a.emergency_contact}</div>}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Decision notes</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for activity log" />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={moreInfo}>Request More Info</Button>
            <Button variant="destructive" onClick={reject}>Reject</Button>
            <Button onClick={approve}>Approve</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
