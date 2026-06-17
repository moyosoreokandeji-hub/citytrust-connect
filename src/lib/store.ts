import { useSyncExternalStore } from "react";

export type Role = "resident" | "artisan" | "admin";
export type CheckStatus = "pending" | "under_review" | "verified" | "rejected";
export type VerifyStatus = CheckStatus;
export type Urgency = "low" | "medium" | "high" | "emergency";
export type RequestStatus =
  | "pending"
  | "matched"
  | "accepted"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "disputed";
export type ComplaintStatus = "open" | "investigating" | "resolved" | "escalated";
export type AgreementStatus = "awaiting" | "agreed" | "declined";
export type ResidentTrust = "basic" | "phone_verified" | "verified_resident";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  location_zone: string;
  created_at: string;
  resident_trust?: ResidentTrust;
  id_uploaded?: boolean;
}
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}
export interface VerificationChecks {
  identity: CheckStatus;
  selfie: CheckStatus;
  skill_proof: CheckStatus;
  reference: CheckStatus;
  portfolio: CheckStatus;
  admin_approval: CheckStatus;
}
export interface ReferenceContact {
  name: string;
  phone: string;
  relationship: string;
}
export interface ArtisanProfile {
  id: string;
  user_id: string;
  category_id: string;
  business_name: string;
  bio: string;
  experience_years: number;
  location_zone: string;
  price_range: string;
  availability_status: "available" | "busy" | "offline";
  verification_status: VerifyStatus;
  checks: VerificationChecks;
  response_time_mins: number;
  trust_score: number;
  rating: number;
  completed_jobs: number;
  complaint_count: number;
  reference?: ReferenceContact;
  emergency_contact?: string;
  created_at: string;
}
export interface ScopeAgreement {
  price_estimate: string;
  eta: string;
  materials: string;
  status: AgreementStatus;
  chat_summary?: string;
}
export interface ServiceRequest {
  id: string;
  user_id: string;
  artisan_id: string | null;
  category_id: string;
  issue_description: string;
  urgency: Urgency;
  location_zone: string;
  preferred_time: string;
  status: RequestStatus;
  scope?: ScopeAgreement;
  created_at: string;
}
export interface Review {
  id: string;
  request_id: string;
  user_id: string;
  artisan_id: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}
export interface Complaint {
  id: string;
  request_id: string;
  user_id: string;
  artisan_id: string;
  complaint_text: string;
  status: ComplaintStatus;
  created_at: string;
}
export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  notes: string;
  created_at: string;
}
export interface ChatMessage {
  id: string;
  artisan_id: string;
  resident_id: string;
  sender: "resident" | "artisan";
  text: string;
  created_at: string;
}

export interface DB {
  users: User[];
  categories: ServiceCategory[];
  artisans: ArtisanProfile[];
  requests: ServiceRequest[];
  reviews: Review[];
  complaints: Complaint[];
  actions: AdminAction[];
  messages: ChatMessage[];
  savedArtisanIds: string[];
  currentUserId: string;
  authSessions: { residentUserId?: string; artisanUserId?: string; adminUserId?: string };
}

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const ZONES = ["Phase 1", "Phase 2", "Phase 3", "Central", "Estate Gate"];

function checksFor(status: VerifyStatus): VerificationChecks {
  if (status === "verified")
    return { identity: "verified", selfie: "verified", skill_proof: "verified", reference: "verified", portfolio: "verified", admin_approval: "verified" };
  if (status === "rejected")
    return { identity: "verified", selfie: "verified", skill_proof: "rejected", reference: "pending", portfolio: "pending", admin_approval: "rejected" };
  return { identity: "verified", selfie: "under_review", skill_proof: "under_review", reference: "pending", portfolio: "pending", admin_approval: "pending" };
}

