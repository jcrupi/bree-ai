import { useState, useEffect, useMemo } from "react";
import { api } from "./api/client";
import { marked } from "marked";
import { IdentityZeroConsole } from "@bree-ai/core/components";
import TheObserver from "./components/TheObserver";
import AtAGlanceDashboard from "./components/AtAGlanceDashboard";
import EngagementDashboard from "./components/EngagementDashboard";

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

type Tab =
  | "me"
  | "network"
  | "members"
  | "spaces"
  | "posts"
  | "posts_by_space"
  | "comments"
  | "events"
  | "courseworks"
  | "plans"
  | "badges"
  | "tags"
  | "collections"
  | "invites"
  | "polls"
  | "subscriptions"
  | "purchases"
  | "custom_fields"
  | "abuse_reports"
  | "ai_chat"
  | "members_ai"
  | "posts_ai"
  | "at_a_glance"
  | "member_engagement"
  | "raw"
  | "identity_zero";

type MainTab = "habitaware" | "advanced" | "book" | "observer";

type ViewMode = "table" | "json";

interface ApiResponse {
  data: unknown;
  error: { value: unknown } | null;
}

interface Member {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  location: string | null;
  created_at: string;
  avatar: string;
  permalink: string;
  subscription?: {
    planName: string;
    planType: string;
    amount: number;
    currency: string;
    isActive: boolean;
    isTrial: boolean;
  } | null;
  isPaid?: boolean;
  subscriptionStatus?: "paid" | "trial" | "free" | "none";
}

interface Space {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  collection_id: number;
}

interface Post {
  id: number;
  title: string | null;
  body: string;
  summary: string | null;
  description: string;
  post_type: string;
  content_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  last_activity_at: string;
  creator_id: number;
  space_id: number;
  creator?: { name: string; email: string };
  permalink: string;
  images: (string | null)[];
  comments_enabled: boolean;
}

interface Event {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  event_type: string;
  permalink: string;
  creator: { name: string; email: string };
}

interface Plan {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  created_at: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Tag {
  id: number;
  name: string;
  created_at: string;
}

interface Collection {
  id: number;
  name: string;
  created_at: string;
}

interface Invite {
  id: number;
  email: string;
  status: string;
  created_at: string;
}

interface Poll {
  id: number;
  title: string;
  poll_type: string;
  created_at: string;
  creator: { name: string };
}

interface Subscription {
  id: number;
  status: string;
  plan_name: string;
  member_email: string;
  created_at: string;
}

interface Purchase {
  id: number;
  plan_name: string;
  member_email: string;
  amount_cents: number;
  created_at: string;
}

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  required: boolean;
  created_at: string;
}

interface AbuseReport {
  id: number;
  reportable_type: string;
  reportable_id: number;
  reason: string;
  status: string;
  created_at: string;
  reporter?: { name: string; email: string };
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  creator?: { id: number; name: string; email: string };
  post_id: number;
}

interface Reaction {
  id: number;
  reaction_type: string;
  user_id: number;
  created_at: string;
  user?: { name: string };
}

interface Coursework {
  id: number;
  title: string;
  description: string;
  status: string;
  space_id: number;
  created_at: string;
  updated_at: string;
}

interface RSVP {
  id: number;
  status: string;
  event_id: number;
  user_id: number;
  created_at: string;
  user?: { id: number; name: string; email: string; short_bio?: string; avatar?: string };
}

interface Member {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  short_bio?: string;
  avatar?: string;
  created_at: string;
}

interface MeData {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  short_bio?: string;
  avatar?: string;
  role?: string;
  created_at: string;
}

interface SpaceWithPosts {
  space: { id: number; name: string };
  posts: Post[];
}

interface ListResponse<T> {
  items: T[];
  links: { self: string; next?: string };
}

// Component to safely render HTML content from Mighty Networks
function RichContent({ html }: { html: string }) {
  // Content is from user's own Mighty Networks API - trusted source
  return <div className="rich-html" dangerouslySetInnerHTML={{ __html: html }} />;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "me", label: "Me" },
  { key: "network", label: "Network" },
  { key: "members", label: "Members" },
  { key: "spaces", label: "Spaces" },
  { key: "posts", label: "Posts" },
  { key: "posts_by_space", label: "Posts by Space" },
  { key: "comments", label: "Comments" },
  { key: "events", label: "Events" },
  { key: "courseworks", label: "Courseworks" },
  { key: "plans", label: "Plans" },
  { key: "badges", label: "Badges" },
  { key: "tags", label: "Tags" },
  { key: "collections", label: "Collections" },
  { key: "invites", label: "Invites" },
  { key: "polls", label: "Polls" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "purchases", label: "Purchases" },
  { key: "custom_fields", label: "Custom Fields" },
  { key: "abuse_reports", label: "Abuse Reports" },
  { key: "at_a_glance", label: "Layer 1: Weekly At a Glance" },
  { key: "member_engagement", label: "Layer 2: Member Engagement" },
  { key: "ai_chat", label: "AI Analytics" },
  { key: "members_ai", label: "Members AI" },
  { key: "posts_ai", label: "Posts AI" },
  { key: "raw", label: "Raw API" },
  { key: "identity_zero", label: "Identity Zero" },
];

