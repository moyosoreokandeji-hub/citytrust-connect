import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, MessageSquare, Send, ShieldCheck } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDB, store, QUICK_MESSAGES, QUICK_REPLIES_ARTISAN, type ArtisanProfile, type User } from "@/lib/store";
import { artisanAvatar } from "@/lib/images";
import { SmartImage } from "@/components/SmartImage";

type Role = "resident" | "artisan";

type Conversation = {
  key: string;
  artisan: ArtisanProfile;
  resident: User;
  last: string;
  at: string;
  count: number;
};

function initials(name?: string) {
  return (name ?? "CT")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CT";
}

function Avatar({ role, conversation }: { role: Role; conversation: Conversation }) {
  if (role === "resident") {
    return (
      <SmartImage
        src={artisanAvatar(conversation.artisan.id)}
        alt={conversation.artisan.business_name}
        variant="avatar"
        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/10"
      />
    );
  }

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary ring-2 ring-primary/10">
      {initials(conversation.resident.full_name)}
    </div>
  );
}

export function MessageCenterDialog({
  role,
  open,
  onOpenChange,
  residentId,
  artisanId,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId?: string;
  artisanId?: string;
}) {
  const db = useDB();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState<string>("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [text, setText] = useState("");

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();

    function upsert(artisan: ArtisanProfile | undefined, resident: User | undefined, last = "Start a conversation", at = new Date().toISOString()) {
      if (!artisan || !resident) return;
      if (role === "resident" && residentId && resident.id !== residentId) return;
      if (role === "artisan" && artisanId && artisan.id !== artisanId) return;
      const key = `${resident.id}:${artisan.id}`;
      if (!map.has(key)) map.set(key, { key, artisan, resident, last, at, count: 0 });
    }

    for (const m of db.messages) {
      const artisan = db.artisans.find((a) => a.id === m.artisan_id);
      const resident = db.users.find((u) => u.id === m.resident_id);
      if (!artisan || !resident) continue;
      if (role === "resident" && residentId && m.resident_id !== residentId) continue;
      if (role === "artisan" && artisanId && m.artisan_id !== artisanId) continue;
      const key = `${resident.id}:${artisan.id}`;
      const prev = map.get(key);
      map.set(key, {
        key,
        artisan,
        resident,
        last: prev && new Date(prev.at) > new Date(m.created_at) ? prev.last : m.text,
        at: prev && new Date(prev.at) > new Date(m.created_at) ? prev.at : m.created_at,
        count: (prev?.count ?? 0) + 1,
      });
    }

    if (role === "resident" && residentId) {
      const resident = db.users.find((u) => u.id === residentId);
      db.requests
        .filter((r) => r.user_id === residentId && r.artisan_id)
        .forEach((r) => upsert(db.artisans.find((a) => a.id === r.artisan_id), resident));
      db.savedArtisanIds.forEach((id) => upsert(db.artisans.find((a) => a.id === id), resident));
    }

    if (role === "artisan" && artisanId) {
      const artisan = db.artisans.find((a) => a.id === artisanId);
      db.requests
        .filter((r) => r.artisan_id === artisanId)
        .forEach((r) => upsert(artisan, db.users.find((u) => u.id === r.user_id)));
    }

    return Array.from(map.values()).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [db, role, residentId, artisanId]);

  useEffect(() => {
    if (!open) {
      setMobileThreadOpen(false);
      return;
    }
    if (!activeKey && conversations[0]) setActiveKey(conversations[0].key);
    if (activeKey && !conversations.some((c) => c.key === activeKey)) setActiveKey(conversations[0]?.key ?? "");
  }, [open, conversations, activeKey]);

  const active = conversations.find((c) => c.key === activeKey) ?? conversations[0] ?? null;
  const messages = active
    ? db.messages
        .filter((m) => m.artisan_id === active.artisan.id && m.resident_id === active.resident.id)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    : [];

  useEffect(() => {
    if (!open || !active) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [open, messages.length, activeKey, active]);

  function openConversation(key: string) {
    setActiveKey(key);
    setMobileThreadOpen(true);
  }

  function send(value: string) {
    const clean = value.trim();
    if (!clean || !active) return;
    const sender = role === "resident" ? "resident" : "artisan";
    store.sendMessage(active.artisan.id, active.resident.id, sender, clean);
    setText("");

    if (role === "resident") {
      setTimeout(() => {
        const replies = [
          "Received. I can inspect and confirm the scope.",
          "I am available today. Please confirm the preferred time.",
          "I will share a clear estimate before work starts.",
          "I can bring materials if needed.",
        ];
        store.sendMessage(active.artisan.id, active.resident.id, "artisan", replies[Math.floor(Math.random() * replies.length)]);
      }, 650);
    }
  }

  const title = role === "resident" ? "Resident Messages" : "Artisan Messages";
  const quickMessages = role === "resident" ? QUICK_MESSAGES : QUICK_REPLIES_ARTISAN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ct-animate-scale-in flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden p-0 sm:h-[88vh] sm:max-h-[88vh] sm:rounded-[1.5rem]">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-4 py-3 sm:px-5 sm:py-4">
          <DialogTitle asChild>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{title}</div>
                <div className="line-clamp-2 text-xs font-normal text-muted-foreground sm:line-clamp-1">
                  View conversations, send quick replies, and keep service discussions accountable.
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <aside className={`${mobileThreadOpen ? "hidden md:block" : "block"} min-h-0 border-border bg-muted/30 p-3 md:border-r`}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversations</div>
            <div className="h-full max-h-[calc(92dvh-9.5rem)] space-y-2 overflow-y-auto pr-1 md:max-h-none md:pb-3">
              {conversations.map((c) => {
                const selected = c.key === active?.key;
                const name = role === "resident" ? c.artisan.business_name : c.resident.full_name;
                const sub = role === "resident" ? `${c.artisan.location_zone} · ${c.artisan.price_range}` : `${c.resident.location_zone} resident`;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => openConversation(c.key)}
                    className={`flex w-full max-w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-primary/40 bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}
                  >
                    <Avatar role={role} conversation={c} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{name}</div>
                      <div className="truncate text-xs text-muted-foreground">{sub}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{c.last}</div>
                    </div>
                    {c.count > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{c.count}</span>}
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
                  No conversations yet. Messages appear here after a request is matched.
                </div>
              )}
            </div>
          </aside>

          <section className={`${mobileThreadOpen ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-background`}>
            {active ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card p-3 sm:p-4">
                  <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 md:hidden" onClick={() => setMobileThreadOpen(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar role={role} conversation={active} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{role === "resident" ? active.artisan.business_name : active.resident.full_name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3 w-3 text-success" /> CityTrust verified conversation
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-2 border-b border-border bg-primary/5 px-4 py-2.5 text-xs text-primary">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Keep estimates, arrival time, materials, and scope agreements inside CityTrust for accountability.</span>
                </div>

                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4">
                  <div className="mx-auto max-w-3xl space-y-3">
                    {messages.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                        Start this conversation using a quick message below.
                      </div>
                    )}
                    {messages.map((m) => {
                      const mine = role === "resident" ? m.sender === "resident" : m.sender === "artisan";
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[86%] break-words rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[72%] ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-foreground"}`}>
                            <div className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                              {m.sender === "resident" ? "Resident" : "Artisan"}
                            </div>
                            <div>{m.text}</div>
                            <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 border-t border-border bg-card p-3">
                  <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {quickMessages.map((q) => (
                      <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs transition hover:border-primary hover:bg-primary/5 hover:text-primary">
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(text); }} placeholder="Type a message…" />
                    <Button size="sm" onClick={() => send(text)} aria-label="Send message"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center text-muted-foreground">No message thread selected.</div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