function seed(): DB {
  const cats: ServiceCategory[] = [
    { id: "c1", name: "Plumbing", description: "Pipes, leaks, water systems", icon: "Droplets" },
    { id: "c2", name: "Electrical", description: "Wiring, sockets, lighting", icon: "Zap" },
    { id: "c3", name: "Cleaning", description: "Home & office cleaning", icon: "Wrench" },
    { id: "c4", name: "Carpentry", description: "Wood, furniture, doors", icon: "Hammer" },
    { id: "c5", name: "AC Repair", description: "AC servicing & install", icon: "Wind" },
    { id: "c6", name: "Mechanics", description: "Vehicle repair & service", icon: "Wrench" },
    { id: "c7", name: "General Maintenance", description: "Handyman & repairs", icon: "Settings" },
  ];

  const userResident: User = { id: "u-me", full_name: "Amaka Nwosu", email: "amaka@citytrust.io", phone: "+234 800 000 0001", role: "resident", location_zone: "Phase 2", created_at: now(), resident_trust: "verified_resident", id_uploaded: true };
  const userAdmin: User = { id: "u-admin", full_name: "City Admin", email: "admin@citytrust.io", phone: "+234 800 000 0002", role: "admin", location_zone: "Central", created_at: now() };

  const artisanSeeds = [
    { name: "Samuel Adeyemi", biz: "Adeyemi Plumbing Works", cat: "c1", zone: "Phase 2", ver: "verified", rate: 4.8, trust: 92, jobs: 124, exp: 8, price: "₦5k-₦25k", avail: "available", resp: 18, comp: 1 },
    { name: "Grace Okonkwo", biz: "BrightSpark Electrical", cat: "c2", zone: "Phase 1", ver: "verified", rate: 4.6, trust: 88, jobs: 87, exp: 6, price: "₦4k-₦30k", avail: "available", resp: 22, comp: 2 },
    { name: "Ifeanyi Umeh", biz: "PureShine Cleaners", cat: "c3", zone: "Central", ver: "verified", rate: 4.9, trust: 95, jobs: 210, exp: 5, price: "₦8k-₦40k", avail: "busy", resp: 12, comp: 0 },
    { name: "Tunde Bello", biz: "Bello Carpentry", cat: "c4", zone: "Phase 3", ver: "verified", rate: 4.3, trust: 78, jobs: 64, exp: 10, price: "₦6k-₦50k", avail: "available", resp: 35, comp: 3 },
    { name: "Chioma Eze", biz: "CoolBreeze AC Services", cat: "c5", zone: "Phase 2", ver: "verified", rate: 4.7, trust: 90, jobs: 98, exp: 7, price: "₦7k-₦35k", avail: "available", resp: 20, comp: 1 },
    { name: "Musa Ibrahim", biz: "Ibrahim Auto Mechanics", cat: "c6", zone: "Estate Gate", ver: "pending", rate: 4.1, trust: 65, jobs: 41, exp: 12, price: "₦10k-₦80k", avail: "available", resp: 30, comp: 4 },
    { name: "Daniel Akpan", biz: "FixIt Maintenance", cat: "c7", zone: "Phase 1", ver: "pending", rate: 4.0, trust: 60, jobs: 22, exp: 3, price: "₦3k-₦20k", avail: "available", resp: 45, comp: 2 },
    { name: "Blessing Nwosu", biz: "Nwosu Electric Pro", cat: "c2", zone: "Central", ver: "verified", rate: 4.5, trust: 85, jobs: 73, exp: 5, price: "₦5k-₦28k", avail: "offline", resp: 25, comp: 1 },
    { name: "Peter Onuoha", biz: "AquaFlow Plumbing", cat: "c1", zone: "Phase 3", ver: "pending", rate: 3.9, trust: 55, jobs: 18, exp: 4, price: "₦4k-₦20k", avail: "available", resp: 50, comp: 3 },
  ];

  const users: User[] = [userResident, userAdmin];
  const artisans: ArtisanProfile[] = artisanSeeds.map((a, i) => {
    const u: User = { id: `u-a${i}`, full_name: a.name, email: `${a.name.toLowerCase().replace(/\s/g, ".")}@citytrust.io`, phone: `+234 80${i} 000 ${1000 + i}`, role: "artisan", location_zone: a.zone, created_at: now() };
    users.push(u);
    return {
      id: `a${i}`, user_id: u.id, category_id: a.cat, business_name: a.biz,
      bio: `${a.exp}+ years of trusted ${cats.find((c) => c.id === a.cat)?.name.toLowerCase()} service across Redemption City.`,
      experience_years: a.exp, location_zone: a.zone, price_range: a.price,
      availability_status: a.avail as ArtisanProfile["availability_status"],
      verification_status: a.ver as VerifyStatus,
      checks: checksFor(a.ver as VerifyStatus),
      response_time_mins: a.resp,
      trust_score: a.trust, rating: a.rate, completed_jobs: a.jobs, complaint_count: a.comp,
      reference: { name: `${a.name.split(" ")[0]} Reference`, phone: `+234 81${i} 222 ${3000 + i}`, relationship: "Previous client" },
      emergency_contact: `+234 90${i} 444 ${5000 + i}`,
      created_at: now(),
    };
  });

  const requests: ServiceRequest[] = [
    { id: "r1", user_id: "u-me", artisan_id: "a0", category_id: "c1", issue_description: "Kitchen sink leaking heavily under cabinet.", urgency: "high", location_zone: "Phase 2", preferred_time: "Today, evening", status: "completed", scope: { price_estimate: "₦8k-₦15k", eta: "Within 1 hr", materials: "PVC fittings, sealant", status: "agreed", chat_summary: "Agreed normal-priority leak repair; artisan brings sealant + fittings." }, created_at: now() },
    { id: "r2", user_id: "u-me", artisan_id: "a4", category_id: "c5", issue_description: "AC not cooling, making strange noise.", urgency: "medium", location_zone: "Phase 2", preferred_time: "Tomorrow morning", status: "in_progress", scope: { price_estimate: "₦12k-₦20k", eta: "Tomorrow 9am", materials: "Refrigerant, filter", status: "agreed", chat_summary: "Inspection first, then refill refrigerant + replace filter." }, created_at: now() },
    { id: "r3", user_id: "u-me", artisan_id: "a1", category_id: "c2", issue_description: "Power outage in bedrooms; breaker keeps tripping.", urgency: "emergency", location_zone: "Phase 1", preferred_time: "ASAP", status: "on_the_way", scope: { price_estimate: "₦10k-₦18k", eta: "25 mins", materials: "Breaker, wire", status: "agreed", chat_summary: "Emergency dispatch — artisan on the way with breaker + wire." }, created_at: now() },
    { id: "r4", user_id: "u-me", artisan_id: null, category_id: "c4", issue_description: "Broken wardrobe hinge needs replacement.", urgency: "low", location_zone: "Phase 3", preferred_time: "This weekend", status: "pending", created_at: now() },
    { id: "r5", user_id: "u-me", artisan_id: "a2", category_id: "c3", issue_description: "Deep clean for 3-bedroom apartment.", urgency: "medium", location_zone: "Central", preferred_time: "Saturday", status: "matched", scope: { price_estimate: "₦20k-₦35k", eta: "Saturday 10am", materials: "Cleaning supplies provided", status: "awaiting", chat_summary: "Discussed 3-bedroom deep clean, materials included; awaiting agreement." }, created_at: now() },
  ];

  const reviews: Review[] = [
    { id: "rv1", request_id: "r1", user_id: "u-me", artisan_id: "a0", rating: 5, comment: "Fixed leak in under an hour. Very professional.", verified: true, created_at: now() },
    { id: "rv2", request_id: "r1", user_id: "u-me", artisan_id: "a2", rating: 5, comment: "Spotless work, will book again.", verified: true, created_at: now() },
    { id: "rv3", request_id: "r1", user_id: "u-me", artisan_id: "a4", rating: 4, comment: "Came on time, good service.", verified: true, created_at: now() },
    { id: "rv4", request_id: "r1", user_id: "u-me", artisan_id: "a1", rating: 5, comment: "Excellent electrical work.", verified: true, created_at: now() },
    { id: "rv5", request_id: "r1", user_id: "u-me", artisan_id: "a3", rating: 4, comment: "Great carpentry, fair price.", verified: true, created_at: now() },
  ];

  const complaints: Complaint[] = [
    { id: "cp1", request_id: "r2", user_id: "u-me", artisan_id: "a4", complaint_text: "Technician delayed by 3 hours without notice.", status: "investigating", created_at: now() },
    { id: "cp2", request_id: "r3", user_id: "u-me", artisan_id: "a1", complaint_text: "Issue recurred after 2 days.", status: "open", created_at: now() },
    { id: "cp3", request_id: "r5", user_id: "u-me", artisan_id: "a2", complaint_text: "Price quoted differed from agreed range.", status: "resolved", created_at: now() },
  ];

  const baseTime = Date.now() - 1000 * 60 * 60 * 2;
  const mkTime = (minOffset: number) => new Date(baseTime + 1000 * 60 * minOffset).toISOString();
  const messages: ChatMessage[] = [
    // Conversation with a0 — Samuel Adeyemi (Plumbing)
    { id: "m1", artisan_id: "a0", resident_id: "u-me", sender: "resident", text: "Hi Samuel, are you available today? Kitchen sink is leaking heavily.", created_at: mkTime(0) },
    { id: "m2", artisan_id: "a0", resident_id: "u-me", sender: "artisan", text: "Hello! Yes, I can be there in about 40 minutes. Can you share a photo or describe the leak?", created_at: mkTime(4) },
    { id: "m3", artisan_id: "a0", resident_id: "u-me", sender: "resident", text: "Water is dripping from under the cabinet, around the trap. What's your estimated price range?", created_at: mkTime(6) },
    { id: "m4", artisan_id: "a0", resident_id: "u-me", sender: "artisan", text: "Sounds like a worn trap or fitting. Range is ₦8k-₦15k including PVC fittings and sealant. I'll bring materials.", created_at: mkTime(8) },
    { id: "m5", artisan_id: "a0", resident_id: "u-me", sender: "resident", text: "Great, please confirm scope on CityTrust so we proceed.", created_at: mkTime(10) },

    // Conversation with a4 — Chioma Eze (AC Repair)
    { id: "m6", artisan_id: "a4", resident_id: "u-me", sender: "resident", text: "Hi Chioma, my AC isn't cooling and there's a strange noise. Are you available for inspection?", created_at: mkTime(15) },
    { id: "m7", artisan_id: "a4", resident_id: "u-me", sender: "artisan", text: "Good afternoon! Yes, I have a slot tomorrow morning. Is it a split or window unit?", created_at: mkTime(18) },
    { id: "m8", artisan_id: "a4", resident_id: "u-me", sender: "resident", text: "It's a split unit in the living room. About 2 years old.", created_at: mkTime(22) },
    { id: "m9", artisan_id: "a4", resident_id: "u-me", sender: "artisan", text: "Most likely low refrigerant or a dirty filter. I'll inspect first, then refill and replace the filter if needed. Estimate is ₦12k-₦20k.", created_at: mkTime(25) },
    { id: "m10", artisan_id: "a4", resident_id: "u-me", sender: "resident", text: "That works. Can you come by 9am?", created_at: mkTime(30) },
    { id: "m11", artisan_id: "a4", resident_id: "u-me", sender: "artisan", text: "Confirmed for 9am tomorrow. I'll send the scope agreement on CityTrust shortly.", created_at: mkTime(32) },

    // Conversation with a1 — Grace Okonkwo (Electrical, emergency)
    { id: "m12", artisan_id: "a1", resident_id: "u-me", sender: "resident", text: "Grace, this is urgent — power just went out in all bedrooms and the breaker keeps tripping. Can you come now?", created_at: mkTime(40) },
    { id: "m13", artisan_id: "a1", resident_id: "u-me", sender: "artisan", text: "Emergency noted. I'm heading out now — ETA 25 minutes. Please don't touch the panel.", created_at: mkTime(42) },
    { id: "m14", artisan_id: "a1", resident_id: "u-me", sender: "resident", text: "Thank you, I'll wait. Do you think it's the breaker or wiring?", created_at: mkTime(45) },
    { id: "m15", artisan_id: "a1", resident_id: "u-me", sender: "artisan", text: "Hard to say until I inspect. I'll bring a replacement breaker and wire just in case. Estimate ₦10k-₦18k.", created_at: mkTime(48) },
    { id: "m16", artisan_id: "a1", resident_id: "u-me", sender: "resident", text: "Okay, please proceed. I've confirmed the emergency scope on CityTrust.", created_at: mkTime(52) },

    // Conversation with a2 — Ifeanyi Umeh (Cleaning)
    { id: "m17", artisan_id: "a2", resident_id: "u-me", sender: "resident", text: "Hi Ifeanyi, I need a deep clean for a 3-bedroom apartment in Central. Are you free this Saturday?", created_at: mkTime(60) },
    { id: "m18", artisan_id: "a2", resident_id: "u-me", sender: "artisan", text: "Hello! Saturday works. We bring all supplies and equipment. Is it a post-construction or regular deep clean?", created_at: mkTime(65) },
    { id: "m19", artisan_id: "a2", resident_id: "u-me", sender: "resident", text: "Regular deep clean. Kitchen, bathrooms, and living room need extra attention.", created_at: mkTime(70) },
    { id: "m20", artisan_id: "a2", resident_id: "u-me", sender: "artisan", text: "Noted. Quote is ₦20k-₦35k for a full 3-bedroom deep clean. We'll start at 10am and finish by 3pm.", created_at: mkTime(75) },
    { id: "m21", artisan_id: "a2", resident_id: "u-me", sender: "resident", text: "Perfect. Please send the scope agreement so I can confirm.", created_at: mkTime(80) },
  ];

  return { users, categories: cats, artisans, requests, reviews, complaints, actions: [], messages, savedArtisanIds: ["a0", "a2", "a4"], currentUserId: "u-me", authSessions: {} };
}

