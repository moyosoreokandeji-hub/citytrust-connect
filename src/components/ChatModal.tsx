import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Send, BadgeCheck, FileDown, Phone, ImagePlus, Mic, Square } from "lucide-react";
import { useDB, store, QUICK_MESSAGES, categoryPriceLabel, type ArtisanProfile } from "@/lib/store";
import { artisanAvatar } from "@/lib/images";
import { SmartImage } from "./SmartImage";
import { exportChatTranscriptPdf } from "@/lib/exportChatPdf";
import { toast } from "sonner";

export function ChatModal({ artisan, open, onOpenChange }: { artisan: ArtisanProfile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const residentId = db.authSessions?.residentUserId ?? "";
  const messages = useMemo(
    () => db.messages.filter((m) => m.artisan_id === artisan.id && m.resident_id === residentId),
    [db.messages, artisan.id, residentId]
  );
  const artisanUser = db.users.find((u) => u.id === artisan.user_id);
  const priceCategory = db.categories.find((c) => c.id === artisan.category_id);
  const priceGuide = categoryPriceLabel(priceCategory);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [open, messages.length]);

  function send(t: string, imageUrl?: string) {
    const value = t.trim();
    if (!residentId) {
      toast.error("Please sign in as a resident before sending a message.");
      return;
    }
    if (!value && !imageUrl) return;
    store.sendMessage(artisan.id, residentId, "resident", value || "Photo attached", imageUrl);
    setText("");
  }

  function sendVoiceNote(audioUrl: string, durationSecs: number) {
    if (!residentId) {
      toast.error("Please sign in as a resident before sending a voice note.");
      return;
    }
    store.sendMessage(artisan.id, residentId, "resident", "Voice note", undefined, audioUrl, durationSecs);
  }

  async function startVoiceRecording() {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice notes are not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      recordingStreamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const durationSecs = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        const reader = new FileReader();

        reader.onloadend = () => {
          const audioUrl = String(reader.result || "");
          if (audioUrl) {
            sendVoiceNote(audioUrl, durationSecs);
            toast.success("Voice note sent");
          }
        };

        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      toast("Recording voice note… tap stop when done.");
    } catch {
      toast.error("Microphone access was blocked. Please allow microphone permission.");
    }
  }

  function stopVoiceRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      } catch {}
    };
  }, []);

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = String(reader.result || "");
      send("Photo attached", imageUrl);
      toast.success("Photo sent");
    };
    reader.readAsDataURL(file);
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
              <SmartImage src={artisan.profile_image || artisanAvatar(artisan.id)} alt={artisan.business_name} variant="avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{artisan.business_name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck className="h-3 w-3 text-success" /> Verified artisan · usually replies in ~{artisan.response_time_mins} min
                </div>
              </div>
              {artisanUser?.phone && (
                <Button asChild size="sm" variant="outline" className="hidden shrink-0 sm:inline-flex">
                  <a href={`tel:${artisanUser.phone.replace(/\s/g, "")}`}><Phone className="mr-1 h-4 w-4" /> Call</a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleExport} className="mr-6 hidden shrink-0 sm:inline-flex">
                <FileDown className="mr-1 h-4 w-4" /> Export PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex shrink-0 items-start gap-2 border-b border-border bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>For safety and accountability, service agreements should be confirmed through CityTrust before work begins. Suggested {priceCategory?.name ?? "service"} range: <strong>{priceGuide}</strong>.</span>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-3 sm:p-4">
          <div className="mx-auto max-w-3xl space-y-3">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
                No messages yet. Start the conversation to clarify issue, estimate, arrival time and materials.
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
                    {m.image_url && (
                      <img src={m.image_url} alt="Shared attachment" className="mb-2 max-h-56 w-full rounded-xl object-cover" />
                    )}
                    {m.audio_url && (
                      <div className={`mb-2 flex items-center gap-2 rounded-2xl p-2 ${isResident ? "bg-white/15" : "bg-primary/5"}`}>
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isResident ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                          <Mic className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wide opacity-75">Voice note{m.audio_duration_secs ? ` · ${m.audio_duration_secs}s` : ""}</div>
                          <div className="mt-1 flex h-5 items-center gap-0.5 overflow-hidden">
                            {Array.from({ length: 22 }).map((_, index) => (
                              <span key={index} className={`w-1 shrink-0 rounded-full ${isResident ? "bg-white/70" : "bg-primary/45"}`} style={{ height: `${8 + ((index * 7) % 14)}px` }} />
                            ))}
                          </div>
                          <audio src={m.audio_url} controls className="mt-2 h-8 w-full max-w-full" />
                        </div>
                      </div>
                    )}
                    {m.text && m.text !== "Photo attached" && m.text !== "Voice note" && <div>{m.text}</div>}
                    <div className={`mt-1 text-[10px] ${isResident ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-card px-3 py-2">
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Resident quick messages</div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_MESSAGES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} aria-label="Send photo">
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            aria-label={isRecording ? "Stop voice note" : "Record voice note"}
            className={isRecording ? "shrink-0 animate-pulse" : "shrink-0"}
          >
            {isRecording ? <><Square className="mr-1 h-4 w-4" /> Stop</> : <Mic className="h-4 w-4" />}
          </Button>
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
