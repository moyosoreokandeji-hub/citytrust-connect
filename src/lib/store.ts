import { useSyncExternalStore } from "react";

export type Role = "resident" | "artisan" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";
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
  password?: string;
  role: Role;
  location_zone: string;
  created_at: string;
  resident_trust?: ResidentTrust;
  id_uploaded?: boolean;
  status?: AccountStatus;
}
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  price_min?: string;
  price_max?: string;
  price_note?: string;
}
export interface VerificationChecks {
  identity: CheckStatus;
  selfie: CheckStatus;
  skill_proof: CheckStatus;
  reference: CheckStatus;
  portfolio: CheckStatus;
  admin_approval: CheckStatus;
}
export interface VerificationDocument {
  key: keyof VerificationChecks;
  label: string;
  file_name: string;
  file_type: string;
  preview_url?: string;
  uploaded_at: string;
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
  profile_image?: string;
  bio: string;
  experience_years: number;
  location_zone: string;
  price_range: string;
  availability_status: "available" | "busy" | "offline";
  verification_status: VerifyStatus;
  checks: VerificationChecks;
  verification_documents?: VerificationDocument[];
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
  image_url?: string;
  audio_url?: string;
  audio_duration_secs?: number;
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

const LEGACY_DEMO_RESIDENT_IDS = new Set(["u-me"]);
const LEGACY_DEMO_ARTISAN_ID_PATTERN = /^a\d+$/;
const LEGACY_DEMO_ARTISAN_USER_ID_PATTERN = /^u-a\d+$/;

function isLegacyDemoArtisan(artisan: Pick<ArtisanProfile, "id" | "user_id">) {
  return LEGACY_DEMO_ARTISAN_ID_PATTERN.test(artisan.id) || LEGACY_DEMO_ARTISAN_USER_ID_PATTERN.test(artisan.user_id);
}

function isLegacyDemoUser(user: Pick<User, "id">) {
  return LEGACY_DEMO_RESIDENT_IDS.has(user.id) || LEGACY_DEMO_ARTISAN_USER_ID_PATTERN.test(user.id);
}

function removeLegacyDemoData(db: DB): DB {
  const runtimeArtisans = (db.artisans ?? []).filter((artisan) => !isLegacyDemoArtisan(artisan));
  const runtimeArtisanIds = new Set(runtimeArtisans.map((artisan) => artisan.id));
  const runtimeUserIds = new Set((db.users ?? []).filter((user) => !isLegacyDemoUser(user)).map((user) => user.id));

  const cleanAuthSessions = {
    residentUserId: db.authSessions?.residentUserId && runtimeUserIds.has(db.authSessions.residentUserId) ? db.authSessions.residentUserId : undefined,
    artisanUserId: db.authSessions?.artisanUserId && runtimeUserIds.has(db.authSessions.artisanUserId) ? db.authSessions.artisanUserId : undefined,
    adminUserId: db.authSessions?.adminUserId && runtimeUserIds.has(db.authSessions.adminUserId) ? db.authSessions.adminUserId : undefined,
  };

  const currentUserId = db.currentUserId && runtimeUserIds.has(db.currentUserId) ? db.currentUserId : nextActiveUserId(cleanAuthSessions);

  return {
    ...db,
    users: (db.users ?? []).filter((user) => !isLegacyDemoUser(user)),
    artisans: runtimeArtisans,
    requests: (db.requests ?? []).filter((request) => {
      const validResident = runtimeUserIds.has(request.user_id);
      const validArtisan = !request.artisan_id || runtimeArtisanIds.has(request.artisan_id);
      return validResident && validArtisan;
    }),
    reviews: (db.reviews ?? []).filter((review) => runtimeUserIds.has(review.user_id) && runtimeArtisanIds.has(review.artisan_id)),
    complaints: (db.complaints ?? []).filter((complaint) => runtimeUserIds.has(complaint.user_id) && runtimeArtisanIds.has(complaint.artisan_id)),
    messages: (db.messages ?? []).filter((message) => runtimeUserIds.has(message.resident_id) && runtimeArtisanIds.has(message.artisan_id)),
    savedArtisanIds: (db.savedArtisanIds ?? []).filter((artisanId) => runtimeArtisanIds.has(artisanId)),
    currentUserId,
    authSessions: cleanAuthSessions,
  };
}

function checksFor(status: VerifyStatus): VerificationChecks {
  if (status === "verified")
    return { identity: "verified", selfie: "verified", skill_proof: "verified", reference: "verified", portfolio: "verified", admin_approval: "verified" };
  if (status === "rejected")
    return { identity: "verified", selfie: "verified", skill_proof: "rejected", reference: "pending", portfolio: "pending", admin_approval: "rejected" };
  return { identity: "verified", selfie: "under_review", skill_proof: "under_review", reference: "pending", portfolio: "pending", admin_approval: "pending" };
}

function seed(): DB {
  const cats: ServiceCategory[] = [
    { id: "c1", name: "Plumbing", price_min: "₦5k", price_max: "₦25k", price_note: "Leaks and small fittings vary by materials.", description: "Pipes, leaks, water systems", icon: "Droplets" },
    { id: "c2", name: "Electrical", price_min: "₦7k", price_max: "₦30k", price_note: "Final cost depends on fault tracing and replacement parts.", description: "Wiring, sockets, lighting", icon: "Zap" },
    { id: "c3", name: "Cleaning", price_min: "₦10k", price_max: "₦45k", price_note: "Range depends on room count and cleaning depth.", description: "Home & office cleaning", icon: "Wrench" },
    { id: "c4", name: "Carpentry", price_min: "₦8k", price_max: "₦60k", price_note: "Range depends on wood, repair size and fittings.", description: "Wood, furniture, doors", icon: "Hammer" },
    { id: "c5", name: "AC Repair", price_min: "₦12k", price_max: "₦55k", price_note: "Inspection, gas refill and parts affect final scope.", description: "AC servicing & install", icon: "Wind" },
    { id: "c6", name: "Mechanics", price_min: "₦10k", price_max: "₦80k", price_note: "Range depends on vehicle issue and parts.", description: "Vehicle repair & service", icon: "Wrench" },
    { id: "c7", name: "General Maintenance", price_min: "₦5k", price_max: "₦35k", price_note: "Small repairs vary by tools and materials.", description: "Handyman & repairs", icon: "Settings" },
  ];

  const userResident: User = { id: "u-me", full_name: "Amaka Nwosu", email: "amaka@citytrust.io", phone: "+234 800 000 0001", password: "citytrust2026", role: "resident", location_zone: "Phase 2", created_at: now(), resident_trust: "verified_resident", id_uploaded: true };
  const userAdmin: User = { id: "u-admin", full_name: "City Admin", email: "admin@citytrust.io", phone: "+234 800 000 0002", password: "citytrust-access", status: "active", role: "admin", location_zone: "Central", created_at: now() };

  const artisanSeeds: Array<{ name: string; biz: string; cat: string; zone: string; ver: string; rate: number; trust: number; jobs: number; exp: number; price: string; avail: string; resp: number; comp: number }> = [];

  const users: User[] = [userAdmin];
  const artisans: ArtisanProfile[] = artisanSeeds.map((a, i) => {
    const u: User = { id: `u-a${i}`, full_name: a.name, email: `${a.name.toLowerCase().replace(/\s/g, ".")}@citytrust.io`, phone: `+234 80${i} 000 ${1000 + i}`, password: "citytrust2026", role: "artisan", location_zone: a.zone, created_at: now() };
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

  const messages: ChatMessage[] = [];


  return { users, categories: cats, artisans, requests: [], reviews: [], complaints: [], actions: [], messages, savedArtisanIds: [], currentUserId: "", authSessions: {} };
}


function createDirectoryProfileForUser(user: User, db: DB): ArtisanProfile {
  const fallbackCategory = db.categories[0]?.id ?? "c1";
  return {
    id: `a-profile-${user.id.replace(/^u-/, "")}`,
    user_id: user.id,
    category_id: fallbackCategory,
    business_name: `${user.full_name} Services`,
    bio: "Newly onboarded CityTrust artisan. Service details are being completed and reviewed by admin.",
    experience_years: 1,
    location_zone: user.location_zone || "Phase 1",
    price_range: "To be agreed",
    availability_status: "available",
    verification_status: "under_review",
    checks: {
      identity: "under_review",
      selfie: "under_review",
      skill_proof: "pending",
      reference: "pending",
      portfolio: "pending",
      admin_approval: "pending",
    },
    verification_documents: [],
    response_time_mins: 60,
    trust_score: 50,
    rating: 0,
    completed_jobs: 0,
    complaint_count: 0,
    created_at: user.created_at || now(),
  };
}

function ensureArtisanProfilesInState(db: DB): DB {
  const existingUserIds = new Set(db.artisans.map((artisan) => artisan.user_id));
  const missingProfiles = db.users
    .filter((user) => user.role === "artisan" && !existingUserIds.has(user.id))
    .map((user) => createDirectoryProfileForUser(user, db));

  const withProfiles = missingProfiles.length === 0 ? db : { ...db, artisans: [...db.artisans, ...missingProfiles] };
  return mergeArtisanDirectory(withProfiles);
}

function normalizeDB(parsed: any): DB {
  const base = removeLegacyDemoData({
    ...parsed,
    users: parsed.users ?? [],
    categories: parsed.categories ?? [],
    artisans: parsed.artisans ?? [],
    requests: parsed.requests ?? [],
    reviews: parsed.reviews ?? [],
    complaints: parsed.complaints ?? [],
    actions: parsed.actions ?? [],
    messages: parsed.messages ?? [],
    savedArtisanIds: parsed.savedArtisanIds ?? [],
    currentUserId: parsed.currentUserId ?? "",
    authSessions: parsed.authSessions ?? {},
  });
  return ensureArtisanProfilesInState(mergeRuntimeRecordsFromStorage(base));
}

const KEY = "citytrust:db:finale-v23";
const DIRECTORY_KEY = "citytrust:artisan-directory:finale-v23";
const RUNTIME_USERS_KEY = "citytrust:runtime-users";
const RUNTIME_ARTISANS_KEY = "citytrust:runtime-artisans";

function isRuntimeArtisan(a: ArtisanProfile): boolean {
  return a.id.startsWith("a-") || a.id.startsWith("a-profile-");
}

function readStorageArray<T = any>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const records: T[] = [];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) records.push(...parsed);
    } catch {}
  }
  return records;
}