const KEY = "citytrust:db:v11";
let state: DB = (() => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, authSessions: parsed.authSessions ?? {} };
    }
  } catch {}
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
})();

const listeners = new Set<() => void>();
function emit() {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  listeners.forEach((l) => l());
}

function recomputeTrust(a: ArtisanProfile): number {
  let t = 35;
  if (a.checks.identity === "verified") t += 10;
  if (a.checks.selfie === "verified") t += 6;
  if (a.checks.skill_proof === "verified") t += 10;
  if (a.checks.reference === "verified") t += 8;
  if (a.checks.portfolio === "verified") t += 6;
  if (a.checks.admin_approval === "verified") t += 10;
  if (a.rating >= 4.5) t += 8; else if (a.rating >= 4) t += 4;
  if (a.completed_jobs >= 100) t += 6; else if (a.completed_jobs >= 30) t += 3;
  if (a.response_time_mins <= 20) t += 4;
  t -= Math.min(15, a.complaint_count * 4);
  return Math.max(0, Math.min(100, t));
}

function sessionKeyFor(role: Role): keyof DB["authSessions"] {
  if (role === "resident") return "residentUserId";
  if (role === "artisan") return "artisanUserId";
  return "adminUserId";
}

function nextActiveUserId(authSessions: DB["authSessions"]): string {
  return authSessions.residentUserId ?? authSessions.artisanUserId ?? authSessions.adminUserId ?? "u-me";
}