const ANALYTICS_CATEGORIES = [
  {
    title: "Community Trends",
    items: [
      { id: "trends", label: "General Trends", question: "What are the trends in what ppl are posting?" },
      { id: "working", label: "What's Working", question: "What topics/discussions are working well?" },
      { id: "not-working", label: "What's Not Working", question: "What topics/discussions are NOT working?" },
      { id: "wants", label: "Member Desires", question: "What do members want more of?" },
      { id: "results", label: "Finding Results", question: "What is helping them find results?" },
      { id: "top-posts", label: "Top Posts", question: "What are my top posts?" },
    ]
  },
  {
    title: "Member Analytics",
    items: [
      { id: "paying-vs-limited", label: "Paying vs Limited", question: "How many paying members (full) and how many limited members are there?" },
      { id: "free-trial", label: "Free Trials", question: "How many members are on a free trial?" },
      { id: "conversion", label: "Trial Conversions", question: "How many free trialers convert?" },
      { id: "churn", label: "Trial Drops", question: "How many free trialers never join?" },
      { id: "cancellations", label: "Cancellations", question: "How many members cancel their subscriptions?" },
      { id: "top-active", label: "Top Active", question: "Who are the top active members (those who post and react)?" },
      { id: "lurkers", label: "Lurkers", question: "How many members are 'lurkers' (reading but not responding)?" },
      { id: "inactive", label: "Inactive Members", question: "How many members are inactive (nothing at all)?" },
    ]
  }
];

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>("habitaware");
  const [tab, setTab] = useState<Tab>("network");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeframeCollapsed, setTimeframeCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("25");

  // Raw API form state
  const [rawEndpoint, setRawEndpoint] = useState("/networks/{network_id}/me");
  const [rawMethod, setRawMethod] = useState("GET");

  // Posts by space state
  const [expandedSpaces, setExpandedSpaces] = useState<Set<number>>(new Set());

  // Detail modal states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [postReactions, setPostReactions] = useState<Reaction[]>([]);
  const [loadingPostDetails, setLoadingPostDetails] = useState(false);
  const [meData, setMeData] = useState<Member | null>(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(localStorage.getItem("habitaware_conversation_id"));

  // Book Chat state
  const [bookMessages, setBookMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [bookInput, setBookInput] = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [bookConversationId, setBookConversationId] = useState<string | null>(localStorage.getItem("habitaware_book_conversation_id"));

  // Book Admin Config state
  const [showBookConfig, setShowBookConfig] = useState(false);
  const [bookRagsterUrl, setBookRagsterUrl] = useState("https://agent-collective-ragster.fly.dev/api");
  const [bookOrgId, setBookOrgId] = useState("habitaware.ai");
  const [bookCollection, setBookCollection] = useState("ae495393-50b8-4211-8edd-f2953afbdfa2");
  const [bookCollections, setBookCollections] = useState<Array<{ id: string; short_id: string; name: string; chunk_count: number }>>([]);
  const [bookCollectionsLoading, setBookCollectionsLoading] = useState(false);

  // Feedback modal state (submit form)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Feedback viewer state (admin tab)
  const [feedbackFiles, setFeedbackFiles] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);

  async function loadFeedbackFiles() {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://bree-api.fly.dev";
      const token = localStorage.getItem("bree_jwt");
      const res = await fetch(`${API_URL}/api/feedback`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setFeedbackFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "Failed to load feedback");
    } finally {
      setFeedbackLoading(false);
    }
  }

  function renderFeedbackPanel() {
    return (
      <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📋 Feedback Files</h2>
            <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>
              Stored at <code>/app/data/feedback/</code> on bree-api
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={loadFeedbackFiles}
            disabled={feedbackLoading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {feedbackLoading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {feedbackError && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 16 }}>
            ❌ {feedbackError}
          </div>
        )}

        {!feedbackLoading && feedbackFiles.length === 0 && !feedbackError && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p>No feedback files found. Click Refresh to load.</p>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {feedbackFiles.map((fb, i) => (
            <div
              key={i}
              style={{
                background: selectedFeedback === fb ? "#f0f9ff" : "#fff",
                border: selectedFeedback === fb ? "1.5px solid #38bdf8" : "1px solid #e5e7eb",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => setSelectedFeedback(selectedFeedback === fb ? null : fb)}
            >
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", align: "center", gap: 12, flex: 1 }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    background: fb.type === "bug" ? "#fee2e2" : fb.type === "feature" ? "#dbeafe" : "#f3f4f6",
                    color: fb.type === "bug" ? "#dc2626" : fb.type === "feature" ? "#2563eb" : "#6b7280",
                    marginRight: 10,
                    flexShrink: 0,
                  }}>
                    {fb.type || "general"}
                  </span>
                  <div style={{ flexShrink: 0, marginRight: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{fb.name || "Anonymous"}</div>
                    {fb.email && <div style={{ fontSize: 12, color: "#888" }}>{fb.email}</div>}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fb.description}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, marginLeft: 12 }}>
                  {fb.receivedAt ? new Date(fb.receivedAt).toLocaleString() : fb.filename}
                </div>
              </div>

              {selectedFeedback === fb && (
                <div style={{ borderTop: "1px solid #e0f2fe", padding: "16px 18px", background: "#f8fbff" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 12, color: "#0284c7" }}>FULL DETAILS</p>
                  <pre style={{
                    margin: 0,
                    fontSize: 12,
                    background: "#1e293b",
                    color: "#94a3b8",
                    padding: 14,
                    borderRadius: 8,
                    overflowX: "auto",
                    lineHeight: 1.6,
                  }}>
                    {JSON.stringify(fb, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // AgentX notes state
  const [agentxContent, setAgentxContent] = useState<string | null>(null);
  const [agentxLoading, setAgentxLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (status === "connected") {
      loadTabData();
      loadMeData();
    }
  }, [tab, status, perPage]);

  async function loadMeData() {
    try {
      const res = (await api.api.habitaware.mighty.me.get()) as any;
      if (res.data) {
        // Mighty Networks /me returns { user: { ... }, network: { ... } }
        const member = res.data.user || res.data;
        setMeData(member as Member);
      }
    } catch (e) {
      console.error("Failed to load me data", e);
    }
  }

  async function checkConnection() {
    try {
      const res = await api.health.get();
      if (res.data) {
        setStatus("connected");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function loadAgentxNotes(type: "members" | "posts") {
    setAgentxLoading(true);
    setAgentxContent(null);
    setError(null);

    try {
      const res = (await api.api.habitaware.agentx.notes({ type }).get()) as ApiResponse;

      if (res.error) {
        setError(JSON.stringify(res.error.value, null, 2));
      } else {
        setAgentxContent((res.data as { content: string }).content);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setAgentxLoading(false);
    }
  }

  async function loadTabData() {
    // Handle agentx tabs separately
    if (tab === "members_ai") {
      await loadAgentxNotes("members");
      return;
    }
    if (tab === "posts_ai") {
      await loadAgentxNotes("posts");
      return;
    }
    if (tab === "at_a_glance" || tab === "member_engagement") {
      return; // dashboards manage their own data
    }

    setLoading(true);
    setError(null);
    setData(null);
    setSearch("");

    try {
      let res: ApiResponse;
      const query = { per_page: perPage };

      switch (tab) {
        case "me":
          res = (await api.api.habitaware.mighty.me.get()) as ApiResponse;
          if (res.data && (res.data as any).user) {
            res.data = (res.data as any).user;
          }
          break;
        case "network":
          res = (await api.api.habitaware.mighty.network.get()) as ApiResponse;
          break;
        case "members":
          res = (await api.api.habitaware.mighty["members-with-subscriptions"].get({ query })) as ApiResponse;
          break;
        case "spaces":
          res = (await api.api.habitaware.mighty.spaces.get({ query })) as ApiResponse;
          break;
        case "posts":
          res = (await api.api.habitaware.mighty.posts.get({ query })) as ApiResponse;
          break;
        case "posts_by_space":
          res = (await api.api.habitaware.mighty["posts-by-space"].get({ query })) as ApiResponse;
          setExpandedSpaces(new Set()); // Reset expanded state on reload
          break;
        case "comments":
          res = (await api.api.habitaware.mighty["all-comments"].get({ query })) as ApiResponse;
          break;
        case "events":
          res = (await api.api.habitaware.mighty.events.get({ query })) as ApiResponse;
          break;
        case "courseworks":
          res = (await api.api.habitaware.mighty["all-courseworks"].get({ query })) as ApiResponse;
          break;
        case "plans":
          res = (await api.api.habitaware.mighty.plans.get({ query })) as ApiResponse;
          break;
        case "badges":
          res = (await api.api.habitaware.mighty.badges.get({ query })) as ApiResponse;
          break;
        case "tags":
          res = (await api.api.habitaware.mighty.tags.get({ query })) as ApiResponse;
          break;
        case "collections":
          res = (await api.api.habitaware.mighty.collections.get({ query })) as ApiResponse;
          break;
        case "invites":
          res = (await api.api.habitaware.mighty.invites.get({ query })) as ApiResponse;
          break;
        case "polls":
          res = (await api.api.habitaware.mighty.polls.get({ query })) as ApiResponse;
          break;
        case "subscriptions":
          res = (await api.api.habitaware.mighty.subscriptions.get({ query })) as ApiResponse;
          break;
        case "purchases":
          res = (await api.api.habitaware.mighty.purchases.get({ query })) as ApiResponse;
          break;
        case "custom_fields":
          res = (await api.api.habitaware.mighty.custom_fields.get({ query })) as ApiResponse;
          break;
        case "abuse_reports":
          res = (await api.api.habitaware.mighty.abuse_reports.get({ query })) as ApiResponse;
          break;
        default:
          return;
      }

      if (res.error) {
        setError(JSON.stringify(res.error.value, null, 2));
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function selectPostWithDetails(post: Post) {
    setSelectedPost(post);
    setPostComments([]);
    setPostReactions([]);
    setLoadingPostDetails(true);

    try {
      // Fetch comments and reactions in parallel
      const [commentsRes, reactionsRes] = await Promise.all([
        api.api.habitaware.mighty.posts({ postId: String(post.id) }).comments.get() as Promise<ApiResponse>,
        api.api.habitaware.mighty.posts({ postId: String(post.id) }).reactions.get() as Promise<ApiResponse>,
      ]);

      if (commentsRes.data && typeof commentsRes.data === "object" && "items" in commentsRes.data) {
        setPostComments((commentsRes.data as { items: Comment[] }).items || []);
      }

      if (reactionsRes.data && Array.isArray(reactionsRes.data)) {
        setPostReactions(reactionsRes.data as Reaction[]);
      } else if (reactionsRes.data && typeof reactionsRes.data === "object" && "items" in reactionsRes.data) {
        setPostReactions((reactionsRes.data as { items: Reaction[] }).items || []);
      }
    } catch (e) {
      console.error("Error loading post details:", e);
    } finally {
      setLoadingPostDetails(false);
    }
  }

  function closePostModal() {
    setSelectedPost(null);
    setPostComments([]);
    setPostReactions([]);
  }

  function selectMemberWithDetails(member: Member) {
    setSelectedMember(member);
  }

  function closeMemberModal() {
    setSelectedMember(null);
  }

  function selectEventWithDetails(event: Event) {
    setSelectedEvent(event);
  }

  function closeEventModal() {
    setSelectedEvent(null);
  }

  async function executeRawRequest() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = (await api.api.habitaware.mighty.proxy.post({
        endpoint: rawEndpoint,
        method: rawMethod,
      })) as ApiResponse;

      if (res.error) {
        setError(JSON.stringify(res.error.value, null, 2));
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const filteredData = useMemo(() => {
    if (!data || !search.trim()) return data;

    const searchLower = search.toLowerCase();
    const listData = data as ListResponse<Record<string, unknown>>;

    if (!listData.items) return data;

    const filtered = listData.items.filter((item) => {
      return Object.values(item).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === "object" && value !== null) {
          return Object.values(value).some(
            (v) => typeof v === "string" && v.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    });

    return { ...listData, items: filtered };
  }, [data, search]);

  const hasItems = (d: unknown): d is ListResponse<unknown> => {
    return d !== null && typeof d === "object" && "items" in d;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (cents: number, currency = "USD") => {
    if (!cents) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").slice(0, 100);
  };

  // Table renderers
  const getSubscriptionBadge = (status?: string, planName?: string) => {
    switch (status) {
      case "paid":
        return <span className="badge badge-paid" title={planName}>Paid</span>;
      case "trial":
        return <span className="badge badge-trial" title={planName}>Trial</span>;
      case "free":
        return <span className="badge badge-free" title={planName}>Free</span>;
      default:
        return <span className="badge">None</span>;
    }
  };

  const renderMembersTable = (items: Member[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Avatar</th>
          <th>Name</th>
          <th>Email</th>
          <th>Subscription</th>
          <th>Plan</th>
          <th>Location</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.id}>
            <td><img src={m.avatar} alt="" className="avatar" /></td>
            <td className="primary">{m.first_name} {m.last_name}</td>
            <td>{m.email}</td>
            <td>{getSubscriptionBadge(m.subscriptionStatus, m.subscription?.planName)}</td>
            <td className="plan-name">{m.subscription?.planName || "-"}</td>
            <td>{m.location || "-"}</td>
            <td>{formatDate(m.created_at)}</td>
            <td><button className="link-btn" onClick={() => selectMemberWithDetails(m)}>View</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSpacesTable = (items: Space[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Collection ID</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td className="mono">{s.id}</td>
            <td className="primary">{s.name}</td>
            <td className="mono">{s.collection_id}</td>
            <td>{formatDate(s.created_at)}</td>
            <td>{formatDate(s.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPostsTable = (items: Post[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>View</th>
          <th>Image</th>
          <th>ID</th>
          <th>Title</th>
          <th>Post Type</th>
          <th>Content Type</th>
          <th>Status</th>
          <th>Summary/Description</th>
          <th>Space ID</th>
          <th>Creator ID</th>
          <th>Comments</th>
          <th>Created</th>
          <th>Updated</th>
          <th>Published</th>
          <th>Last Activity</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => {
          const firstImage = p.images?.find((img) => img !== null);
          return (
            <tr key={p.id}>
              <td><button className="link-btn" onClick={() => selectPostWithDetails(p)}>View</button></td>
              <td>
                {firstImage ? (
                  <img src={firstImage} alt="" className="post-thumbnail" />
                ) : (
                  <span className="no-image">-</span>
                )}
              </td>
              <td className="mono">{p.id}</td>
              <td className="primary">{p.title || "(No title)"}</td>
              <td><span className="badge">{p.post_type}</span></td>
              <td><span className="badge">{p.content_type}</span></td>
              <td><span className="badge">{p.status}</span></td>
              <td className="preview">{stripHtml(p.summary || p.description || p.body || "")}</td>
              <td className="mono">{p.space_id}</td>
              <td className="mono">{p.creator_id}</td>
              <td>{p.comments_enabled ? "Yes" : "No"}</td>
              <td>{formatDate(p.created_at)}</td>
              <td>{formatDate(p.updated_at)}</td>
              <td>{formatDate(p.published_at)}</td>
              <td>{formatDate(p.last_activity_at)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderEventsTable = (items: Event[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Creator</th>
          <th>Starts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((e) => (
          <tr key={e.id}>
            <td className="primary">{e.title}</td>
            <td><span className="badge">{e.event_type}</span></td>
            <td>{e.creator?.name || "-"}</td>
            <td>{formatDate(e.starts_at)}</td>
            <td><button className="link-btn" onClick={() => selectEventWithDetails(e)}>View</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPlansTable = (items: Plan[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
          <th>Interval</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.id}>
            <td className="mono">{p.id}</td>
            <td className="primary">{p.name}</td>
            <td>{formatCurrency(p.price_cents, p.currency)}</td>
            <td><span className="badge">{p.interval || "one-time"}</span></td>
            <td>{formatDate(p.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderBadgesTable = (items: Badge[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Description</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((b) => (
          <tr key={b.id}>
            <td className="mono">{b.id}</td>
            <td className="primary">{b.name}</td>
            <td>{b.description || "-"}</td>
            <td>{formatDate(b.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTagsTable = (items: Tag[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t) => (
          <tr key={t.id}>
            <td className="mono">{t.id}</td>
            <td className="primary">{t.name}</td>
            <td>{formatDate(t.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCollectionsTable = (items: Collection[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.id}>
            <td className="mono">{c.id}</td>
            <td className="primary">{c.name}</td>
            <td>{formatDate(c.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderInvitesTable = (items: Invite[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id}>
            <td className="mono">{i.id}</td>
            <td className="primary">{i.email}</td>
            <td><span className="badge">{i.status}</span></td>
            <td>{formatDate(i.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPollsTable = (items: Poll[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Type</th>
          <th>Creator</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.id}>
            <td className="mono">{p.id}</td>
            <td className="primary">{p.title}</td>
            <td><span className="badge">{p.poll_type}</span></td>
            <td>{p.creator?.name || "-"}</td>
            <td>{formatDate(p.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSubscriptionsTable = (items: Subscription[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Plan</th>
          <th>Member</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td className="mono">{s.id}</td>
            <td className="primary">{s.plan_name || "-"}</td>
            <td>{s.member_email || "-"}</td>
            <td><span className="badge">{s.status}</span></td>
            <td>{formatDate(s.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPurchasesTable = (items: Purchase[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Plan</th>
          <th>Member</th>
          <th>Amount</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((p) => (
          <tr key={p.id}>
            <td className="mono">{p.id}</td>
            <td className="primary">{p.plan_name || "-"}</td>
            <td>{p.member_email || "-"}</td>
            <td>{formatCurrency(p.amount_cents)}</td>
            <td>{formatDate(p.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCustomFieldsTable = (items: CustomField[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Required</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((cf) => (
          <tr key={cf.id}>
            <td className="mono">{cf.id}</td>
            <td className="primary">{cf.name}</td>
            <td><span className="badge">{cf.field_type}</span></td>
            <td>{cf.required ? "Yes" : "No"}</td>
            <td>{formatDate(cf.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderAbuseReportsTable = (items: AbuseReport[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Reportable ID</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Reporter</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((ar) => (
          <tr key={ar.id}>
            <td className="mono">{ar.id}</td>
            <td><span className="badge">{ar.reportable_type}</span></td>
            <td className="mono">{ar.reportable_id}</td>
            <td className="preview">{ar.reason || "-"}</td>
            <td><span className="badge">{ar.status}</span></td>
            <td>{ar.reporter?.name || ar.reporter?.email || "-"}</td>
            <td>{formatDate(ar.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCommentsTable = (items: (Comment & { post_title?: string })[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Post</th>
          <th>Comment</th>
          <th>Creator</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.id}>
            <td className="mono">{c.id}</td>
            <td className="primary">{c.post_title || `Post #${c.post_id}`}</td>
            <td className="preview">{stripHtml(c.body || "")}</td>
            <td>{c.creator?.name || c.creator?.email || "-"}</td>
            <td>{formatDate(c.created_at)}</td>
            <td>{formatDate(c.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCourseworksTable = (items: (Coursework & { space_name?: string })[]) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Space</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {items.map((cw) => (
          <tr key={cw.id}>
            <td className="mono">{cw.id}</td>
            <td className="primary">{cw.title}</td>
            <td>{cw.space_name || `Space #${cw.space_id}`}</td>
            <td className="preview">{stripHtml(cw.description || "")}</td>
            <td><span className="badge">{cw.status}</span></td>
            <td>{formatDate(cw.created_at)}</td>
            <td>{formatDate(cw.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMeCard = (meData: MeData) => (
    <div className="me-card">
      <div className="me-avatar">
        <img src={meData.avatar} alt={meData.name || "Member"} />
      </div>
      <div className="me-info">
        <h3>{meData.name || `${meData.first_name || ""} ${meData.last_name || ""}`.trim() || "User"}</h3>
        <p className="me-email">{meData.email}</p>
        <p className="me-role"><span className="badge">{meData.role || "Admin"}</span></p>
        {(meData.bio || meData.short_bio) && <p className="me-bio">{meData.bio || meData.short_bio}</p>}
        <p className="me-joined">Joined: {formatDate(meData.created_at)}</p>
      </div>
    </div>
  );

  const toggleSpace = (spaceId: number) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data && typeof data === "object" && "spaces" in data) {
      const allIds = (data as { spaces: SpaceWithPosts[] }).spaces.map((s) => s.space.id);
      setExpandedSpaces(new Set(allIds));
    }
  };

  const collapseAll = () => {
    setExpandedSpaces(new Set());
  };

  const renderPostsBySpace = (spacesData: { spaces?: SpaceWithPosts[] }) => {
    if (!spacesData?.spaces || !Array.isArray(spacesData.spaces)) {
      return <p className="empty">No data available</p>;
    }

    const searchLower = search.toLowerCase();

    const filteredSpaces = spacesData.spaces
      .map((sw) => ({
        ...sw,
        posts: (sw.posts || []).filter((p) =>
          !search ||
          (p.title && p.title.toLowerCase().includes(searchLower)) ||
          (p.body && p.body.toLowerCase().includes(searchLower)) ||
          (p.creator?.name && p.creator.name.toLowerCase().includes(searchLower))
        ),
      }))
      .filter((sw) => sw.posts.length > 0 || sw.space.name.toLowerCase().includes(searchLower));

    if (filteredSpaces.length === 0) {
      return <p className="empty">No spaces or posts found</p>;
    }

    const totalPosts = filteredSpaces.reduce((acc, sw) => acc + sw.posts.length, 0);

    return (
      <div className="spaces-accordion">
        <div className="accordion-actions">
          <button onClick={expandAll} className="btn-secondary">Expand All</button>
          <button onClick={collapseAll} className="btn-secondary">Collapse All</button>
          <span className="accordion-stats">{filteredSpaces.length} spaces, {totalPosts} posts</span>
        </div>
        {filteredSpaces.map(({ space, posts }) => {
          const isExpanded = expandedSpaces.has(space.id);
          return (
            <div key={space.id} className="space-group">
              <button
                className={`space-header ${isExpanded ? "expanded" : ""}`}
                onClick={() => toggleSpace(space.id)}
              >
                <span className="collapse-icon">{isExpanded ? "▼" : "▶"}</span>
                <span className="space-name">{space.name}</span>
                <span className="post-count">{posts.length} posts</span>
              </button>
              {isExpanded && (
                <div className="space-posts">
                  {posts.length === 0 ? (
                    <p className="empty-space">No posts in this space</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>View</th>
                          <th>Image</th>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Post Type</th>
                          <th>Content Type</th>
                          <th>Status</th>
                          <th>Summary/Description</th>
                          <th>Creator ID</th>
                          <th>Comments</th>
                          <th>Created</th>
                          <th>Updated</th>
                          <th>Published</th>
                          <th>Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((p) => {
                          const firstImage = p.images?.find((img) => img !== null);
                          return (
                            <tr key={p.id}>
                              <td><button className="link-btn" onClick={() => selectPostWithDetails(p)}>View</button></td>
                              <td>
                                {firstImage ? (
                                  <img src={firstImage} alt="" className="post-thumbnail" />
                                ) : (
                                  <span className="no-image">-</span>
                                )}
                              </td>
                              <td className="mono">{p.id}</td>
                              <td className="primary">{p.title || "(No title)"}</td>
                              <td><span className="badge">{p.post_type}</span></td>
                              <td><span className="badge">{p.content_type}</span></td>
                              <td><span className="badge">{p.status}</span></td>
                              <td className="preview">{stripHtml(p.summary || p.description || p.body || "")}</td>
                              <td className="mono">{p.creator_id}</td>
                              <td>{p.comments_enabled ? "Yes" : "No"}</td>
                              <td>{formatDate(p.created_at)}</td>
                              <td>{formatDate(p.updated_at)}</td>
                              <td>{formatDate(p.published_at)}</td>
                              <td>{formatDate(p.last_activity_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPostDetailModal = () => {
    if (!selectedPost) return null;

    const p = selectedPost;
    const postContent = p.description || p.summary || p.body || "";

    return (
      <div className="modal-overlay" onClick={closePostModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{p.title || "(No title)"}</h2>
            <button className="modal-close" onClick={closePostModal}>×</button>
          </div>
          <div className="modal-body">
            <div className="post-content rich-content">
              <RichContent html={postContent} />
            </div>

            <div className="post-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Post ID</span>
                <span className="meta-value">{p.id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Space ID</span>
                <span className="meta-value">{p.space_id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Creator ID</span>
                <span className="meta-value">{p.creator_id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Post Type</span>
                <span className="meta-value"><span className="badge">{p.post_type}</span></span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Content Type</span>
                <span className="meta-value"><span className="badge">{p.content_type}</span></span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value"><span className="badge">{p.status}</span></span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Comments</span>
                <span className="meta-value">{p.comments_enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">{formatDate(p.created_at)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Updated</span>
                <span className="meta-value">{formatDate(p.updated_at)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Published</span>
                <span className="meta-value">{formatDate(p.published_at)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Activity</span>
                <span className="meta-value">{formatDate(p.last_activity_at)}</span>
              </div>
            </div>

            {/* Reactions Section */}
            <div className="post-section">
              <h3>Reactions {loadingPostDetails ? "(loading...)" : `(${postReactions.length})`}</h3>
              {postReactions.length > 0 ? (
                <div className="reactions-list">
                  {postReactions.map((r, idx) => (
                    <span key={idx} className="reaction-item">
                      <span className="reaction-type">{r.reaction_type}</span>
                      {r.user?.name && <span className="reaction-user">{r.user.name}</span>}
                    </span>
                  ))}
                </div>
              ) : (
                !loadingPostDetails && <p className="empty-section">No reactions yet</p>
              )}
            </div>

            {/* Comments Section */}
            <div className="post-section">
              <h3>Comments {loadingPostDetails ? "(loading...)" : `(${postComments.length})`}</h3>
              {postComments.length > 0 ? (
                <div className="comments-list">
                  {postComments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{c.creator?.name || c.creator?.email || "Unknown"}</span>
                        <span className="comment-date">{formatDate(c.created_at)}</span>
                      </div>
                      <div className="comment-body">
                        <RichContent html={c.body || ""} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loadingPostDetails && <p className="empty-section">No comments yet</p>
              )}
            </div>

            <div className="post-actions">
              <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Open in Mighty Networks
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberDetailModal = () => {
    if (!selectedMember) return null;

    const m = selectedMember;

    return (
      <div className="modal-overlay" onClick={closeMemberModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-with-avatar">
              <img src={m.avatar} alt="" className="modal-avatar" />
              <h2>{m.first_name} {m.last_name}</h2>
            </div>
            <button className="modal-close" onClick={closeMemberModal}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-section">
              <p className="detail-email">{m.email}</p>
              <p className="detail-location">{m.location || "No location provided"}</p>
              <div className="detail-badges">
                {getSubscriptionBadge(m.subscriptionStatus, m.subscription?.planName)}
              </div>
            </div>

            {m.bio && (
              <div className="post-section">
                <h3>Bio</h3>
                <div className="post-content rich-content">
                  <RichContent html={m.bio} />
                </div>
              </div>
            )}

            <div className="post-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Member ID</span>
                <span className="meta-value">{m.id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Joined</span>
                <span className="meta-value">{formatDate(m.created_at)}</span>
              </div>
            </div>

            <div className="post-actions">
              <a href={m.permalink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                View Profile in Mighty Networks
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetailModal = () => {
    if (!selectedEvent) return null;

    const e = selectedEvent;

    return (
      <div className="modal-overlay" onClick={closeEventModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{e.title}</h2>
            <button className="modal-close" onClick={closeEventModal}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-section">
              <div className="event-time-badge">
                <span className="badge">{e.event_type}</span>
                <span className="event-time">{formatDate(e.starts_at)} - {formatDate(e.ends_at)}</span>
              </div>
              <p className="detail-creator">Created by: {e.creator?.name || e.creator?.email || "Unknown"}</p>
            </div>

            <div className="post-section">
              <h3>Description</h3>
              <div className="post-content rich-content">
                <RichContent html={e.description} />
              </div>
            </div>

            <div className="post-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Event ID</span>
                <span className="meta-value">{e.id}</span>
              </div>
            </div>

            <div className="post-actions">
              <a href={e.permalink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                View Event in Mighty Networks
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    await sendQuestion(chatInput.trim());
    setChatInput("");
  }

  async function sendQuickQuestion(question: string) {
    if (chatLoading) return;
    await sendQuestion(question);
  }

  async function sendQuestion(question: string) {
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);

    try {
      const res = (await api.api.habitaware.chat.analyze.post({
        question: question,
        history: chatMessages,
        conversationId: conversationId || undefined,
        smartMemory: true, // Enable Smart Memory for brainstorming
        userContext: (meData && meData.id) ? {
          id: meData.id,
          email: meData.email || "",
          name: meData.name || "User",
          first_name: meData.first_name || "",
          last_name: meData.last_name || "",
          bio: meData.bio || meData.short_bio || ""
        } : undefined
      })) as ApiResponse;

      if (res.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error analyzing your data." },
        ]);
      } else {
        const data = res.data as { response: string; conversationId?: string };
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
          localStorage.setItem("habitaware_conversation_id", data.conversationId);
        }
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error analyzing your data. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function startNewChat() {
    setChatMessages([]);
    setConversationId(null);
    localStorage.removeItem("habitaware_conversation_id");
  }

  const renderAgentxNotes = () => {
    if (agentxLoading) {
      return <p className="loading">Loading notes...</p>;
    }

    if (!agentxContent) {
      return (
        <div className="agentx-empty">
          <p>No notes generated yet.</p>
          <p>Generate notes using the API: <code>POST /api/agentx/generate/{tab === "members_ai" ? "members" : "posts"}</code></p>
        </div>
      );
    }

    // Remove frontmatter for display (everything between --- markers)
    const contentWithoutFrontmatter = agentxContent.replace(/^---[\s\S]*?---\n*/m, "");

    return (
      <div className="agentx-container">
        <div
          className="markdown-content agentx-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(contentWithoutFrontmatter) as string }}
        />
      </div>
    );
  };

  // ─── Book Chat Functions ───────────────────────────────────────────
  async function sendBookChatMessage() {
    if (!bookInput.trim() || bookLoading) return;
    await sendBookQuestion(bookInput.trim());
    setBookInput("");
  }

  async function sendBookQuickQuestion(question: string) {
    if (bookLoading) return;
    await sendBookQuestion(question);
  }

  async function sendBookQuestion(question: string) {
    setBookMessages((prev) => [...prev, { role: "user", content: question }]);
    setBookLoading(true);

    try {
      const res = (await api.api.habitaware.chat["book-chat"].post({
        question: question,
        history: bookMessages,
        conversationId: bookConversationId || undefined,
        smartMemory: true,
        collection: bookCollection,
        orgId: bookOrgId,
        ragsterUrl: bookRagsterUrl,
        userContext: (meData && meData.id) ? {
          id: meData.id,
          email: meData.email || "",
          name: meData.name || "User"
        } : undefined
      })) as ApiResponse;

      if (res.error) {
        setBookMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't find an answer. The book chat service may be unavailable." },
        ]);
      } else {
        const data = res.data as any;
        const answer = data?.response || "I couldn't generate a response.";
        if (data.conversationId && data.conversationId !== bookConversationId) {
          setBookConversationId(data.conversationId);
          localStorage.setItem("habitaware_book_conversation_id", data.conversationId);
        }
        setBookMessages((prev) => [
          ...prev,
          { role: "assistant", content: answer },
        ]);
      }
    } catch (err) {
      setBookMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error connecting to the knowledge service. Please try again." },
      ]);
    } finally {
      setBookLoading(false);
    }
  }

  function startNewBookChat() {
    setBookMessages([]);
    setBookConversationId(null);
    localStorage.removeItem("habitaware_book_conversation_id");
  }

  const renderBookChat = () => (
    <div className="chat-container book-chat">
      <div className="chat-header">
        <div className="chat-info">
          <h3>Parenting Book Chat</h3>
          {bookConversationId && <span className="conv-id">ID: {bookConversationId.slice(0, 8)}</span>}
        </div>
        <button className="new-chat-btn" onClick={startNewBookChat}>New Chat</button>
      </div>
      <div className="chat-messages">
        {bookMessages.length === 0 && (
          <div className="chat-welcome book-welcome">
            <div className="book-welcome-icon">📖</div>
            <h3>Chat with the Parenting Book</h3>
            <p>Ask questions about the HabitAware parenting book. Click an example to get started:</p>
            <ul>
              <li onClick={() => sendBookQuickQuestion("What are the main themes of the book?")}>
                "What are the main themes of the book?"
              </li>
              <li onClick={() => sendBookQuickQuestion("How does the book define habit awareness in children?")}>
                "How does the book define habit awareness in children?"
              </li>
              <li onClick={() => sendBookQuickQuestion("What strategies does the book recommend for parents?")}>
                "What strategies does the book recommend for parents?"
              </li>
              <li onClick={() => sendBookQuickQuestion("Summarize the key takeaways from the book")}>
                "Summarize the key takeaways from the book"
              </li>
              <li onClick={() => sendBookQuickQuestion("What does the book say about building positive habits?")}>
                "What does the book say about building positive habits?"
              </li>
            </ul>
          </div>
        )}
        {bookMessages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="chat-message-header">
              {msg.role === "user" ? "You" : "📖 Book Assistant"}
            </div>
            <div className="chat-message-content">
              {msg.role === "assistant" ? (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {bookLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-header">📖 Book Assistant</div>
            <div className="chat-message-content">
              <span className="chat-typing">Searching the book...</span>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={bookInput}
          onChange={(e) => setBookInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendBookChatMessage()}
          placeholder="Ask about the parenting book..."
          className="chat-input"
          disabled={bookLoading}
        />
        <button onClick={sendBookChatMessage} disabled={bookLoading || !bookInput.trim()} className="chat-send">
          {bookLoading ? "..." : "Send"}
        </button>
      </div>

      {/* Admin Config Panel */}
      <div className="book-admin-toggle">
        <button
          onClick={() => {
            setShowBookConfig(!showBookConfig);
            if (!showBookConfig && bookCollections.length === 0) {
              // Load collections when opening
              setBookCollectionsLoading(true);
              api.api.knowledge.collections.get({ $query: { org_id: bookOrgId } })
                .then((res: any) => {
                  const data = res?.data as any;
                  const cols = data?.collections || data || [];
                  setBookCollections(Array.isArray(cols) ? cols : []);
                })
                .catch((err: any) => console.error('Failed to load collections:', err))
                .finally(() => setBookCollectionsLoading(false));
            }
          }}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
        >
          ⚙️ {showBookConfig ? 'Hide Config' : 'Ragster Config'}
        </button>
      </div>

      {showBookConfig && (
        <div className="book-admin-panel">
          <div className="book-admin-grid">
            <div className="book-admin-field">
              <label>Ragster API URL</label>
              <input
                type="text"
                value={bookRagsterUrl}
                onChange={(e) => setBookRagsterUrl(e.target.value)}
                className="chat-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div className="book-admin-field">
              <label>Organization ID</label>
              <input
                type="text"
                value={bookOrgId}
                onChange={(e) => setBookOrgId(e.target.value)}
                onBlur={() => {
                  // Reload collections when org changes
                  setBookCollectionsLoading(true);
                  api.api.knowledge.collections.get({ $query: { org_id: bookOrgId } })
                    .then((res: any) => {
                      const data = res?.data as any;
                      const cols = data?.collections || data || [];
                      setBookCollections(Array.isArray(cols) ? cols : []);
                    })
                    .catch(() => setBookCollections([]))
                    .finally(() => setBookCollectionsLoading(false));
                }}
                className="chat-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div className="book-admin-field">
              <label>Collection</label>
              {bookCollectionsLoading ? (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading collections...</span>
              ) : bookCollections.length > 0 ? (
                <select
                  value={bookCollection}
                  onChange={(e) => setBookCollection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-soft)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                >
                  {bookCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.chunk_count || 0} chunks)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={bookCollection}
                  onChange={(e) => setBookCollection(e.target.value)}
                  placeholder="Collection UUID"
                  className="chat-input"
                  style={{ fontSize: '0.85rem' }}
                />
              )}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Active: <strong>{bookCollections.find(c => c.id === bookCollection)?.name || bookCollection}</strong>
          </div>
        </div>
      )}
    </div>
  );

  const renderAIChat = () => (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-info">
          <h3>Community Insights</h3>
          {conversationId && <span className="conv-id">ID: {conversationId.slice(0, 8)}</span>}
        </div>
        <button className="new-chat-btn" onClick={startNewChat}>New Chat</button>
      </div>
      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-welcome">
            <h3>AI Analytics Assistant</h3>
            <p>Ask me questions about your Mighty Networks community data. Click an example to try:</p>
            <ul>
              <li onClick={() => sendQuickQuestion("What are the top areas people are discussing?")}>
                "What are the top areas people are discussing?"
              </li>
              <li onClick={() => sendQuickQuestion("What topics do members struggle with most?")}>
                "What topics do members struggle with most?"
              </li>
              <li onClick={() => sendQuickQuestion("Which spaces are most active?")}>
                "Which spaces are most active?"
              </li>
              <li onClick={() => sendQuickQuestion("What are the trends in recent posts?")}>
                "What are the trends in recent posts?"
              </li>
              <li onClick={() => sendQuickQuestion("Summarize the community engagement")}>
                "Summarize the community engagement"
              </li>
            </ul>
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="chat-message-header">
              {msg.role === "user" ? "You" : "AI Assistant"}
            </div>
            <div className="chat-message-content">
              {msg.role === "assistant" ? (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-header">AI Assistant</div>
            <div className="chat-message-content">
              <span className="chat-typing">Analyzing your community data...</span>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
          placeholder="Ask about your community data..."
          className="chat-input"
          disabled={chatLoading}
        />
        <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="chat-send">
          {chatLoading ? "..." : "Send"}
        </button>
        <button
          onClick={() => { setShowFeedbackModal(true); setFeedbackSuccess(false); }}
          className="btn-secondary"
          title="Send AI Feedback"
          style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}
        >
          💡 Feedback
        </button>
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💡 AI Feedback</h2>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {feedbackSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Thank you!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your feedback has been submitted.</p>
                  <button
                    className="btn-secondary"
                    style={{ marginTop: '1rem' }}
                    onClick={() => setShowFeedbackModal(false)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Share your feedback about the AI assistant — suggestions, issues, or ideas.
                  </p>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What would you like to share?"
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-soft)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                      Cancel
                    </button>
                    <button
                      className="chat-send"
                      disabled={!feedbackText.trim() || feedbackSubmitting}
                      onClick={async () => {
                        setFeedbackSubmitting(true);
                        try {
                          await api.api.feedback.post({
                            type: 'ai_feedback',
                            name: meData?.name || 'Anonymous',
                            email: meData?.email || '',
                            description: feedbackText.trim(),
                            metadata: {
                              source: 'habitaware-ai-chat',
                              messageCount: chatMessages.length,
                            },
                          });
                          setFeedbackText('');
                          setFeedbackSuccess(true);
                        } catch (err) {
                          console.error('Feedback error:', err);
                        } finally {
                          setFeedbackSubmitting(false);
                        }
                      }}
                    >
                      {feedbackSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTable = () => {
    if (!hasItems(filteredData)) return null;

    const items = filteredData.items;
    if (items.length === 0) {
      return <p className="empty">No results found</p>;
    }

    switch (tab) {
      case "members": return renderMembersTable(items as Member[]);
      case "spaces": return renderSpacesTable(items as Space[]);
      case "posts": return renderPostsTable(items as Post[]);
      case "comments": return renderCommentsTable(items as (Comment & { post_title?: string })[]);
      case "events": return renderEventsTable(items as Event[]);
      case "courseworks": return renderCourseworksTable(items as (Coursework & { space_name?: string })[]);
      case "plans": return renderPlansTable(items as Plan[]);
      case "badges": return renderBadgesTable(items as Badge[]);
      case "tags": return renderTagsTable(items as Tag[]);
      case "collections": return renderCollectionsTable(items as Collection[]);
      case "invites": return renderInvitesTable(items as Invite[]);
      case "polls": return renderPollsTable(items as Poll[]);
      case "subscriptions": return renderSubscriptionsTable(items as Subscription[]);
      case "purchases": return renderPurchasesTable(items as Purchase[]);
      case "custom_fields": return renderCustomFieldsTable(items as CustomField[]);
      case "abuse_reports": return renderAbuseReportsTable(items as AbuseReport[]);
      default: return null;
    }
  };

  const showTableControls = tab !== "network" && tab !== "raw" && tab !== "posts_by_space" && tab !== "me";
  const showPostsBySpaceControls = tab === "posts_by_space";
  const showViewToggle = tab !== "network" && tab !== "raw" && tab !== "me";
  const isMeTab = tab === "me";

  return (
    <div className="container">
      <header>
        <h1>HabitAware AI Analytics for Mighty Networks</h1>
        <div className="status">
          <span className={`status-dot ${status}`} />
          {status === "checking" && "Connecting..."}
          {status === "connected" && "Connected"}
          {status === "error" && "Server offline"}
        </div>
      </header>

      <div className="main-tabs">
        <button
          className={`main-tab-btn ${mainTab === "habitaware" ? "active" : ""}`}
          onClick={() => setMainTab("habitaware")}
        >
          1. HabitAware AI
        </button>
        <button
          className={`main-tab-btn ${mainTab === "book" ? "active" : ""}`}
          onClick={() => setMainTab("book")}
        >
          📖 Parenting Book
        </button>
        <button
          className={`main-tab-btn ${mainTab === "advanced" ? "active" : ""}`}
          onClick={() => setMainTab("advanced")}
        >
          2. Advanced
        </button>
        <button
          className={`main-tab-btn ${mainTab === "observer" ? "active" : ""}`}
          onClick={() => { setMainTab("observer"); loadFeedbackFiles(); }}
        >
          🔭 TheObserver
        </button>
      </div>

      {mainTab === "observer" ? (
        <div className="panel">
          <TheObserver panelMode />
        </div>
      ) : mainTab === "book" ? (
        <div className="panel book-panel">
          {renderBookChat()}
        </div>
      ) : mainTab === "habitaware" ? (
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-section">
              <button
                onClick={() => setTimeframeCollapsed((c) => !c)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  margin: 0,
                }}
              >
                <span className="sidebar-title">
                  Timeframe Filtering
                  {(startDate || endDate) && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                      active
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", fontWeight: 400 }}>
                  {timeframeCollapsed ? "▶" : "▼"}
                </span>
              </button>

              {!timeframeCollapsed && (
                <div className="timeframe-selector">
                  <div className="timeframe-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="timeframe-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              )}
            </div>

            {ANALYTICS_CATEGORIES.map((category) => (
              <div key={category.title} className="sidebar-section">
                <span className="sidebar-title">{category.title}</span>
                <div className="sidebar-list">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      className="sidebar-item"
                      onClick={() => {
                        let q = item.question;
                        if (startDate || endDate) {
                          q += ` (For timeframe: ${startDate || "all time"} to ${
                            endDate || "now"
                          })`;
                        }
                        sendQuickQuestion(q);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
          <main className="main-content panel">
            {renderAIChat()}
          </main>
        </div>
      ) : (
        <>
          <nav className="tabs-nav">
            {TABS.filter(t => !["ai_chat", "members_ai", "posts_ai"].includes(t.key)).map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "active" : ""}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

      <div className="panel">
        {tab === "ai_chat" ? (
          renderAIChat()
        ) : tab === "members_ai" || tab === "posts_ai" ? (
          <>
            <div className="panel-header">
              <h2>{tab === "members_ai" ? "Members AI Analytics" : "Posts AI Analytics"}</h2>
              <div className="header-actions">
                <button onClick={loadTabData} className="btn-secondary" disabled={agentxLoading}>
                  {agentxLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
            <div className="content-area">
              {error && <div className="error">{error}</div>}
              {renderAgentxNotes()}
            </div>
          </>
        ) : tab === "at_a_glance" ? (
          <AtAGlanceDashboard />
        ) : tab === "member_engagement" ? (
          <EngagementDashboard />
        ) : tab === "identity_zero" ? (
          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", height: "100%" }}>
            <IdentityZeroConsole />
          </div>
        ) : tab === "raw" ? (
          <>
            <h2>Raw API Request</h2>
            <div className="form-group">
              <label>Endpoint (use {"{network_id}"} as placeholder)</label>
              <input
                value={rawEndpoint}
                onChange={(e) => setRawEndpoint(e.target.value)}
                placeholder="/networks/{network_id}/..."
              />
            </div>
            <div className="form-group">
              <label>Method</label>
              <select value={rawMethod} onChange={(e) => setRawMethod(e.target.value)} className="select">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <button onClick={executeRawRequest} disabled={loading}>
              {loading ? "Loading..." : "Execute"}
            </button>
          </>
        ) : (
          <>
            <div className="panel-header">
              <h2>{TABS.find((t) => t.key === tab)?.label}</h2>
              <div className="header-actions">
                {showViewToggle && (
                  <div className="view-toggle">
                    <button className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")}>
                      Table
                    </button>
                    <button className={viewMode === "json" ? "active" : ""} onClick={() => setViewMode("json")}>
                      JSON
                    </button>
                  </div>
                )}
                {(showTableControls || showPostsBySpaceControls) && (
                  <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="select select-small">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                )}
                <button onClick={loadTabData} className="btn-secondary">Refresh</button>
              </div>
            </div>

            {(showTableControls || showPostsBySpaceControls) && (
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                {search && (
                  <button className="clear-search" onClick={() => setSearch("")}>Clear</button>
                )}
              </div>
            )}
          </>
        )}

        <div className="content-area">
          {loading && <p className="loading">Loading...</p>}
          {error && <div className="error">{error}</div>}

          {filteredData !== null && !loading && (
            <>
              {isMeTab && data && viewMode === "table" ? (
                renderMeCard(data as MeData)
              ) : showPostsBySpaceControls && data && viewMode === "table" ? (
                renderPostsBySpace(data as { spaces: SpaceWithPosts[] })
              ) : showTableControls && viewMode === "table" ? (
                <div className="table-container">
                  {renderTable()}
                  {hasItems(filteredData) && (
                    <div className="table-footer">
                      Showing {filteredData.items.length} items
                      {search && hasItems(data) && ` (filtered from ${(data as ListResponse<unknown>).items.length})`}
                    </div>
                  )}
                </div>
              ) : (
                <pre>{JSON.stringify(data, null, 2)}</pre>
              )}
            </>
          )}
        </div>
        </div>
      </>
    )}

      {renderPostDetailModal()}
      {renderMemberDetailModal()}
      {renderEventDetailModal()}

      {/* TheObserver floating button — always visible on every tab */}
      {mainTab !== "observer" && <TheObserver />}
    </div>
  );
}
