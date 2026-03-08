import { useState, useEffect, useRef } from "react";
import { marked } from "marked";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Observation {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
}

/** Shape coming from GET /api/feedback on bree-api */
export interface ServerFeedback {
  filename?: string;
  type?: string;
  name?: string;
  email?: string;
  description?: string;
  receivedAt?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "habitaware_observations";
const CHAT_KEY = "habitaware_observer_chat";

const CATEGORIES = [
  { value: "behavior", label: "🔄 Behavior Pattern", color: "#6366f1" },
  { value: "trigger", label: "⚡ Trigger", color: "#f59e0b" },
  { value: "progress", label: "📈 Progress", color: "#10b981" },
  { value: "challenge", label: "🧱 Challenge", color: "#ef4444" },
  { value: "insight", label: "💡 Insight", color: "#8b5cf6" },
  { value: "general", label: "📝 General", color: "#64748b" },
];

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

function loadObservations(): Observation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveObservations(obs: Observation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));
}

function loadChat(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveChat(msgs: ChatMessage[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

interface SubmitModalProps {
  onClose: () => void;
  onSaved: (obs: Observation) => void;
}

function SubmitModal({ onClose, onSaved }: SubmitModalProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    const obs: Observation = {
      id: `obs-${Date.now()}`,
      text: text.trim(),
      category,
      tags,
      createdAt: new Date().toISOString(),
    };
    const existing = loadObservations();
    saveObservations([obs, ...existing]);
    onSaved(obs);
    setSaving(false);
    onClose();
  }

  const catMeta = getCategoryMeta(category);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-card, #1e293b)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 560,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔍</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary, #f1f5f9)" }}>
                New Observation
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>
                Record what you notice about behaviors or patterns
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "var(--text-secondary, #94a3b8)",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Category pills */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Category
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 99,
                    border: category === c.value ? `1.5px solid ${c.color}` : "1.5px solid rgba(255,255,255,0.1)",
                    background: category === c.value ? `${c.color}22` : "transparent",
                    color: category === c.value ? c.color : "var(--text-secondary, #94a3b8)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Observation
            </label>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
              placeholder="What did you observe? Be specific about the behavior, context, or pattern..."
              rows={5}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "var(--text-primary, #f1f5f9)",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Tags
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 99,
                    fontSize: 12,
                    color: "#a5b4fc",
                  }}
                >
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", fontSize: 14, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  placeholder="add tag..."
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "var(--text-primary, #f1f5f9)",
                    fontSize: 12,
                    width: 100,
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "var(--text-secondary, #94a3b8)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "var(--text-secondary, #94a3b8)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              style={{
                padding: "10px 24px",
                background: text.trim() ? catMeta.color : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 10,
                color: text.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 14,
                fontWeight: 700,
                cursor: text.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {saving ? "Saving…" : "Save Observation"}
            </button>
          </div>
          <div style={{ textAlign: "right", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            ⌘↵ to save
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Observations List ────────────────────────────────────────────────────────

interface ObservationsListProps {
  observations: Observation[];
  onDelete: (id: string) => void;
  serverFeedback?: ServerFeedback[];
  onRefreshServerFeedback?: () => void;
  serverFeedbackLoading?: boolean;
}

function ObservationsList({ observations, onDelete, serverFeedback = [], onRefreshServerFeedback, serverFeedbackLoading }: ObservationsListProps) {
  const [search, setSearch] = useState("");

  // Normalise server feedback into a display-compatible shape
  const serverItems = serverFeedback.map((fb, i) => ({
    _id: `server-${i}`,
    _isServer: true,
    text: fb.description ?? JSON.stringify(fb),
    type: fb.type ?? "general",
    name: fb.name,
    email: fb.email,
    createdAt: fb.receivedAt ?? "",
    raw: fb,
  }));

  const totalCount = observations.length + serverItems.length;

  const filteredLocal = observations.filter((o) =>
    !search || o.text.toLowerCase().includes(search.toLowerCase()) || o.tags.some((t) => t.includes(search.toLowerCase()))
  );

  const filteredServer = serverItems.filter((s) =>
    !search ||
    s.text.toLowerCase().includes(search.toLowerCase()) ||
    (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (totalCount === 0 && !serverFeedbackLoading) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-secondary, #94a3b8)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 8 }}>
          No observations yet
        </div>
        <div style={{ fontSize: 14 }}>
          Click the 🔍 button to record your first observation.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all observations…"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "9px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "var(--text-primary, #f1f5f9)",
            fontSize: 14,
          }}
        />
        {onRefreshServerFeedback && (
          <button
            onClick={onRefreshServerFeedback}
            disabled={serverFeedbackLoading}
            style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-secondary, #94a3b8)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {serverFeedbackLoading ? "Loading…" : "🔄 Refresh"}
          </button>
        )}
      </div>

      {serverFeedbackLoading && (
        <div style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary, #94a3b8)", fontSize: 13 }}>Loading server feedback…</div>
      )}

      {/* Unified card list */}
      <div style={{ display: "grid", gap: 12 }}>
        {/* Local observations first */}
        {filteredLocal.map((obs) => {
          const cat = getCategoryMeta(obs.category);
          return (
            <div
              key={obs.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${cat.color}`,
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "3px 9px", borderRadius: 99, background: `${cat.color}22`, color: cat.color, fontSize: 11, fontWeight: 700, border: `1px solid ${cat.color}44` }}>
                    {cat.label}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{formatDate(obs.createdAt)}</span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.65, color: "var(--text-primary, #f1f5f9)", whiteSpace: "pre-wrap" }}>
                  {obs.text}
                </p>
                {obs.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {obs.tags.map((t) => (
                      <span key={t} style={{ padding: "2px 8px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 99, fontSize: 11, color: "#a5b4fc" }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { if (confirm("Delete this observation?")) onDelete(obs.id); }}
                title="Delete"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 16, padding: 4, borderRadius: 6, flexShrink: 0, lineHeight: 1 }}
              >×</button>
            </div>
          );
        })}

        {/* Server feedback items */}
        {filteredServer.map((s) => {
          const typeColor = s.type === "bug" ? "#ef4444" : s.type === "feature" ? "#6366f1" : "#64748b";
          return (
            <div
              key={s._id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${typeColor}`,
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44` }}>
                  {s.type}
                </span>
                <span style={{ padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "0.04em" }}>
                  📡 SERVER
                </span>
                {s.name && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>{s.name}</span>}
                {s.email && <span style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)" }}>{s.email}</span>}
                {s.createdAt && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{formatDate(s.createdAt)}</span>}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-primary, #f1f5f9)" }}>{s.text}</p>
            </div>
          );
        })}

        {filteredLocal.length === 0 && filteredServer.length === 0 && search && (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary, #94a3b8)", fontSize: 14 }}>
            No observations match "{search}".
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

interface ObserverChatProps {
  observations: Observation[];
  serverFeedback?: ServerFeedback[];
}

function ObserverChat({ observations, serverFeedback = [] }: ObserverChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://bree-api.fly.dev";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildContext() {
    const parts: string[] = [];

    if (observations.length > 0) {
      parts.push("=== LOCAL OBSERVATIONS ===");
      parts.push(
        observations
          .map(
            (o, i) =>
              `[${i + 1}] (${getCategoryMeta(o.category).label} — ${formatDate(o.createdAt)})${
                o.tags.length ? ` Tags: ${o.tags.map((t) => `#${t}`).join(", ")}` : ""
              }\n${o.text}`
          )
          .join("\n\n")
      );
    }

    if (serverFeedback.length > 0) {
      parts.push("\n=== SERVER FEEDBACK (from bree-api) ===");
      parts.push(
        serverFeedback
          .map(
            (fb, i) =>
              `[F${i + 1}] (${fb.type ?? "general"} — ${fb.receivedAt ? new Date(fb.receivedAt).toLocaleString() : "unknown date"})${
                fb.name ? ` From: ${fb.name}${fb.email ? ` <${fb.email}>` : ""}` : ""
              }\n${fb.description ?? JSON.stringify(fb)}`
          )
          .join("\n\n")
      );
    }

    if (parts.length === 0) return "No observations or feedback have been recorded yet.";
    return parts.join("\n\n");
  }

  async function sendMessage() {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: "user", content: q };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChat(updated);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("bree_jwt");

      // Build the observation context as part of the question so the /analyze endpoint
      // can include it in its system prompt via the userContext or prepended question.
      const context = buildContext();
      const questionWithContext = observations.length > 0 || serverFeedback.length > 0
        ? `Below are behavioral observations to analyze:\n\n${context}\n\n---\n\nQuestion: ${q}`
        : q;

      const res = await fetch(`${API_URL}/api/habitaware/chat/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: questionWithContext,
          history: updated.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      const reply: ChatMessage = {
        role: "assistant",
        content: data.response ?? "No response.",
      };
      const final = [...updated, reply];
      setMessages(final);
      saveChat(final);
    } catch (e) {
      const err: ChatMessage = {
        role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : "Failed to get response."}`,
      };
      const final = [...updated, err];
      setMessages(final);
      saveChat(final);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What patterns do you see across my observations?",
    "What are the main triggers I've identified?",
    "Where am I making the most progress?",
    "What should I focus on next?",
    "Summarize my observations by category",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 480 }}>
      {/* Context summary */}
      <div
        style={{
          padding: "10px 16px",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 10,
          marginBottom: 16,
          fontSize: 12,
          color: "#a5b4fc",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>🔍</span>
        <span>
          Analyzing <strong>{observations.length}</strong> local observation{observations.length !== 1 ? "s" : ""}
          {serverFeedback.length > 0 && (
            <> + <strong>{serverFeedback.length}</strong> server feedback item{serverFeedback.length !== 1 ? "s" : ""}</>
          )}
        </span>
        {observations.length === 0 && serverFeedback.length === 0 && (
          <span style={{ color: "#f59e0b" }}>— record some observations first to get better insights</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ padding: "24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>
                Ask me anything about your observations
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "var(--text-secondary, #94a3b8)",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.05)",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                fontSize: 14,
                lineHeight: 1.65,
                color: "var(--text-primary, #f1f5f9)",
              }}
            >
              {msg.role === "assistant" ? (
                <div
                  className="rich-html"
                  dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }}
                  style={{ fontSize: 14 }}
                />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px 16px 16px 4px",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#6366f1",
                    display: "inline-block",
                    animation: `bounce 1.2s ${n * 0.2}s infinite ease-in-out`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about your observations…"
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "var(--text-primary, #f1f5f9)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 20px",
            background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)",
            border: "none",
            borderRadius: 12,
            color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: 700,
            fontSize: 14,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          Ask AI ↑
        </button>
      </div>
      {messages.length > 0 && (
        <button
          onClick={() => { setMessages([]); saveChat([]); }}
          style={{
            marginTop: 8,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.2)",
            fontSize: 12,
            cursor: "pointer",
            textAlign: "right",
            width: "100%",
          }}
        >
          Clear conversation
        </button>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Observer Panel (main page view) ─────────────────────────────────────────

interface ObserverPanelProps {
  observations: Observation[];
  onDelete: (id: string) => void;
  serverFeedback?: ServerFeedback[];
  serverFeedbackLoading?: boolean;
  onRefreshServerFeedback?: () => void;
}

function ObserverPanel({ observations, onDelete, serverFeedback = [], serverFeedbackLoading, onRefreshServerFeedback }: ObserverPanelProps) {
  const [activeView, setActiveView] = useState<"list" | "chat">("list");

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", display: "flex", alignItems: "center", gap: 10 }}>
          <span>🔍</span> Observer
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #94a3b8)", fontSize: 14 }}>
          Record and analyze behavioral observations powered by AI
        </p>
      </div>

      {/* Stats row */}
      {observations.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {CATEGORIES.map((c) => {
            const count = observations.filter((o) => o.category === c.value).length;
            if (count === 0) return null;
            return (
              <div
                key={c.value}
                style={{
                  padding: "14px 16px",
                  background: `${c.color}11`,
                  border: `1px solid ${c.color}33`,
                  borderRadius: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{count}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* View toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {(["list", "chat"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: activeView === v ? "rgba(99,102,241,0.25)" : "transparent",
              color: activeView === v ? "#a5b4fc" : "var(--text-secondary, #94a3b8)",
              fontWeight: activeView === v ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {v === "list"
              ? `📋 Observations (${observations.length}${serverFeedback.length ? ` + ${serverFeedback.length} server` : ""})`
              : "🧠 AI Analysis"}
          </button>
        ))}
      </div>

      {activeView === "list" ? (
        <ObservationsList
          observations={observations}
          onDelete={onDelete}
          serverFeedback={serverFeedback}
          serverFeedbackLoading={serverFeedbackLoading}
          onRefreshServerFeedback={onRefreshServerFeedback}
        />
      ) : (
        <ObserverChat observations={observations} serverFeedback={serverFeedback} />
      )}
    </div>
  );
}

// ─── Floating Observer Button ─────────────────────────────────────────────────

interface ObserverProps {
  /** If provided, renders the full page panel instead of just the floating button */
  panelMode?: boolean;
  serverFeedback?: ServerFeedback[];
  serverFeedbackLoading?: boolean;
  onRefreshServerFeedback?: () => void;
}

export default function Observer({ panelMode = false, serverFeedback = [], serverFeedbackLoading, onRefreshServerFeedback }: ObserverProps) {
  const [observations, setObservations] = useState<Observation[]>(() => loadObservations());
  const [showModal, setShowModal] = useState(false);
  const [pulse, setPulse] = useState(false);

  function handleSaved(obs: Observation) {
    setObservations((prev) => [obs, ...prev]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }

  function handleDelete(id: string) {
    const updated = observations.filter((o) => o.id !== id);
    setObservations(updated);
    saveObservations(updated);
  }

  return (
    <>
      {/* Floating button — always visible */}
      <button
        id="observer-fab"
        onClick={() => setShowModal(true)}
        title="New Observation"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 8888,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          boxShadow: pulse
            ? "0 0 0 8px rgba(99,102,241,0.25), 0 8px 24px rgba(99,102,241,0.5)"
            : "0 4px 20px rgba(99,102,241,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          transition: "box-shadow 0.3s ease",
          transform: pulse ? "scale(1.08)" : "scale(1)",
        }}
      >
        🔍
        {observations.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#10b981",
              color: "#fff",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 6px",
              minWidth: 18,
              textAlign: "center",
              border: "2px solid var(--bg-primary, #0f172a)",
            }}
          >
            {observations.length}
          </span>
        )}
      </button>

      {/* If in panel mode, also render the full panel */}
      {panelMode && (
        <ObserverPanel
          observations={observations}
          onDelete={handleDelete}
          serverFeedback={serverFeedback}
          serverFeedbackLoading={serverFeedbackLoading}
          onRefreshServerFeedback={onRefreshServerFeedback}
        />
      )}

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