export const store = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  reset: () => { state = seed(); emit(); },
  setCurrentUser: (id: string) => { state = { ...state, currentUserId: id }; emit(); },
  getSignedInUserId: (role: Role) => state.authSessions?.[sessionKeyFor(role)] ?? null,
  isSignedIn: (role: Role) => Boolean(state.authSessions?.[sessionKeyFor(role)]),
  logout: (role: Role) => {
    const key = sessionKeyFor(role);
    const authSessions = { ...(state.authSessions ?? {}), [key]: undefined };
    state = { ...state, authSessions, currentUserId: nextActiveUserId(authSessions) };
    emit();
  },
  signIn: (email: string, role: Role) => {
    const user = state.users.find((u) => u.role === role && u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return null;
    state = { ...state, currentUserId: user.id, authSessions: { ...(state.authSessions ?? {}), [sessionKeyFor(role)]: user.id } };
    emit();
    return user;
  },
  createResident: (input: { full_name: string; email: string; phone: string; location_zone: string }) => {
    const existing = state.users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) {
      state = { ...state, currentUserId: existing.id, authSessions: { ...(state.authSessions ?? {}), residentUserId: existing.id } };
      emit();
      return existing;
    }
    const user: User = {
      id: "u-" + uid(),
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      role: "resident",
      location_zone: input.location_zone,
      resident_trust: "phone_verified",
      id_uploaded: false,
      created_at: now(),
    };
    state = { ...state, users: [...state.users, user], currentUserId: user.id, authSessions: { ...(state.authSessions ?? {}), residentUserId: user.id } };
    emit();
    return user;
  },
  createRequest: (req: Omit<ServiceRequest, "id" | "created_at" | "status" | "artisan_id"> & { artisan_id?: string | null }) => {
    const r: ServiceRequest = {
      ...req, id: uid(), artisan_id: req.artisan_id ?? null,
      status: req.artisan_id ? "matched" : "pending",
      scope: req.artisan_id ? { price_estimate: "TBD", eta: req.preferred_time, materials: "TBD", status: "awaiting" } : undefined,
      created_at: now(),
    };
    state = { ...state, requests: [r, ...state.requests] };
    emit();
    return r;
  },
  updateRequestStatus: (id: string, status: RequestStatus) => {
    state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) };
    emit();
  },
  setScopeAgreement: (id: string, status: AgreementStatus) => {
    state = { ...state, requests: state.requests.map((r) => r.id === id && r.scope ? { ...r, scope: { ...r.scope, status }, status: status === "agreed" ? "accepted" : r.status } : r) };
    emit();
  },
  requestScopeUpdate: (id: string) => {
    state = { ...state, requests: state.requests.map((r) => r.id === id && r.scope ? { ...r, scope: { ...r.scope, status: "awaiting" } } : r) };
    emit();
  },
  assignArtisan: (id: string, artisanId: string) => {
    state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, artisan_id: artisanId, status: "matched" } : r)) };
    emit();
  },
  addReview: (r: Omit<Review, "id" | "created_at" | "verified">) => {
    const req = state.requests.find((x) => x.id === r.request_id);
    const verified = !!req && (req.status === "completed" || req.status === "reviewed");
    const rv: Review = { ...r, id: uid(), verified, created_at: now() };
    const artisans = state.artisans.map((a) => {
      if (a.id !== r.artisan_id) return a;
      const arvs = [...state.reviews.filter((x) => x.artisan_id === a.id), rv];
      const avg = arvs.reduce((s, x) => s + x.rating, 0) / arvs.length;
      const next = { ...a, rating: Math.round(avg * 10) / 10, completed_jobs: a.completed_jobs + 1 };
      return { ...next, trust_score: recomputeTrust(next) };
    });
    state = { ...state, reviews: [rv, ...state.reviews], artisans, requests: state.requests.map((req) => (req.id === r.request_id ? { ...req, status: "reviewed" } : req)) };
    emit();
  },
  addComplaint: (c: Omit<Complaint, "id" | "created_at" | "status">) => {
    const cp: Complaint = { ...c, id: uid(), status: "open", created_at: now() };
    const artisans = state.artisans.map((a) => {
      if (a.id !== c.artisan_id) return a;
      const next = { ...a, complaint_count: a.complaint_count + 1 };
      return { ...next, trust_score: recomputeTrust(next) };
    });
    state = { ...state, complaints: [cp, ...state.complaints], artisans, requests: state.requests.map((r) => (r.id === c.request_id ? { ...r, status: "disputed" } : r)) };
    emit();
  },
  setComplaintStatus: (id: string, status: ComplaintStatus) => {
    state = { ...state, complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)) };
    emit();
  },
  setVerification: (artisanId: string, status: VerifyStatus, notes = "") => {
    state = {
      ...state,
      artisans: state.artisans.map((a) => {
        if (a.id !== artisanId) return a;
        const checks = checksFor(status);
        const next = { ...a, verification_status: status, checks };
        return { ...next, trust_score: recomputeTrust(next) };
      }),
      actions: [{ id: uid(), admin_id: "u-admin", action_type: `verification_${status}`, target_id: artisanId, notes, created_at: now() }, ...state.actions],
    };
    emit();
  },
  requestMoreInfo: (artisanId: string, notes = "") => {
    state = {
      ...state,
      artisans: state.artisans.map((a) => {
        if (a.id !== artisanId) return a;
        return { ...a, verification_status: "under_review", checks: { ...a.checks, admin_approval: "under_review" } };
      }),
      actions: [{ id: uid(), admin_id: "u-admin", action_type: "verification_more_info", target_id: artisanId, notes, created_at: now() }, ...state.actions],
    };
    emit();
  },
  updateCheck: (artisanId: string, field: keyof VerificationChecks, value: CheckStatus) => {
    state = {
      ...state,
      artisans: state.artisans.map((a) => {
        if (a.id !== artisanId) return a;
        const checks = { ...a.checks, [field]: value };
        const allVerified = Object.values(checks).every((v) => v === "verified");
        const next = { ...a, checks, verification_status: allVerified ? ("verified" as VerifyStatus) : a.verification_status };
        return { ...next, trust_score: recomputeTrust(next) };
      }),
    };
    emit();
  },
  createArtisan: (input: { full_name: string; email: string; phone: string; category_id: string; business_name: string; bio: string; experience_years: number; location_zone: string; price_range: string; reference?: ReferenceContact; emergency_contact?: string; uploads?: Partial<Record<keyof VerificationChecks, boolean>> }) => {
    const userId = "u-" + uid();
    const user: User = { id: userId, full_name: input.full_name, email: input.email, phone: input.phone, role: "artisan", location_zone: input.location_zone, created_at: now() };
    const up = input.uploads ?? {};
    const checks: VerificationChecks = {
      identity: up.identity ? "under_review" : "pending",
      selfie: up.selfie ? "under_review" : "pending",
      skill_proof: up.skill_proof ? "under_review" : "pending",
      portfolio: up.portfolio ? "under_review" : "pending",
      reference: input.reference?.name ? "under_review" : "pending",
      admin_approval: "pending",
    };
    const a: ArtisanProfile = {
      id: "a-" + uid(), user_id: userId, category_id: input.category_id, business_name: input.business_name, bio: input.bio,
      experience_years: input.experience_years, location_zone: input.location_zone, price_range: input.price_range,
      availability_status: "available", verification_status: "under_review",
      checks,
      response_time_mins: 60, trust_score: 50, rating: 0, completed_jobs: 0, complaint_count: 0,
      reference: input.reference, emergency_contact: input.emergency_contact,
      created_at: now(),
    };
    state = { ...state, users: [...state.users, user], artisans: [...state.artisans, a], currentUserId: userId, authSessions: { ...(state.authSessions ?? {}), artisanUserId: userId } };
    emit();
    return a;
  },
  updateUser: (userId: string, patch: Partial<Pick<User, "full_name" | "email" | "phone" | "location_zone">>) => {
    state = {
      ...state,
      users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    };
    emit();
  },
  updateArtisan: (artisanId: string, patch: Partial<Pick<ArtisanProfile, "business_name" | "bio" | "experience_years" | "location_zone" | "price_range" | "availability_status" | "category_id" | "reference" | "emergency_contact" | "response_time_mins">>) => {
    state = {
      ...state,
      artisans: state.artisans.map((a) => {
        if (a.id !== artisanId) return a;
        const next = { ...a, ...patch };
        return { ...next, trust_score: recomputeTrust(next) };
      }),
    };
    emit();
  },
  addCategory: (name: string, description: string) => {
    const c: ServiceCategory = { id: "c-" + uid(), name, description, icon: "Settings" };
    state = { ...state, categories: [...state.categories, c] };
    emit();
  },
  sendMessage: (artisan_id: string, resident_id: string, sender: "resident" | "artisan", text: string) => {
    const m: ChatMessage = { id: uid(), artisan_id, resident_id, sender, text, created_at: now() };
    state = { ...state, messages: [...state.messages, m] };
    emit();
    return m;
  },
  setResidentTrust: (userId: string, trust: ResidentTrust, opts?: { id_uploaded?: boolean; full_name?: string; email?: string; phone?: string; location_zone?: string }) => {
    state = {
      ...state,
      users: state.users.map((u) => u.id === userId ? { ...u, resident_trust: trust, ...(opts?.id_uploaded !== undefined ? { id_uploaded: opts.id_uploaded } : {}), ...(opts?.full_name ? { full_name: opts.full_name } : {}), ...(opts?.email ? { email: opts.email } : {}), ...(opts?.phone ? { phone: opts.phone } : {}), ...(opts?.location_zone ? { location_zone: opts.location_zone } : {}) } : u),
    };
    emit();
  },
  toggleSaved: (artisanId: string) => {
    const has = state.savedArtisanIds.includes(artisanId);
    state = { ...state, savedArtisanIds: has ? state.savedArtisanIds.filter((x) => x !== artisanId) : [...state.savedArtisanIds, artisanId] };
    emit();
  },
};

