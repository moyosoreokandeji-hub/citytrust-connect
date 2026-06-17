import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Plus, AlertTriangle, BadgeCheck } from "lucide-react";
import type { ArtisanProfile } from "@/lib/store";

interface Factor { label: string; points: number; achieved: boolean }

function positiveFactors(a: ArtisanProfile): Factor[] {
  return [
    { label: "Identity verified", points: 20, achieved: a.checks.identity === "verified" },
    { label: "Skill proof submitted", points: 15, achieved: a.checks.skill_proof === "verified" },
    { label: "Admin approved", points: 20, achieved: a.checks.admin_approval === "verified" },
    { label: "High rating (4.5+)", points: 15, achieved: a.rating >= 4.5 },
    { label: "Completed jobs (30+)", points: 10, achieved: a.completed_jobs >= 30 },
    { label: "Low complaint rate", points: 10, achieved: a.complaint_count <= 1 },
    { label: "Fast response time (≤25 min)", points: 10, achieved: a.response_time_mins <= 25 },
  ];
}

function warnings(a: ArtisanProfile): string[] {
  const w: string[] = [];
  if (a.verification_status === "pending" || a.verification_status === "under_review") w.push("Verification still under review");
  const missing = Object.entries(a.checks).filter(([, v]) => v !== "verified").map(([k]) => k.replace("_", " "));
  if (missing.length > 0 && a.verification_status !== "verified") w.push(`Missing/pending documents: ${missing.join(", ")}`);
  if (a.complaint_count >= 2) w.push(`${a.complaint_count} open or past complaints`);
  if (a.rating > 0 && a.rating < 4) w.push("Rating below 4.0");
  if (a.response_time_mins > 45) w.push("Slow average response time");
  return w;
}

export function TrustScoreModal({ artisan, open, onOpenChange }: { artisan: ArtisanProfile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const factors = positiveFactors(artisan);
  const warns = warnings(artisan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-trust" /> Trust Score Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-[image:var(--gradient-card)] p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{artisan.business_name}</div>
          <div className="mt-1 text-4xl font-bold text-trust">{artisan.trust_score}<span className="text-base text-muted-foreground">/100</span></div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-success"><BadgeCheck className="h-3.5 w-3.5" /> Trust scoring is updated automatically as the artisan works on CityTrust.</div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How this score is built</h4>
          <ul className="space-y-1.5">
            {factors.map((f) => (
              <li key={f.label} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${f.achieved ? "border-success/30 bg-success/5" : "border-border bg-muted/40 text-muted-foreground"}`}>
                <span className="flex items-center gap-2">
                  <Plus className={`h-4 w-4 ${f.achieved ? "text-success" : "text-muted-foreground/60"}`} />
                  {f.label}
                </span>
                <span className={`text-xs font-semibold ${f.achieved ? "text-success" : "text-muted-foreground"}`}>
                  {f.achieved ? `+${f.points}` : `+${f.points} pending`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {warns.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">Warnings</h4>
            <ul className="space-y-1.5">
              {warns.map((w) => (
                <li key={w} className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
