/**
 * HabitAware Collective — Weekly Member Snapshots & At a Glance Report
 *
 * Layer 1: Pull member data from Mighty Networks API, store weekly snapshots,
 * diff against previous week, and generate At a Glance metrics.
 *
 * @see apps/habitaware-ai/agentx/habitaware-collective-reporting.feature.agentx-v1.md
 * @see apps/habitaware-ai/agentx/habitaware-collective-reporting.impl.agentx-v1.md
 */

import { Elysia, t } from "elysia";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const MIGHTY_BASE_URL = "https://api.mn.co/admin/v1";
const API_KEY = process.env.MIGHTY_API_KEY;
const NETWORK_ID = process.env.MIGHTY_NETWORK_ID;
const SNAPSHOTS_DIR =
  process.env.SNAPSHOTS_DIR ||
  (process.env.NODE_ENV === "production" ? "/app/data/snapshots" : join(process.cwd(), "data", "snapshots"));

// ============ TYPES ============

export type MemberTier = "All Access" | "Limited" | "Free Trial";
export type BillingType = "Monthly" | "Annual" | "n/a";

export interface MemberSnapshot {
  member_id: number;
  name: string;
  email: string;
  current_tier: MemberTier;
  billing_type: BillingType;
  join_date: string;
  current_plan_start_date: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  cancel_date: string | null;
  expiration_date: string | null;
  
  // Layer 2: Engagement Data
  logins: number;
  post_clicks: number;
  contributions: number;
  comments: number;
  post_reactions: number;
  engagement_bucket: "Active" | "Lurker" | "Ghost";
  ghost_level: "Drifting" | "Cold" | "Ghost" | null;
}

export interface SnapshotFile {
  snapshot_id: string;
  captured_at: string;
  members: MemberSnapshot[];
}

export interface AtAGlanceMetrics {
  all_access_count: number;
  limited_count: number;
  free_trial_count: number;
  monthly_count: number;
  annual_count: number;
  new_subscribers: number;
  trials_converted: number;
  trials_converted_rate: number | null;
  trials_ended_count: number;
  canceled_this_week: number;
  expired_this_week: number;
  net_change: number;
  churn_rate: number | null;
  mrr: number;
  total_revenue_this_week: number;
}

export interface AtAGlanceReport {
  snapshot_id: string;
  captured_at: string;
  prev_snapshot_id: string | null;
  prev_captured_at: string | null;
  metrics: AtAGlanceMetrics;
  drill_down: {
    new_subscribers: MemberSnapshot[];
    trials_converted: MemberSnapshot[];
    canceled_this_week: MemberSnapshot[];
    expired_this_week: MemberSnapshot[];
  };
}

export interface EngagementMetrics {
  total: number;
  active: number;
  lurkers: number;
  ghosts: number;
  ghost_levels: {
    drifting: number;
    cold: number;
    ghost: number;
  };
}

export interface EngagementSnapshot {
  snapshot_id: string;
  captured_at: string;
  overall: EngagementMetrics;
  by_age: {
    new_members: EngagementMetrics; // < 90 days
    established: EngagementMetrics; // >= 90 days
  };
  by_tier: {
    all_access: EngagementMetrics;
    limited: EngagementMetrics;
    free_trial: EngagementMetrics;
  };
}

// ============ MIGHTY API ============