export function useDB() {
  return useSyncExternalStore(store.subscribe, () => store.get(), () => state);
}

export interface TrustFactor { label: string; positive: boolean; value: string }
export function trustBreakdown(a: ArtisanProfile): TrustFactor[] {
  const f: TrustFactor[] = [];
  f.push({ label: "Identity verified", positive: a.checks.identity === "verified", value: a.checks.identity });
  f.push({ label: "Selfie verified", positive: a.checks.selfie === "verified", value: a.checks.selfie });
  f.push({ label: "Skill proof submitted", positive: a.checks.skill_proof === "verified", value: a.checks.skill_proof });
  f.push({ label: "Reference check", positive: a.checks.reference === "verified", value: a.checks.reference });
  f.push({ label: "Portfolio reviewed", positive: a.checks.portfolio === "verified", value: a.checks.portfolio });
  f.push({ label: "Admin approval", positive: a.checks.admin_approval === "verified", value: a.checks.admin_approval });
  f.push({ label: "High rating", positive: a.rating >= 4.5, value: `${a.rating.toFixed(1)} ★` });
  f.push({ label: "Completed jobs", positive: a.completed_jobs >= 30, value: `${a.completed_jobs}` });
  f.push({ label: "Fast response", positive: a.response_time_mins <= 25, value: `${a.response_time_mins} mins` });
  f.push({ label: "Low complaint rate", positive: a.complaint_count <= 1, value: `${a.complaint_count} complaints` });
  return f;
}

