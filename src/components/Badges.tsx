import { BadgeCheck, Clock, Flame, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Car, Wrench } from "lucide-react";
import type { RequestStatus, Urgency, VerifyStatus } from "@/lib/store";

export function VerificationBadge({ status }: { status: VerifyStatus }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <BadgeCheck className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }
  if (status === "under_review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
        <Clock className="h-3.5 w-3.5" /> Under Review
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning-foreground">
        <Clock className="h-3.5 w-3.5" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <XCircle className="h-3.5 w-3.5" /> Rejected
    </span>
  );
}

export function TrustBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  const high = score >= 80;
  const base = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${high ? "bg-trust/10 text-trust" : "bg-muted text-muted-foreground"}`;
  if (onClick) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }} className={`${base} transition hover:ring-2 hover:ring-trust/40`} title="See trust score breakdown">
        <ShieldCheck className="h-3.5 w-3.5" /> Trust {score}
      </button>
    );
  }
  return (
    <span className={base}>
      <ShieldCheck className="h-3.5 w-3.5" /> Trust {score}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const map: Record<Urgency, { cls: string; label: string; Icon: typeof Flame }> = {
    low: { cls: "bg-muted text-muted-foreground", label: "Low", Icon: Clock },
    medium: { cls: "bg-info/10 text-info", label: "Medium", Icon: Clock },
    high: { cls: "bg-warning/15 text-warning-foreground", label: "High", Icon: AlertTriangle },
    emergency: { cls: "bg-destructive text-destructive-foreground animate-pulse", label: "Emergency", Icon: Flame },
  };
  const { cls, label, Icon } = map[urgency];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, string> = {
    pending: "bg-muted text-muted-foreground",
    matched: "bg-info/10 text-info",
    accepted: "bg-trust/10 text-trust",
    on_the_way: "bg-accent/20 text-accent-foreground",
    in_progress: "bg-warning/15 text-warning-foreground",
    completed: "bg-success/10 text-success",
    reviewed: "bg-success/10 text-success",
    disputed: "bg-destructive/10 text-destructive",
  };
  const Icon =
    status === "completed" || status === "reviewed" ? CheckCircle2 :
    status === "disputed" ? ShieldAlert :
    status === "on_the_way" ? Car :
    status === "in_progress" ? Wrench : Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      <Icon className="h-3.5 w-3.5" /> {status.replace(/_/g, " ")}
    </span>
  );
}

export function CheckPill({ status }: { status: "pending" | "under_review" | "verified" | "rejected" }) {
  const map = {
    verified: { cls: "bg-success/10 text-success", Icon: CheckCircle2, label: "Verified" },
    under_review: { cls: "bg-info/10 text-info", Icon: Clock, label: "Under Review" },
    pending: { cls: "bg-warning/15 text-warning-foreground", Icon: Clock, label: "Pending" },
    rejected: { cls: "bg-destructive/10 text-destructive", Icon: XCircle, label: "Rejected" },
  } as const;
  const { cls, Icon, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