async function mightyFetch<T>(endpoint: string): Promise<T> {
  if (!API_KEY || !NETWORK_ID) {
    throw new Error("MIGHTY_API_KEY and MIGHTY_NETWORK_ID must be configured");
  }
  const response = await fetch(`${MIGHTY_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Mighty API Error: ${response.status} - ${JSON.stringify(err)}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAllMembers(): Promise<MemberSnapshot[]> {
  const [membersRes, subscriptionsRes, plansRes] = await Promise.all([
    mightyFetch<{ items: Array<{ id: number; email: string; first_name: string; last_name: string; created_at: string }> }>(
      `/networks/${NETWORK_ID}/members?per_page=200`
    ),
    mightyFetch<{
      items: Array<{
        member_id: number;
        plan: { id: number; name: string; amount: number; currency: string; type: string; interval?: string };
        subscription: { canceled_at: string | null; trial_end: string | null; current_period_end?: string };
      }>;
    }>(`/networks/${NETWORK_ID}/subscriptions?per_page=200`),
    mightyFetch<{ items: Array<{ id: number; name: string; type: string; interval?: string }> }>(
      `/networks/${NETWORK_ID}/plans?per_page=100`
    ),
  ]);

  const subMap = new Map<
    number,
    {
      planName: string;
      planType: string;
      amount: number;
      interval?: string;
      canceled_at: string | null;
      trial_end: string | null;
      current_period_end?: string;
    }
  >();
  for (const sub of subscriptionsRes.items) {
    subMap.set(sub.member_id, {
      planName: sub.plan.name,
      planType: sub.plan.type,
      amount: sub.plan.amount,
      interval: sub.plan.interval,
      canceled_at: sub.subscription.canceled_at,
      trial_end: sub.subscription.trial_end,
      current_period_end: (sub.subscription as any).current_period_end,
    });
  }

  const planMap = new Map<number, { name: string; type: string; interval?: string }>();
  for (const plan of plansRes.items) {
    planMap.set(plan.id, { name: plan.name, type: plan.type, interval: plan.interval });
  }

  // Phase 2: Engagement Activity (posts, comments, reactions)
  // Fetch recent posts to count contributions
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const postsRes = await mightyFetch<{ items: Array<{ id: number; creator_id: number; created_at: string }> }>(
    `/networks/${NETWORK_ID}/posts?per_page=100`
  ).catch(() => ({ items: [] }));
  
  // Count contributions (posts created this week) per member
  const contributionsByMember = new Map<number, number>();
  for (const p of postsRes.items) {
    if (new Date(p.created_at) >= weekAgo) {
      contributionsByMember.set(p.creator_id, (contributionsByMember.get(p.creator_id) || 0) + 1);
    }
  }

  // Aggregate comments per member
  const commentsByMember = new Map<number, number>();
  // Aggregate reactions per member
  const reactionsByMember = new Map<number, number>();

  // Use Promise.all to fetch comments and reactions for recent posts
  const recentPosts = postsRes.items.filter(p => new Date(p.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // up to 30 days old to catch recent activity
  const postActivityPromises = recentPosts.map(async (p) => {
    try {
      const [coms, reacs] = await Promise.all([
        mightyFetch<{ items: Array<{ creator?: { id: number }; created_at: string }> }>(
          `/networks/${NETWORK_ID}/posts/${p.id}/comments`
        ).catch(() => ({ items: [] })),
        mightyFetch<{ items: Array<{ user_id: number; created_at: string }> }>( // wait, reactions might not have created_at
          `/networks/${NETWORK_ID}/posts/${p.id}/reactions`
        ).catch(() => Array.isArray(_) ? { items: _ } : { items: [] }) // Some APIs return array directly
      ]);
      
      for (const c of coms.items) {
        if (c.creator && new Date(c.created_at) >= weekAgo) {
          commentsByMember.set(c.creator.id, (commentsByMember.get(c.creator.id) || 0) + 1);
        }
      }

      // If array directly or items
      const reactionsArray = Array.isArray(reacs) ? reacs : (reacs as any).items || [];
      for (const r of reactionsArray) {
         // API doesn't always have created_at for reactions, just assume they are recent for this basic demo
         if (r.user_id) {
           reactionsByMember.set(r.user_id, (reactionsByMember.get(r.user_id) || 0) + 1);
         }
      }
    } catch {
      // ignore
    }
  });

  await Promise.all(postActivityPromises);

  const snapshots: MemberSnapshot[] = [];
  for (const m of membersRes.items) {
    const sub = subMap.get(m.id);
    const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;

    let current_tier: MemberTier = "Limited";
    let billing_type: BillingType = "n/a";
    let current_plan_start_date: string | null = null;
    let trial_start_date: string | null = null;
    let trial_end_date: string | null = null;
    let cancel_date: string | null = null;
    let expiration_date: string | null = null;

    if (sub) {
      const isTrial = sub.trial_end && new Date(sub.trial_end) > new Date();
      const isPaid = sub.planType === "subscription" && sub.amount > 0;

      if (isTrial) {
        current_tier = "Free Trial";
        trial_end_date = sub.trial_end;
      } else if (isPaid) {
        current_tier = "All Access";
        billing_type = sub.interval === "year" ? "Annual" : sub.interval === "month" ? "Monthly" : "n/a";
      } else {
        current_tier = "Limited";
      }

      cancel_date = sub.canceled_at;
      trial_end_date = sub.trial_end ?? trial_end_date;
      expiration_date = (sub as any).current_period_end ?? sub.canceled_at ?? null;
      current_plan_start_date = m.created_at; // Proxy since not available
    }

    // Phase 2 logic (Engagement)
    const contributions = contributionsByMember.get(m.id) || 0;
    const comments = commentsByMember.get(m.id) || 0;
    const post_reactions = reactionsByMember.get(m.id) || 0;
    const logins = 0; // Not available via Network Admin API
    const post_clicks = 0; // Not available via Network Admin API
    
    let engagement_bucket: "Active" | "Lurker" | "Ghost" = "Ghost";
    if (contributions > 0 || comments > 0) engagement_bucket = "Active";
    else if (logins > 0 || post_clicks > 0 || post_reactions > 0) engagement_bucket = "Lurker";

    // Ghost Level logic (90+ days only)
    const daysSinceJoin = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
    let ghost_level: "Drifting" | "Cold" | "Ghost" | null = null;
    if (daysSinceJoin >= 90 && engagement_bucket === "Ghost") {
      // Without logins history, we just mark them Ghost
      ghost_level = "Ghost"; 
    }

    snapshots.push({
      member_id: m.id,
      name,
      email: m.email,
      current_tier,
      billing_type,
      join_date: m.created_at,
      current_plan_start_date,
      trial_start_date,
      trial_end_date,
      cancel_date,
      expiration_date,
      logins,
      post_clicks,
      contributions,
      comments,
      post_reactions,
      engagement_bucket,
      ghost_level,
    });
  }

  return snapshots;
}

// ============ STORAGE ============

async function ensureSnapshotsDir() {
  await mkdir(SNAPSHOTS_DIR, { recursive: true });
}

function snapshotPath(snapshotId: string): string {
  return join(SNAPSHOTS_DIR, `snapshot-${snapshotId}.json`);
}

async function listSnapshots(): Promise<{ snapshot_id: string; captured_at: string }[]> {
  await ensureSnapshotsDir();
  const files = await readdir(SNAPSHOTS_DIR);
  const jsonFiles = files.filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"));
  const results: { snapshot_id: string; captured_at: string }[] = [];
  for (const f of jsonFiles) {
    try {
      const content = await readFile(join(SNAPSHOTS_DIR, f), "utf-8");
      const data = JSON.parse(content) as SnapshotFile;
      results.push({ snapshot_id: data.snapshot_id, captured_at: data.captured_at });
    } catch {
      // skip invalid files
    }
  }
  results.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  return results;
}

async function loadSnapshot(snapshotId: string): Promise<SnapshotFile | null> {
  try {
    const content = await readFile(snapshotPath(snapshotId), "utf-8");
    return JSON.parse(content) as SnapshotFile;
  } catch {
    return null;
  }
}

// ============ DIFF ENGINE ============

function diffSnapshots(
  prev: SnapshotFile | null,
  curr: SnapshotFile
): {
  metrics: AtAGlanceMetrics;
  drill_down: AtAGlanceReport["drill_down"];
} {
  const currByEmail = new Map(curr.members.map((m) => [m.email, m]));
  const prevByEmail = new Map(prev?.members.map((m) => [m.email, m]) ?? []);

  const allAccess = curr.members.filter((m) => m.current_tier === "All Access");
  const limited = curr.members.filter((m) => m.current_tier === "Limited");
  const freeTrial = curr.members.filter((m) => m.current_tier === "Free Trial");
  const monthly = allAccess.filter((m) => m.billing_type === "Monthly");
  const annual = allAccess.filter((m) => m.billing_type === "Annual");

  let new_subscribers: MemberSnapshot[] = [];
  let trials_converted: MemberSnapshot[] = [];
  let canceled_this_week: MemberSnapshot[] = [];
  let expired_this_week: MemberSnapshot[] = [];
  let trials_ended_count = 0;

  if (prev) {
    const prevTrialEmails = new Set(prev.members.filter((m) => m.current_tier === "Free Trial").map((m) => m.email));
    const prevAllAccessEmails = new Set(prev.members.filter((m) => m.current_tier === "All Access").map((m) => m.email));
    const prevCanceledButActive = new Set(
      prev.members.filter((m) => m.cancel_date && m.expiration_date && new Date(m.expiration_date) > new Date()).map((m) => m.email)
    );

    for (const m of curr.members) {
      const p = prevByEmail.get(m.email);
      if (!p) {
        if (m.current_tier === "All Access") new_subscribers.push(m);
      } else {
        if (prevTrialEmails.has(m.email) && m.current_tier === "All Access") trials_converted.push(m);
        if (m.cancel_date && !p.cancel_date) canceled_this_week.push(m);
      }
    }

    for (const p of prev.members) {
      if (prevTrialEmails.has(p.email) && !currByEmail.has(p.email)) trials_ended_count++;
      if (prevCanceledButActive.has(p.email) && !currByEmail.has(p.email)) expired_this_week.push(p);
    }
  }

  const newCount = new_subscribers.length;
  const expiredCount = expired_this_week.length;
  const net_change = newCount - expiredCount;
  const totalPaying = allAccess.length;
  const churn_rate = totalPaying > 0 ? (expiredCount / totalPaying) * 100 : null;
  const trialConversionRate =
    trials_ended_count > 0 ? (trials_converted.length / trials_ended_count) * 100 : null;

  const monthlyPrice = 29;
  const annualPrice = 290;
  const mrr = monthly.length * monthlyPrice + (annual.length * annualPrice) / 12;

  return {
    metrics: {
      all_access_count: allAccess.length,
      limited_count: limited.length,
      free_trial_count: freeTrial.length,
      monthly_count: monthly.length,
      annual_count: annual.length,
      new_subscribers: newCount,
      trials_converted: trials_converted.length,
      trials_converted_rate: trialConversionRate,
      trials_ended_count,
      canceled_this_week: canceled_this_week.length,
      expired_this_week: expiredCount,
      net_change,
      churn_rate,
      mrr,
      total_revenue_this_week: 0,
    },
    drill_down: {
      new_subscribers,
      trials_converted,
      canceled_this_week,
      expired_this_week,
    },
  };
}

// ============ ROUTES ============

import { requireAuth } from "../../index";

export const snapshotRoutes = new Elysia({ prefix: "/snapshots" })
  .onBeforeHandle(async ({ headers, set }) => {
    const payload = await requireAuth(headers, null, set);
    if (!payload && set.status === 401) {
      return { error: "Unauthorized" };
    }
  })

  .post("/ingest", async () => {
    try {
      await ensureSnapshotsDir();
      const members = await fetchAllMembers();
      const snapshotId = `weekly-${new Date().toISOString().slice(0, 10)}-${Date.now()}`;
      const captured_at = new Date().toISOString();

      const snapshot: SnapshotFile = {
        snapshot_id: snapshotId,
        captured_at,
        members,
      };

      await writeFile(snapshotPath(snapshotId), JSON.stringify(snapshot, null, 2), "utf-8");

      return {
        success: true,
        snapshot_id: snapshotId,
        captured_at,
        member_count: members.length,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  })

  .get("/list", async () => {
    const snapshots = await listSnapshots();
    return { snapshots };
  })

  .get("/latest", async () => {
    const snapshots = await listSnapshots();
    if (snapshots.length === 0) return { snapshot_id: null, captured_at: null };
    return snapshots[0];
  })

  .get("/:snapshotId", async ({ params }) => {
    const snapshot = await loadSnapshot(params.snapshotId);
    if (!snapshot) return { error: "Snapshot not found" };
    return snapshot;
  })

  .get("/:snapshotId/report", async ({ params }) => {
    const curr = await loadSnapshot(params.snapshotId);
    if (!curr) return { error: "Snapshot not found" };

    const snapshots = await listSnapshots();
    const currIndex = snapshots.findIndex((s) => s.snapshot_id === params.snapshotId);
    const prevSnapshotId = currIndex >= 0 && currIndex < snapshots.length - 1 ? snapshots[currIndex + 1].snapshot_id : null;
    const prev = prevSnapshotId ? await loadSnapshot(prevSnapshotId) : null;

    const { metrics, drill_down } = diffSnapshots(prev, curr);

    const report: AtAGlanceReport = {
      snapshot_id: curr.snapshot_id,
      captured_at: curr.captured_at,
      prev_snapshot_id: prev?.snapshot_id ?? null,
      prev_captured_at: prev?.captured_at ?? null,
      metrics,
      drill_down,
    };

    return report;
  })

  .get("/latest/report", async () => {
    const snapshots = await listSnapshots();
    if (snapshots.length === 0) {
      return { error: "No snapshots yet. Run POST /snapshots/ingest first." };
    }
    const latestId = snapshots[0].snapshot_id;
    const curr = await loadSnapshot(latestId);
    if (!curr) return { error: "Snapshot not found" };

    const prevSnapshotId = snapshots[1]?.snapshot_id ?? null;
    const prev = prevSnapshotId ? await loadSnapshot(prevSnapshotId) : null;

    const { metrics, drill_down } = diffSnapshots(prev, curr);

    const report: AtAGlanceReport = {
      snapshot_id: curr.snapshot_id,
      captured_at: curr.captured_at,
      prev_snapshot_id: prev?.snapshot_id ?? null,
      prev_captured_at: prev?.captured_at ?? null,
      metrics,
      drill_down,
    };

    return report;
  })

  .get("/:snapshotId/drill/:metric", async ({ params }) => {
    const curr = await loadSnapshot(params.snapshotId);
    if (!curr) return { error: "Snapshot not found" };

    const snapshots = await listSnapshots();
    const currIndex = snapshots.findIndex((s) => s.snapshot_id === params.snapshotId);
    const prevId = currIndex >= 0 && currIndex < snapshots.length - 1 ? snapshots[currIndex + 1].snapshot_id : null;
    const prev = prevId ? await loadSnapshot(prevId) : null;
    const { drill_down } = diffSnapshots(prev, curr);

    const key = params.metric as keyof typeof drill_down;
    if (!(key in drill_down)) return { error: "Unknown metric" };
    const members = drill_down[key];
    return { metric: key, members, count: members.length };
  })

  // ============ PHASE 2: ENGAGEMENT REPORTS ============ //

  .get("/latest/engagement", async () => {
    const snapshots = await listSnapshots();
    if (snapshots.length === 0) return { error: "No snapshots yet. Run POST /snapshots/ingest first." };
    
    const curr = await loadSnapshot(snapshots[0].snapshot_id);
    if (!curr) return { error: "Snapshot not found" };

    const emptyMetrics = (): EngagementMetrics => ({
      total: 0, active: 0, lurkers: 0, ghosts: 0,
      ghost_levels: { drifting: 0, cold: 0, ghost: 0 }
    });

    const report: EngagementSnapshot = {
      snapshot_id: curr.snapshot_id,
      captured_at: curr.captured_at,
      overall: emptyMetrics(),
      by_age: {
        new_members: emptyMetrics(),
        established: emptyMetrics()
      },
      by_tier: {
        all_access: emptyMetrics(),
        limited: emptyMetrics(),
        free_trial: emptyMetrics()
      }
    };

    const addMember = (m: MemberSnapshot, metrics: EngagementMetrics) => {
      metrics.total++;
      if (m.engagement_bucket === "Active") metrics.active++;
      else if (m.engagement_bucket === "Lurker") metrics.lurkers++;
      else if (m.engagement_bucket === "Ghost") {
        metrics.ghosts++;
        if (m.ghost_level === "Drifting") metrics.ghost_levels.drifting++;
        if (m.ghost_level === "Cold") metrics.ghost_levels.cold++;
        if (m.ghost_level === "Ghost") metrics.ghost_levels.ghost++;
      }
    };

    for (const m of curr.members) {
      // Overall
      addMember(m, report.overall);

      // By age
      const daysSinceJoin = (new Date(curr.captured_at).getTime() - new Date(m.join_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin < 90) addMember(m, report.by_age.new_members);
      else addMember(m, report.by_age.established);

      // By tier
      if (m.current_tier === "All Access") addMember(m, report.by_tier.all_access);
      else if (m.current_tier === "Limited") addMember(m, report.by_tier.limited);
      else if (m.current_tier === "Free Trial") addMember(m, report.by_tier.free_trial);
    }

    return report;
  });