// Matching score (rule-based)
export function scoreArtisan(a: ArtisanProfile, ctx: { category_id: string; location_zone: string; urgency?: Urgency }): { score: number; reasons: string[] } {
  let s = 0;
  const reasons: string[] = [];
  if (a.verification_status === "verified") { s += 30; reasons.push("verified"); }
  if (a.category_id === ctx.category_id) { s += 25; reasons.push("matches your category"); }
  if (a.location_zone === ctx.location_zone) { s += 15; reasons.push("close to your zone"); }
  if (a.availability_status === "available") { s += 10; reasons.push("currently available"); }
  if (a.rating > 4) { s += 10; reasons.push("highly rated"); }
  if (a.trust_score > 80) { s += 10; reasons.push("high trust score"); }
  if (ctx.urgency === "emergency" && a.response_time_mins <= 25) { s += 10; reasons.push("fast emergency response"); }
  return { score: s, reasons };
}

export function rankArtisans(db: DB, ctx: { category_id: string; location_zone: string; urgency?: Urgency }) {
  return db.artisans.map((a) => ({ artisan: a, ...scoreArtisan(a, ctx) })).sort((x, y) => y.score - x.score);
}

export const ZONES_LIST = ZONES;

export const QUICK_MESSAGES = [
  "Are you available today?",
  "Can you inspect this issue first?",
  "What is your estimated price range?",
  "How soon can you arrive?",
  "Do you bring materials?",
];

export const QUICK_REPLIES_ARTISAN = [
  "I can come in 2-3 hours.",
  "What's the exact issue?",
  "I'll bring all materials.",
  "Estimate confirmed — please agree scope on CityTrust.",
  "On my way now.",
];

