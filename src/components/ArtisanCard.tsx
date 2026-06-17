import { Link } from "@tanstack/react-router";
import { MapPin, Briefcase, Clock, MessageSquareWarning, Circle, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { ArtisanProfile, ServiceCategory } from "@/lib/store";
import { VerificationBadge, TrustBadge } from "./Badges";
import { Button } from "@/components/ui/button";
import { artisanAvatar, portfolioImages } from "@/lib/images";
import { SmartImage } from "./SmartImage";
import { ChatModal } from "./ChatModal";
import { TrustScoreModal } from "./TrustScoreModal";

export function ArtisanCard({ artisan, category, score, reasons, onRequest }: { artisan: ArtisanProfile; category?: ServiceCategory; score?: number; reasons?: string[]; onRequest?: () => void }) {
  const portfolio = portfolioImages(artisan.category_id).slice(0, 3);
  const [chatOpen, setChatOpen] = useState(false);
  const [trustOpen, setTrustOpen] = useState(false);
  const availDot =
    artisan.availability_status === "available" ? "text-success" :
    artisan.availability_status === "busy" ? "text-warning" : "text-muted-foreground";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]">
      {typeof score === "number" && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-md">
          <ShieldCheck className="h-3.5 w-3.5" /> Recommended
        </div>
      )}

      <div className="grid grid-cols-3 gap-0.5 bg-muted">
        {portfolio.map((src, i) => (
          <div key={i} className={i === 0 ? "col-span-2 row-span-2 aspect-[2/1] overflow-hidden" : "aspect-square overflow-hidden"}>
            <SmartImage src={src} alt={`${category?.name ?? "Service"} sample work`} categoryId={artisan.category_id} fallbackLabel={`${category?.name ?? "Service"} sample`} className="h-full w-full object-cover transition group-hover:scale-105" />
          </div>
        ))}
      </div>

      <div className="flex-1 p-5">
        <div className="flex items-start gap-3">
          <SmartImage src={artisanAvatar(artisan.id)} alt={artisan.business_name} variant="avatar" className="h-12 w-12 shrink-0 rounded-full border-2 border-card object-cover ring-2 ring-primary/20" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{artisan.business_name}</h3>
            <div className="mt-0.5 text-xs text-muted-foreground">{category?.name ?? "Service"}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <VerificationBadge status={artisan.verification_status} />
              <TrustBadge score={artisan.trust_score} onClick={() => setTrustOpen(true)} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{artisan.location_zone}</div>
          <div className="flex items-center gap-1.5 text-muted-foreground">Rating {artisan.rating.toFixed(1)}</div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{artisan.completed_jobs} jobs</div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" />~{artisan.response_time_mins} min reply</div>
          <div className="flex items-center gap-1.5"><Circle className={`h-2.5 w-2.5 fill-current ${availDot}`} /><span className="capitalize text-muted-foreground">{artisan.availability_status}</span></div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><MessageSquareWarning className="h-3.5 w-3.5" />{artisan.complaint_count} complaints</div>
        </div>

        {reasons && reasons.length > 0 && (
          <div className="mt-3 rounded-lg bg-primary/5 p-2.5 text-xs text-primary">
            Best fit because {reasons.join(", ")}.
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-foreground">{artisan.price_range}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setChatOpen(true)}>
              <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/artisan/$id" params={{ id: artisan.id }}>Profile</Link>
            </Button>
            {onRequest && <Button size="sm" onClick={onRequest}>Request</Button>}
          </div>
        </div>
      </div>

      <ChatModal artisan={artisan} open={chatOpen} onOpenChange={setChatOpen} />
      <TrustScoreModal artisan={artisan} open={trustOpen} onOpenChange={setTrustOpen} />
    </div>
  );
}
