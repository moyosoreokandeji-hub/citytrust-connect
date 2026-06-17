import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Send, BadgeCheck, FileDown } from "lucide-react";
import { useDB, store, QUICK_MESSAGES, QUICK_REPLIES_ARTISAN, type ArtisanProfile } from "@/lib/store";
import { artisanAvatar } from "@/lib/images";
import { SmartImage } from "./SmartImage";
import { exportChatTranscriptPdf } from "@/lib/exportChatPdf";
import { toast } from "sonner";

export function ChatModal({ artisan, open, onOpenChange }: { artisan: ArtisanProfile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const residentId = db.authSessions?.residentUserId ?? db.currentUserId;
  const messages = useMemo(
    () => db.messages.filter((m) => m.artisan_id === artisan.id && m.resident_id === residentId),
    [db.messages, artisan.id, residentId]
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [open, messages.length]);

  function send(t: string, sender: "resident" | "artisan" = "resident") {
    const value = t.trim();
    if (!value) return;
    store.sendMessage(artisan.id, residentId, sender, value);
    setText("");
    if (sender === "resident") {
      // mock auto-reply
      setTimeout(() => {
        const replies = [
          "Got it — I can help with that.",
          "Yes, available. I'll bring the needed materials.",
          "Estimated range looks fair. Please confirm scope on CityTrust.",
          "I can arrive within the hour, confirm and I'm on the way.",
        ];
        const r = replies[Math.floor(Math.random() * replies.length)];
        store.sendMessage(artisan.id, residentId, "artisan", r);
      }, 700);
    }
  }

  function handleExport() {
    if (messages.length === 0) {
      toast.error("No messages to export yet");
      return;
    }
    exportChatTranscriptPdf(artisan, messages);
    toast.success("Chat transcript exported as PDF");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ct-animate-scale-in flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:h-[88vh] sm:max-h-[88vh]">
        <DialogHeader className="shrink-0 border-b border-border bg-card p-3 sm:p-4">
          <DialogTitle asChild>
            <div className="flex items-center gap-3">
              <SmartImage src={artisanAvatar(artisan.id)} alt={artisan.business_name} variant="avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{artisan.business_name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck className="h-3 w-3 text-success" /> Verified artisan · usually replies in ~{artisan.response_time_mins} min
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleExport} className="mr-6 hidden shrink-0 sm:inline-flex">
                <FileDown className="mr-1 h-4 w-4" /> Export PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Safety notice */}
        <div className="flex shrink-0 items-start gap-2 border-b border-border bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>For safety and accountability, service agreements should be confirmed through CityTrust before work begins.</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-3 sm:p-4">
          <div className="mx-auto max-w-3xl space-y-3">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
                No messages yet. Start the conversation to clarify issue, price, arrival time and materials.
              </div>
            )}
            {messages.map((m) => {
              const isResident = m.sender === "resident";
              return (
                <div key={m.id} className={`flex ${isResident ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] break-words rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[72%] ${isResident ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-foreground"}`}>
                    <div className={`mb-0.5 text-[10px] font-medium uppercase tracking-wide ${isResident ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                      {isResident ? "Resident" : "Artisan"}
                    </div>
                    <div>{m.text}</div>
                    <div className={`mt-1 text-[10px] ${isResident ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="shrink-0 space-y-1.5 border-t border-border bg-card px-3 py-2">
          <div>
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Resident quick messages</div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_MESSAGES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q, "resident")}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Artisan quick replies</div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_REPLIES_ARTISAN.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q, "artisan")}
                  className="shrink-0 rounded-full border border-success/40 bg-success/5 px-3 py-1 text-xs text-success transition hover:border-success hover:bg-success/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(text); }}
            placeholder="Type a message…"
          />
          <Button size="sm" onClick={() => send(text)} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
