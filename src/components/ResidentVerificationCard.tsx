import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, ShieldCheck, Phone, BadgeCheck } from "lucide-react";
import { useDB, store, ZONES_LIST, type ResidentTrust } from "@/lib/store";
import { toast } from "sonner";

export function ResidentTrustBadge({ trust }: { trust: ResidentTrust }) {
  const map: Record<ResidentTrust, { label: string; cls: string; Icon: typeof BadgeCheck }> = {
    basic: { label: "Basic Profile", cls: "bg-muted text-muted-foreground", Icon: UserCheck },
    phone_verified: { label: "Phone Verified", cls: "bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/20", Icon: Phone },
    verified_resident: { label: "Verified Resident", cls: "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/20", Icon: ShieldCheck },
  };
  const { label, cls, Icon } = map[trust];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-4 w-4" /> {label}
    </span>
  );
}

export function ResidentVerificationCard() {
  const db = useDB();
  const me = db.users.find((u) => u.id === db.currentUserId);
  const [form, setForm] = useState({
    full_name: me?.full_name ?? "",
    email: me?.email ?? "",
    phone: me?.phone ?? "",
    location_zone: me?.location_zone ?? ZONES_LIST[0],
  });
  const trust = me?.resident_trust ?? "basic";
  const idUploaded = !!me?.id_uploaded;

  function save() {
    store.setResidentTrust(db.currentUserId, trust, form);
    toast.success("Profile updated");
  }
  function verifyPhone() {
    store.setResidentTrust(db.currentUserId, "phone_verified");
    toast.success("Phone number verified");
  }
  function uploadId() {
    const newTrust: ResidentTrust = "verified_resident";
    store.setResidentTrust(db.currentUserId, newTrust, { id_uploaded: true });
    toast.success("ID submitted — upgraded to Verified Resident");
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Your resident profile</h2>
        </div>
        <ResidentTrustBadge trust={trust} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Optional. Verifying your profile improves trust on both sides — artisan verification is the main accountability layer.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5"><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Phone number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>Location zone</Label>
          <Select value={form.location_zone} onValueChange={(v) => setForm({ ...form, location_zone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ZONES_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-3">
        <div className="text-xs font-medium">Optional ID verification</div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload a valid government-issued ID to upgrade to <strong>Verified Resident</strong>. Submitted documents remain under review until approved by a CityTrust admin.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={verifyPhone} disabled={trust !== "basic"}>
            <Phone className="mr-1 h-3.5 w-3.5" /> {trust === "basic" ? "Verify phone number" : "Phone verified"}
          </Button>
          <Button size="sm" variant="outline" onClick={uploadId} disabled={idUploaded}>
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {idUploaded ? "ID uploaded" : "Upload document for admin review"}
          </Button>
          <Button size="sm" onClick={save}>Save profile</Button>
        </div>
      </div>
    </section>
  );
}
