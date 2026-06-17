import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useDB, store, type RequestStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, UrgencyBadge, VerificationBadge } from "@/components/Badges";
import { ArrowLeft, Star, BadgeCheck, FileCheck2, Clock, Wrench, CheckCircle2, Car, Search, Handshake, MessageCircle, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { artisanAvatar } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";
import { ChatModal } from "@/components/ChatModal";
import { exportChatTranscriptPdf } from "@/lib/exportChatPdf";

export const Route = createFileRoute("/request/$id")({
  component: RequestDetail,
});

const TIMELINE: { s: RequestStatus; label: string; Icon: any }[] = [
  { s: "pending", label: "Pending", Icon: Clock },
  { s: "matched", label: "Matched", Icon: Search },
  { s: "accepted", label: "Accepted", Icon: Handshake },
  { s: "on_the_way", label: "On the way", Icon: Car },
  { s: "in_progress", label: "In Progress", Icon: Wrench },
  { s: "completed", label: "Completed", Icon: CheckCircle2 },
  { s: "reviewed", label: "Reviewed", Icon: Star },
];

function RequestDetail() {
  const { id } = Route.useParams();
  const db = useDB();
  const r = db.requests.find((x) => x.id === id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [complaint, setComplaint] = useState("");
  const [chatOpen, setChatOpen] = useState(false);


  if (!r) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="mx-auto max-w-3xl p-8">Request not found. <Link to="/dashboard" className="text-primary underline">Back</Link></div>
    </div>
  );
  const a = db.artisans.find((x) => x.id === r.artisan_id);
  const c = db.categories.find((x) => x.id === r.category_id);
  const effective = r.status === "disputed" ? "completed" : r.status;
  const currentIdx = TIMELINE.findIndex((t) => t.s === effective);

  function submitReview() {
    if (!a) { toast.error("No artisan assigned"); return; }
    if (r!.status !== "completed" && r!.status !== "reviewed") {
      toast.error("Job must be completed before review"); return;
    }
    store.addReview({ request_id: r!.id, user_id: db.currentUserId, artisan_id: a.id, rating, comment });
    toast.success("Verified review submitted");
    setComment("");
  }
  function submitComplaint() {
    if (!a) { toast.error("No artisan assigned"); return; }
    if (!complaint.trim()) { toast.error("Describe the issue"); return; }
    store.addComplaint({ request_id: r!.id, user_id: db.currentUserId, artisan_id: a.id, complaint_text: complaint });
    toast.success("Complaint filed");
    setComplaint("");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Service request · {c?.name}</div>
              <h1 className="mt-1 text-xl font-bold">{r.issue_description}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={r.status} />
                <UrgencyBadge urgency={r.urgency} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.location_zone}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.preferred_time}</span>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">Created {new Date(r.created_at).toLocaleString()}</div>
          </div>

          {/* Visual timeline */}
          <div className="mt-6">
            <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {TIMELINE.map((t, i) => {
                const active = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={t.s} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-full border-2 transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"} ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                      <t.Icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-1.5 truncate text-[10px] sm:text-xs ${active ? "font-medium" : "text-muted-foreground"}`}>{t.label}</span>
                    {i < TIMELINE.length - 1 && <div className={`absolute top-5 hidden h-0.5 sm:block`} style={{ left: `calc(${(i + 0.5) * (100 / TIMELINE.length)}% + 20px)`, right: `calc(${(TIMELINE.length - i - 1.5) * (100 / TIMELINE.length)}% + 20px)`, background: active && i < currentIdx ? "var(--primary)" : "var(--border)" }} />}
                  </div>
                );
              })}
            </div>
            {r.status === "disputed" && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Disputed — under review</div>}
          </div>
        </div>

        {/* Matched artisan */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Matched artisan</h2>
          {a ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SmartImage src={artisanAvatar(a.id)} alt={a.business_name} variant="avatar" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
                <div>
                  <div className="font-semibold">{a.business_name}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <VerificationBadge status={a.verification_status} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">★ {a.rating.toFixed(1)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{a.location_zone}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">~{a.response_time_mins} min reply</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setChatOpen(true)}><MessageCircle className="mr-1 h-4 w-4" />Message</Button>
                <Button asChild variant="outline"><Link to="/artisan/$id" params={{ id: a.id }}>View profile</Link></Button>
              </div>
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">No artisan assigned yet.</p>}
        </div>

        {/* Last messages preview */}
        {a && (() => {
          const thread = db.messages.filter((m) => m.artisan_id === a.id && m.resident_id === db.currentUserId);
          const last = thread.slice(-3);
          return (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Recent conversation</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Last {last.length} of {thread.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setChatOpen(true)}><MessageCircle className="mr-1 h-4 w-4" />Open chat</Button>
                  <Button size="sm" variant="outline" disabled={thread.length === 0} onClick={() => { exportChatTranscriptPdf(a, thread); toast.success("Chat transcript exported"); }}>
                    <FileDown className="mr-1 h-4 w-4" />Export PDF
                  </Button>
                </div>
              </div>
              {last.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No messages exchanged yet. Open chat to clarify scope, arrival time and materials.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {last.map((m) => {
                    const isResident = m.sender === "resident";
                    return (
                      <li key={m.id} className={`rounded-lg border p-3 text-sm ${isResident ? "border-primary/20 bg-primary/5" : "border-success/20 bg-success/5"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${isResident ? "text-primary" : "text-success"}`}>{isResident ? "Resident" : "Artisan"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-foreground">{m.text}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })()}

        {/* Scope agreement */}
        {a && r.scope && (
          <div className="rounded-2xl border border-border bg-[image:var(--gradient-card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Pre-Service Scope Agreement</h2>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.scope.status === "agreed" ? "bg-success/10 text-success" : r.scope.status === "declined" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning-foreground"}`}>
                {r.scope.status === "agreed" ? "Agreed" : r.scope.status === "declined" ? "Declined" : "Awaiting Agreement"}
              </span>
            </div>
            {r.scope.chat_summary && (
              <div className="mt-3 rounded-lg border border-border bg-background p-3 text-xs">
                <div className="font-semibold text-foreground">Chat summary</div>
                <div className="mt-0.5 text-muted-foreground">{r.scope.chat_summary}</div>
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <KV label="Issue" value={r.issue_description} />
              <KV label="Estimated price range" value={r.scope.price_estimate} />
              <KV label="Expected arrival time" value={r.scope.eta} />
              <KV label="Materials needed" value={r.scope.materials} />
              <KV label="Urgency" value={r.urgency} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.scope.status !== "agreed" && (
                <Button size="sm" onClick={() => { store.setScopeAgreement(r.id, "agreed"); toast.success("Scope agreement confirmed"); }}>Confirm Scope Agreement</Button>
              )}
              {r.scope.status !== "declined" && (
                <Button size="sm" variant="outline" onClick={() => { store.setScopeAgreement(r.id, "declined"); toast("Scope declined"); }}>Decline</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => { store.requestScopeUpdate(r.id); toast("Update requested — awaiting artisan"); }}>Request Update</Button>
            </div>
          </div>
        )}

        {/* Job status controls */}
        {a && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update job status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["matched", "accepted", "on_the_way", "in_progress", "completed"] as RequestStatus[]).map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => { store.updateRequestStatus(r.id, s); toast(`Status → ${s.replace(/_/g, " ")}`); }}>{s.replace(/_/g, " ")}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Review & complaint */}
        {a && (r.status === "completed" || r.status === "reviewed" || r.status === "disputed") && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-semibold">Leave a verified review</h3>
              <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-success" /> Only residents with completed service requests can leave verified reviews.</p>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`h-6 w-6 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                <Label>Comment</Label>
                <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <Button className="mt-3" onClick={submitReview}>Submit verified review</Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-semibold">File a complaint</h3>
              <div className="mt-3 space-y-1.5">
                <Label>What went wrong?</Label>
                <Textarea rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
              </div>
              <Button className="mt-3" variant="destructive" onClick={submitComplaint}>Submit complaint</Button>
            </div>
          </div>
        )}
      </main>
      {a && <ChatModal artisan={a} open={chatOpen} onOpenChange={setChatOpen} />}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