function writeStorageArray<T extends { id: string }>(key: string, nextItems: T[]) {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Map(nextItems.map((item) => [item.id, item])).values());
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try { storage.setItem(key, JSON.stringify(unique)); } catch {}
  }
}

function persistRuntimeUser(user: User) {
  if (typeof window === "undefined" || isLegacyDemoUser(user)) return;
  const current = readStorageArray<User>(RUNTIME_USERS_KEY).filter((item) => item.id !== user.id);
  writeStorageArray(RUNTIME_USERS_KEY, [user, ...current]);
}

function persistRuntimeArtisan(artisan: ArtisanProfile) {
  if (typeof window === "undefined" || isLegacyDemoArtisan(artisan)) return;
  const current = readStorageArray<ArtisanProfile>(RUNTIME_ARTISANS_KEY).filter((item) => item.id !== artisan.id);
  writeStorageArray(RUNTIME_ARTISANS_KEY, [artisan, ...current]);
}

function mergeDBRecords(base: DB, incoming: DB): DB {
  const users = new Map<string, User>();
  for (const user of [...(base.users ?? []), ...(incoming.users ?? [])]) {
    if (!isLegacyDemoUser(user)) users.set(user.id, { ...(users.get(user.id) ?? user), ...user });
  }

  const artisans = new Map<string, ArtisanProfile>();
  for (const artisan of [...(base.artisans ?? []), ...(incoming.artisans ?? [])]) {
    if (isLegacyDemoArtisan(artisan)) continue;
    const existing = artisans.get(artisan.id);
    artisans.set(artisan.id, {
      ...(existing ?? artisan),
      ...artisan,
      profile_image: artisan.profile_image || existing?.profile_image || "",
      verification_documents: artisan.verification_documents?.length ? artisan.verification_documents : existing?.verification_documents ?? [],
    });
  }

  const requests = new Map<string, ServiceRequest>();
  for (const request of [...(base.requests ?? []), ...(incoming.requests ?? [])]) requests.set(request.id, { ...(requests.get(request.id) ?? request), ...request });

  const reviews = new Map<string, Review>();
  for (const review of [...(base.reviews ?? []), ...(incoming.reviews ?? [])]) reviews.set(review.id, { ...(reviews.get(review.id) ?? review), ...review });

  const complaints = new Map<string, Complaint>();
  for (const complaint of [...(base.complaints ?? []), ...(incoming.complaints ?? [])]) complaints.set(complaint.id, { ...(complaints.get(complaint.id) ?? complaint), ...complaint });

  const actions = new Map<string, AdminAction>();
  for (const action of [...(base.actions ?? []), ...(incoming.actions ?? [])]) actions.set(action.id, { ...(actions.get(action.id) ?? action), ...action });

  const messages = new Map<string, ChatMessage>();
  for (const message of [...(base.messages ?? []), ...(incoming.messages ?? [])]) messages.set(message.id, { ...(messages.get(message.id) ?? message), ...message });

  const authSessions = {
    ...(base.authSessions ?? {}),
    ...(incoming.authSessions ?? {}),
  };

  const savedArtisanIds = Array.from(new Set([...(base.savedArtisanIds ?? []), ...(incoming.savedArtisanIds ?? [])]));

  return {
    ...base,
    ...incoming,
    categories: incoming.categories?.length ? incoming.categories : base.categories,
    users: Array.from(users.values()),
    artisans: Array.from(artisans.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    requests: Array.from(requests.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    reviews: Array.from(reviews.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    complaints: Array.from(complaints.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    actions: Array.from(actions.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    messages: Array.from(messages.values()).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    savedArtisanIds,
    authSessions,
    currentUserId: incoming.currentUserId || base.currentUserId || nextActiveUserId(authSessions),
  };
}

function readArtisanDirectory(): ArtisanProfile[] {
  if (typeof window === "undefined") return [];
  const directoryItems = readStorageArray<ArtisanProfile>(DIRECTORY_KEY);
  const runtimeItems = readStorageArray<ArtisanProfile>(RUNTIME_ARTISANS_KEY);
  return [...directoryItems, ...runtimeItems].filter((artisan) => artisan && !isLegacyDemoArtisan(artisan));
}

function writeArtisanDirectory(artisans: ArtisanProfile[]) {
  if (typeof window === "undefined") return;
  try {
    const cleanArtisans = artisans.filter((artisan) => !isLegacyDemoArtisan(artisan));
    const unique = Array.from(
      new Map(cleanArtisans.map((artisan) => [artisan.id, artisan])).values(),
    ).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    writeStorageArray(DIRECTORY_KEY, unique);
    window.dispatchEvent(new Event("citytrust-directory-sync"));
  } catch {}
}

function upsertDirectoryArtisan(artisan: ArtisanProfile) {
  if (typeof window === "undefined") return;
  const current = readArtisanDirectory();
  const exists = current.some((item) => item.id === artisan.id);
  writeArtisanDirectory(exists ? current.map((item) => (item.id === artisan.id ? artisan : item)) : [artisan, ...current]);
}

function mergeArtisanDirectory(db: DB): DB {
  const directory = readArtisanDirectory();
  if (directory.length === 0) return db;

  const byId = new Map(db.artisans.map((artisan) => [artisan.id, artisan]));
  const byUserId = new Map(db.artisans.map((artisan) => [artisan.user_id, artisan]));

  for (const artisan of directory) {
    const existingById = byId.get(artisan.id);
    const existingByUser = byUserId.get(artisan.user_id);
    if (existingById) {
      byId.set(artisan.id, {
        ...existingById,
        ...artisan,
        profile_image: artisan.profile_image || existingById.profile_image || "",
        verification_documents: artisan.verification_documents?.length ? artisan.verification_documents : existingById.verification_documents ?? [],
      });
    } else if (existingByUser) {
      byId.set(existingByUser.id, {
        ...existingByUser,
        ...artisan,
        id: existingByUser.id,
        profile_image: artisan.profile_image || existingByUser.profile_image || "",
        verification_documents: artisan.verification_documents?.length ? artisan.verification_documents : existingByUser.verification_documents ?? [],
      });
    } else {
      byId.set(artisan.id, artisan);
    }
  }

  return {
    ...db,
    artisans: Array.from(byId.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
  };
}

function getAllCityTrustStorageKeys(prefix: string): string[] {
  if (typeof window === "undefined") return [];
  const keys = new Set<string>();
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key?.startsWith(prefix)) keys.add(key);
      }
    } catch {}
  }
  return Array.from(keys);
}

function mergeRuntimeRecordsFromStorage(db: DB): DB {
  if (typeof window === "undefined") return db;

  const userMap = new Map<string, User>((db.users ?? []).map((user) => [user.id, user]));
  const artisanMap = new Map<string, ArtisanProfile>((db.artisans ?? []).map((artisan) => [artisan.id, artisan]));

  function addUser(user: any) {
    if (!user || typeof user.id !== "string" || isLegacyDemoUser(user)) return;
    if (user.role !== "resident" && user.role !== "artisan" && user.role !== "admin") return;
    const cleanUser: User = {
      id: user.id,
      full_name: user.full_name ?? "CityTrust User",
      email: user.email ?? "",
      phone: user.phone ?? "",
      password: user.password ?? (user.role === "admin" ? "citytrust-access" : "citytrust2026"),
      role: user.role,
      location_zone: user.location_zone ?? "Phase 1",
      created_at: user.created_at ?? now(),
      ...(user.resident_trust ? { resident_trust: user.resident_trust } : {}),
      ...(user.id_uploaded !== undefined ? { id_uploaded: Boolean(user.id_uploaded) } : {}),
    };
    userMap.set(cleanUser.id, { ...(userMap.get(cleanUser.id) ?? cleanUser), ...cleanUser });
  }

  function addArtisan(artisan: any) {
    if (!artisan || typeof artisan.id !== "string" || isLegacyDemoArtisan(artisan)) return;
    if (!artisan.user_id) return;
    const cleanArtisan: ArtisanProfile = {
      id: artisan.id,
      user_id: artisan.user_id,
      category_id: artisan.category_id ?? db.categories[0]?.id ?? "c1",
      business_name: artisan.business_name ?? "New CityTrust Artisan",
      profile_image: artisan.profile_image ?? "",
      bio: artisan.bio ?? "Newly onboarded CityTrust artisan.",
      experience_years: Number(artisan.experience_years) || 1,
      location_zone: artisan.location_zone ?? "Phase 1",
      price_range: artisan.price_range ?? "To be agreed",
      availability_status: artisan.availability_status ?? "available",
      verification_status: artisan.verification_status ?? "under_review",
      checks: artisan.checks ?? checksFor("under_review"),
      verification_documents: Array.isArray(artisan.verification_documents) ? artisan.verification_documents : [],
      response_time_mins: Number(artisan.response_time_mins) || 60,
      trust_score: Number(artisan.trust_score) || 50,
      rating: Number(artisan.rating) || 0,
      completed_jobs: Number(artisan.completed_jobs) || 0,
      complaint_count: Number(artisan.complaint_count) || 0,
      ...(artisan.reference ? { reference: artisan.reference } : {}),
      ...(artisan.emergency_contact ? { emergency_contact: artisan.emergency_contact } : {}),
      created_at: artisan.created_at ?? now(),
    };
    const existing = artisanMap.get(cleanArtisan.id);
    artisanMap.set(cleanArtisan.id, {
      ...(existing ?? cleanArtisan),
      ...cleanArtisan,
      profile_image: cleanArtisan.profile_image || existing?.profile_image || "",
      verification_documents: cleanArtisan.verification_documents?.length ? cleanArtisan.verification_documents : existing?.verification_documents ?? [],
    });
  }

  try {
    readStorageArray<User>(RUNTIME_USERS_KEY).forEach(addUser);
    readStorageArray<ArtisanProfile>(RUNTIME_ARTISANS_KEY).forEach(addArtisan);

    for (const key of getAllCityTrustStorageKeys("citytrust:db:")) {
      for (const storage of [window.localStorage, window.sessionStorage]) {
        const raw = storage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users)) parsed.users.forEach(addUser);
        if (Array.isArray(parsed.artisans)) parsed.artisans.forEach(addArtisan);
      }
    }

    for (const key of getAllCityTrustStorageKeys("citytrust:artisan-directory:")) {
      for (const storage of [window.localStorage, window.sessionStorage]) {
        const raw = storage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsed.forEach(addArtisan);
      }
    }
  } catch {}

  const merged: DB = {
    ...db,
    users: Array.from(userMap.values()),
    artisans: Array.from(artisanMap.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
  };

  return merged;
}

function clearOldDemoStorageKeys() {
  if (typeof window === "undefined") return;
  try {
    // Do NOT remove older CityTrust DB keys here. During the finale, users may
    // create an artisan on one build/version and then install a newer zip.
    // We migrate those real runtime accounts below instead of deleting them.
    localStorage.removeItem("citytrust:landing-search");
  } catch {}
}

let state: DB = (() => {
  if (typeof window === "undefined") return seed();
  clearOldDemoStorageKeys();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeDB(parsed);
    }
  } catch {}
  const s = ensureArtisanProfilesInState(mergeRuntimeRecordsFromStorage(seed()));
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
})();

