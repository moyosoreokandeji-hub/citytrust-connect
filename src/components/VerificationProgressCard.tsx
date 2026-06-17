import { BadgeCheck } from "lucide-react";
import { CheckPill } from "./Badges";
import type { ArtisanProfile, VerifyStatus } from "@/lib/store";

const LABELS: { key: keyof ArtisanProfile["checks"]; label: string }[] = [
  { key: "identity", label: "Identity document" },
  { key: "selfie", label: "Selfie verification" },
  { key: "skill_proof", label: "Skill proof" },
  { key: "reference", label: "Reference check" },
  { key: "portfolio", label: "Work portfolio" },
  { key: "admin_approval", label: "Admin approval" },
];

function overallLabel(status: VerifyStatus, hasAnyUploaded: boolean): { label: string; cls: string } {
  if (status === "verified") return { label: "Verified", cls: "bg-success/10 text-success" };
  if (status === "rejected") return { label: "Rejected", cls: "bg-destructive/10 text-destructive" };
  if (status === "under_review") return { label: "Under Review", cls: "bg-info/10 text-info" };
  return hasAnyUploaded
    ? { label: "Submitted", cls: "bg-warning/15 text-warning-foreground" }
    : { label: "Not Submitted", cls: "bg-muted text-muted-foreground" };
}

export function VerificationProgressCard({ artisan }: { artisan: ArtisanProfile }) {
  const verifiedCount = Object.values(artisan.checks).filter((v) => v === "verified").length;
  const total = LABELS.length;
  const pct = Math.round((verifiedCount / total) * 100);
  const anyUploaded = Object.values(artisan.checks).some((v) => v !== "pending");
  const overall = overallLabel(artisan.verification_status, anyUploaded);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Verification Progress</h2>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${overall.cls}`}>
          {overall.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{verifiedCount} of {total} checks verified</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-[image:var(--gradient-hero)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span>{label}</span>
            <CheckPill status={artisan.checks[key]} />
          </li>
        ))}
      </ul>
    </section>
  );
}