const listeners = new Set<() => void>();

function readStoredState(): DB | null {
  if (typeof window === "undefined") return null;
  let merged: DB | null = null;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) continue;
      const parsed = normalizeDB(JSON.parse(raw));
      merged = merged ? mergeDBRecords(merged, parsed) : parsed;
    } catch {}
  }
  return merged;
}

function refreshFromStorage() {
  const latest = readStoredState();
  if (latest) state = ensureArtisanProfilesInState(mergeDBRecords(latest, state));
}

function prepareMutation() {
  refreshFromStorage();
  state = ensureArtisanProfilesInState(state);
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY && event.key !== DIRECTORY_KEY) return;
    try {
      if (event.key === KEY && event.newValue) {
        state = normalizeDB(JSON.parse(event.newValue));
      } else {
        state = ensureArtisanProfilesInState(state);
      }
      notifyListeners();
    } catch {}
  });

  window.addEventListener("citytrust-directory-sync", () => {
    state = ensureArtisanProfilesInState(state);
    notifyListeners();
  });
}

function emit() {
  state = ensureArtisanProfilesInState(state);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    try {
      state.users.filter((user) => !isLegacyDemoUser(user)).forEach(persistRuntimeUser);
      const currentDirectory = readArtisanDirectory();
      const runtimeArtisans = state.artisans.filter(isRuntimeArtisan);
      runtimeArtisans.forEach(persistRuntimeArtisan);
      if (runtimeArtisans.length > 0) writeArtisanDirectory([...runtimeArtisans, ...currentDirectory]);
    } catch {}
  }
  notifyListeners();
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
  return authSessions.residentUserId ?? authSessions.artisanUserId ?? authSessions.adminUserId ?? "";
}

export const store = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  reset: () => { state = ensureArtisanProfilesInState(removeLegacyDemoData(seed())); emit(); },
  setCurrentUser: (id: string) => { prepareMutation(); state = { ...state, currentUserId: id }; emit(); },
  getSignedInUserId: (role: Role) => state.authSessions?.[sessionKeyFor(role)] ?? null,
  ensureArtisanDirectory: () => { prepareMutation(); emit(); },
  refresh: () => { refreshFromStorage(); state = ensureArtisanProfilesInState(state); notifyListeners(); },
  isSignedIn: (role: Role) => Boolean(state.authSessions?.[sessionKeyFor(role)]),
  logout: (role: Role) => {
    prepareMutation();
    const key = sessionKeyFor(role);
    const authSessions = { ...(state.authSessions ?? {}), [key]: undefined };
    state = { ...state, authSessions, currentUserId: nextActiveUserId(authSessions) };
    emit();
  },
  signIn: (email: string, role: Role, password?: string) => {
    prepareMutation();
    const normalizedEmail = email.trim().toLowerCase();
    let user = state.users.find((u) => u.role === role && u.email.toLowerCase() === normalizedEmail) ?? null;
    if (!user && role === "admin" && normalizedEmail === "staff@citytrust.org") {
      user = state.users.find((u) => u.role === "admin") ?? null;
    }
    if (!user) return null;
    if ((user.status ?? "active") !== "active") return null;
    const expectedPassword = user.password ?? (role === "admin" ? "citytrust-access" : "citytrust2026");
    if ((password ?? "").trim() !== expectedPassword) return null;
    const authSessions = role === "resident"
      ? { residentUserId: user.id }
      : role === "artisan"
        ? { artisanUserId: user.id }
        : { adminUserId: user.id };
    state = { ...state, currentUserId: user.id, authSessions };
    emit();
    return user;
  },
  createResident: (input: { full_name: string; email: string; phone: string; location_zone: string; password?: string }) => {
    prepareMutation();
    const existing = state.users.find((u) => u.role === "resident" && u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) {
      state = { ...state, currentUserId: existing.id, authSessions: { residentUserId: existing.id } };
      emit();
      return existing;
    }
    const user: User = {
      id: "u-" + uid(),
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      password: input.password || "citytrust2026",
      status: "active",
      role: "resident",
      location_zone: input.location_zone,
      resident_trust: "phone_verified",
      id_uploaded: false,
      created_at: now(),
    };
    persistRuntimeUser(user);
    state = { ...state, users: [...state.users, user], currentUserId: user.id, authSessions: { residentUserId: user.id } };
    emit();
    return user;
  },
  createRequest: (req: Omit<ServiceRequest, "id" | "created_at" | "status" | "artisan_id"> & { artisan_id?: string | null }) => {
    prepareMutation();
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
    prepareMutation();
    state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) };
    emit();
  },
  setScopeAgreement: (id: string, status: AgreementStatus) => {
    prepareMutation();
    state = { ...state, requests: state.requests.map((r) => r.id === id && r.scope ? { ...r, scope: { ...r.scope, status }, status: status === "agreed" ? "accepted" : r.status } : r) };
    emit();
  },
  requestScopeUpdate: (id: string) => {
    prepareMutation();
    state = { ...state, requests: state.requests.map((r) => r.id === id && r.scope ? { ...r, scope: { ...r.scope, status: "awaiting" } } : r) };
    emit();
  },
  assignArtisan: (id: string, artisanId: string) => {
    prepareMutation();
    state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, artisan_id: artisanId, status: "matched" } : r)) };
    emit();
  },
  addReview: (r: Omit<Review, "id" | "created_at" | "verified">) => {
    prepareMutation();
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
    prepareMutation();
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
    prepareMutation();
    state = { ...state, complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)) };
    emit();
  },
  setVerification: (artisanId: string, status: VerifyStatus, notes = "") => {
    prepareMutation();
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
    prepareMutation();
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
    prepareMutation();
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
  createArtisan: (input: { full_name: string; email: string; phone: string; password?: string; category_id: string; business_name: string; bio: string; experience_years: number; location_zone: string; price_range: string; reference?: ReferenceContact; emergency_contact?: string; uploads?: Partial<Record<keyof VerificationChecks, boolean>>; verification_documents?: VerificationDocument[] }) => {
    prepareMutation();
    const userId = "u-" + uid();
    const user: User = { id: userId, full_name: input.full_name, email: input.email, phone: input.phone, password: input.password || "citytrust2026", status: "active", role: "artisan", location_zone: input.location_zone, created_at: now() };
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
      verification_documents: input.verification_documents ?? [],
      response_time_mins: 60, trust_score: 50, rating: 0, completed_jobs: 0, complaint_count: 0,
      reference: input.reference, emergency_contact: input.emergency_contact,
      created_at: now(),
    };
    persistRuntimeUser(user);
    persistRuntimeArtisan(a);
    upsertDirectoryArtisan(a);
    state = { ...state, users: [...state.users, user], artisans: [a, ...state.artisans], currentUserId: userId, authSessions: { artisanUserId: userId } };
    emit();
    return a;
  },
  updateUser: (userId: string, patch: Partial<User>) => {
    prepareMutation();
    state = {
      ...state,
      users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    };
    emit();
  },
  updateArtisan: (artisanId: string, patch: Partial<ArtisanProfile>) => {
    prepareMutation();
    let updatedArtisan: ArtisanProfile | null = null;
    state = {
      ...state,
      artisans: state.artisans.map((a) => {
        if (a.id !== artisanId) return a;
        const next = { ...a, ...patch };
        updatedArtisan = { ...next, trust_score: recomputeTrust(next) };
        return updatedArtisan;
      }),
    };
    if (updatedArtisan) {
      persistRuntimeArtisan(updatedArtisan);
      upsertDirectoryArtisan(updatedArtisan);
    }
    emit();
  },
  addCategory: (name: string, description: string) => {
    prepareMutation();
    const c: ServiceCategory = { id: "c-" + uid(), name, description, icon: "Settings", price_min: "", price_max: "", price_note: "" };
    state = { ...state, categories: [...state.categories, c] };
    emit();
  },
  updateCategory: (categoryId: string, patch: Partial<ServiceCategory>) => {
    prepareMutation();
    state = { ...state, categories: state.categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)) };
    emit();
  },
  deleteCategory: (categoryId: string) => {
    prepareMutation();
    const inUse = state.artisans.some((a) => a.category_id === categoryId) || state.requests.some((r) => r.category_id === categoryId);
    if (inUse) return false;
    state = { ...state, categories: state.categories.filter((c) => c.id !== categoryId) };
    emit();
    return true;
  },
  setUserStatus: (userId: string, status: AccountStatus) => {
    prepareMutation();
    const user = state.users.find((u) => u.id === userId);
    const authSessions = { ...(state.authSessions ?? {}) };
    if (status !== "active" && user) {
      if (user.role === "resident" && authSessions.residentUserId === userId) authSessions.residentUserId = undefined;
      if (user.role === "artisan" && authSessions.artisanUserId === userId) authSessions.artisanUserId = undefined;
      if (user.role === "admin" && authSessions.adminUserId === userId) authSessions.adminUserId = undefined;
    }
    state = {
      ...state,
      users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
      authSessions,
      currentUserId: nextActiveUserId(authSessions),
      actions: [{ id: uid(), admin_id: "u-admin", action_type: `account_${status}`, target_id: userId, notes: user?.email ?? "", created_at: now() }, ...state.actions],
    };
    emit();
  },
  sendMessage: (artisan_id: string, resident_id: string, sender: "resident" | "artisan", text: string, image_url?: string, audio_url?: string, audio_duration_secs?: number) => {
    prepareMutation();
    const m: ChatMessage = {
      id: uid(),
      artisan_id,
      resident_id,
      sender,
      text,
      ...(image_url ? { image_url } : {}),
      ...(audio_url ? { audio_url } : {}),
      ...(audio_duration_secs ? { audio_duration_secs } : {}),
      created_at: now(),
    };
    state = { ...state, messages: [...state.messages, m] };
    emit();
    return m;
  },
  setResidentTrust: (userId: string, trust: ResidentTrust, opts?: { id_uploaded?: boolean; full_name?: string; email?: string; phone?: string; location_zone?: string }) => {
    prepareMutation();
    state = {
      ...state,
      users: state.users.map((u) => u.id === userId ? { ...u, resident_trust: trust, ...(opts?.id_uploaded !== undefined ? { id_uploaded: opts.id_uploaded } : {}), ...(opts?.full_name ? { full_name: opts.full_name } : {}), ...(opts?.email ? { email: opts.email } : {}), ...(opts?.phone ? { phone: opts.phone } : {}), ...(opts?.location_zone ? { location_zone: opts.location_zone } : {}) } : u),
    };
    emit();
  },
  toggleSaved: (artisanId: string) => {
    prepareMutation();
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

export function isUserActive(user?: Pick<User, "status"> | null): boolean {
  return (user?.status ?? "active") === "active";
}

export function categoryPriceLabel(c?: ServiceCategory | null): string {
  if (!c) return "Admin price guide pending";
  const min = c.price_min?.trim();
  const max = c.price_max?.trim();
  if (min && max) return `${min} - ${max}`;
  if (min || max) return min || max || "Admin price guide pending";
  return "Admin price guide pending";
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
  return db.artisans
    .filter((a) => isUserActive(db.users.find((u) => u.id === a.user_id)))
    .map((a) => ({ artisan: a, ...scoreArtisan(a, ctx) }))
    .sort((x, y) => y.score - x.score);
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

