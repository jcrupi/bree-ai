import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Observable {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
  source?: "observer" | "feedback";
  metadata?: {
    name?: string;
    email?: string;
    originalType?: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_KEY = "theobserver_chat";
const API_URL = import.meta.env.VITE_API_URL || "https://bree-api.fly.dev";

const CATEGORIES = [
  { value: "behavior", label: "🔄 Behavior Pattern", color: "#6366f1" },
  { value: "trigger",  label: "⚡ Trigger",          color: "#f59e0b" },
  { value: "progress", label: "📈 Progress",          color: "#10b981" },
  { value: "challenge",label: "🧱 Challenge",         color: "#ef4444" },
  { value: "insight",  label: "💡 Insight",           color: "#8b5cf6" },
  { value: "general",  label: "📝 General",           color: "#64748b" },
];

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function loadChat(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; }
}
function saveChat(msgs: ChatMessage[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("bree_jwt");
  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

interface SubmitModalProps {
  onClose: () => void;
  onSaved: (obs: Observable) => void;
}

function SubmitModal({ onClose, onSaved }: SubmitModalProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/observations/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text: text.trim(), category, tags }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      onSaved(data.observation as Observable);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const catMeta = getCategoryMeta(category);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg-card, #1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 560, boxShadow: "0 24px 64px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔭</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary, #f1f5f9)" }}>New Observable</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>Saved to server — available across all devices</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text-secondary, #94a3b8)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Category pills */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  style={{ padding: "6px 12px", borderRadius: 99, border: category === c.value ? `1.5px solid ${c.color}` : "1.5px solid rgba(255,255,255,0.1)", background: category === c.value ? `${c.color}22` : "transparent", color: category === c.value ? c.color : "var(--text-secondary, #94a3b8)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                >{c.label}</button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Observable</label>
            <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
              placeholder="What did you observe? Be specific about the behavior, context, or pattern…"
              rows={5}
              style={{ width: "100%", marginTop: 8, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "var(--text-primary, #f1f5f9)", fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #94a3b8)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Tags</label>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              {tags.map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, fontSize: 12, color: "#a5b4fc" }}>
                  #{t}
                  <button onClick={() => setTags((p) => p.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
              <div style={{ display: "flex", gap: 6 }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  placeholder="add tag…"
                  style={{ padding: "5px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-primary, #f1f5f9)", fontSize: 12, width: 100 }}
                />
                <button onClick={addTag} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-secondary, #94a3b8)", fontSize: 12, cursor: "pointer" }}>+ Add</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "var(--text-secondary, #94a3b8)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!text.trim() || saving}
              style={{ padding: "10px 24px", background: text.trim() ? catMeta.color : "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, color: text.trim() ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700, cursor: text.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
            >{saving ? "Saving to server…" : "Save Observable"}</button>
          </div>
          <div style={{ textAlign: "right", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>⌘↵ to save</div>
        </div>
      </div>
    </div>
  );
}

// ─── Observables List ─────────────────────────────────────────────────────────

interface ObservablesListProps {
  observables: Observable[];
  loading: boolean;
  onRefresh: () => void;
}

function ObservablesList({ observables, loading, onRefresh }: ObservablesListProps) {
  const [search, setSearch] = useState("");

  const filtered = observables.filter((o) =>
    !search ||
    o.text.toLowerCase().includes(search.toLowerCase()) ||
    o.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
    (o.metadata?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search observables…"
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "var(--text-primary, #f1f5f9)", fontSize: 14 }}
        />
        <button onClick={onRefresh} disabled={loading}
          style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-secondary, #94a3b8)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >{loading ? "Loading…" : "🔄 Refresh"}</button>
      </div>

      {loading && observables.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary, #94a3b8)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Loading observables from server…</div>
        </div>
      )}

      {!loading && observables.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-secondary, #94a3b8)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔭</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", marginBottom: 8 }}>No observables yet</div>
          <div style={{ fontSize: 14 }}>Click the 🔭 button to record your first observable.</div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((obs) => {
          const cat = getCategoryMeta(obs.category);
          const isFromFeedback = obs.source === "feedback";
          return (
            <div key={obs.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${cat.color}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 9px", borderRadius: 99, background: `${cat.color}22`, color: cat.color, fontSize: 11, fontWeight: 700, border: `1px solid ${cat.color}44` }}>
                  {cat.label}
                </span>
                {isFromFeedback && (
                  <span style={{ padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "0.04em" }}>
                    📡 CONVERTED
                  </span>
                )}
                {obs.metadata?.name && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>{obs.metadata.name}</span>}
                {obs.metadata?.email && <span style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)" }}>{obs.metadata.email}</span>}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{formatDate(obs.createdAt)}</span>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.65, color: "var(--text-primary, #f1f5f9)", whiteSpace: "pre-wrap" }}>{obs.text}</p>
              {obs.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {obs.tags.map((t) => (
                    <span key={t} style={{ padding: "2px 8px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 99, fontSize: 11, color: "#a5b4fc" }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && search && (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary, #94a3b8)", fontSize: 14 }}>No observables match "{search}".</div>
        )}
      </div>
    </div>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

interface ObserverChatProps {
  observables: Observable[];
}

function ObserverChat({ observables }: ObserverChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function buildContext() {
    if (observables.length === 0) return "No observables have been recorded yet.";
    return observables.map((o, i) => {
      const cat = getCategoryMeta(o.category);
      const who = o.metadata?.name ? ` | From: ${o.metadata.name}${o.metadata.email ? ` <${o.metadata.email}>` : ""}` : "";
      const tags = o.tags.length ? ` | Tags: ${o.tags.map((t) => `#${t}`).join(", ")}` : "";
      const src = o.source === "feedback" ? " [converted from feedback]" : "";
      return `[${i + 1}] ${cat.label}${src} — ${formatDate(o.createdAt)}${who}${tags}\n${o.text}`;
    }).join("\n\n");
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
      const context = buildContext();
      const questionWithContext = observables.length > 0
        ? `You are analyzing TheObserver data for HabitAware — a set of behavioral observables.\n\n${context}\n\n---\n\nQuestion: ${q}`
        : q;
      const res = await fetch(`${API_URL}/api/habitaware/chat/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          question: questionWithContext,
          history: updated.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply: ChatMessage = { role: "assistant", content: data.response ?? "No response." };
      const final = [...updated, reply];
      setMessages(final);
      saveChat(final);
    } catch (e) {
      const err: ChatMessage = { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed to get response."}` };
      const final = [...updated, err];
      setMessages(final);
      saveChat(final);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What patterns do you see across all observables?",
    "What are the main behavioral triggers identified?",
    "Where is the most progress being made?",
    "What should we focus on next?",
    "Summarize the observables by category",
    "What feedback themes appear most frequently?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 480 }}>
      {/* Context banner */}
      <div style={{ padding: "10px 16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 8 }}>
        <span>🔭</span>
        <span>Analyzing <strong>{observables.length}</strong> observable{observables.length !== 1 ? "s" : ""} — {observables.filter(o => o.source === "feedback").length} converted from feedback</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ padding: "24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>Ask anything about the observables</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-secondary, #94a3b8)", fontSize: 12, cursor: "pointer", textAlign: "left" }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: 14, lineHeight: 1.65, color: "var(--text-primary, #f1f5f9)" }}>
              {msg.role === "assistant"
                ? <div className="rich-html" dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }} style={{ fontSize: 14 }} />
                : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "12px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((n) => (
                <span key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: `bounce 1.2s ${n * 0.2}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about your observables…" disabled={loading}
          style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--text-primary, #f1f5f9)", fontSize: 14, fontFamily: "inherit" }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{ padding: "12px 20px", background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all 0.2s", whiteSpace: "nowrap" }}
        >Ask AI ↑</button>
      </div>
      {messages.length > 0 && (
        <button onClick={() => { setMessages([]); saveChat([]); }} style={{ marginTop: 8, background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", textAlign: "right", width: "100%" }}>
          Clear conversation
        </button>
      )}
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── TheObserver Panel ────────────────────────────────────────────────────────

interface TheObserverPanelProps {
  observables: Observable[];
  loading: boolean;
  onRefresh: () => void;
}

function TheObserverPanel({ observables, loading, onRefresh }: TheObserverPanelProps) {
  const [activeView, setActiveView] = useState<"list" | "chat">("list");

  // Stats
  const categoryStats = CATEGORIES.map((c) => ({
    ...c, count: observables.filter((o) => o.category === c.value).length,
  })).filter((c) => c.count > 0);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary, #f1f5f9)", display: "flex", alignItems: "center", gap: 10 }}>
          <span>🔭</span> TheObserver
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #94a3b8)", fontSize: 14 }}>
          All observables — server-backed, cross-device, powered by AI
        </p>
      </div>

      {/* Stats */}
      {categoryStats.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
          {categoryStats.map((c) => (
            <div key={c.value} style={{ padding: "14px 16px", background: `${c.color}11`, border: `1px solid ${c.color}33`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.count}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {(["list", "chat"] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: activeView === v ? "rgba(99,102,241,0.25)" : "transparent", color: activeView === v ? "#a5b4fc" : "var(--text-secondary, #94a3b8)", fontWeight: activeView === v ? 700 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}
          >
            {v === "list" ? `📋 Observables (${observables.length})` : "🧠 AI Analysis"}
          </button>
        ))}
      </div>

      {activeView === "list"
        ? <ObservablesList observables={observables} loading={loading} onRefresh={onRefresh} />
        : <ObserverChat observables={observables} />
      }
    </div>
  );
}

// ─── Floating Action Button ───────────────────────────────────────────────────

interface TheObserverProps {
  panelMode?: boolean;
}

export default function TheObserver({ panelMode = false }: TheObserverProps) {
  const [observables, setObservables] = useState<Observable[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pulse, setPulse] = useState(false);

  const fetchObservables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/observations/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setObservables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[TheObserver] fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (panelMode) fetchObservables();
  }, [panelMode, fetchObservables]);

  function handleSaved(obs: Observable) {
    setObservables((prev) => [obs, ...prev]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }

  return (
    <>
      {/* Floating Action Button — always visible */}
      <button
        id="theobserver-fab"
        onClick={() => setShowModal(true)}
        title="New Observable"
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 8888,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          boxShadow: pulse
            ? "0 0 0 8px rgba(99,102,241,0.25), 0 8px 24px rgba(99,102,241,0.5)"
            : "0 4px 20px rgba(99,102,241,0.4)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
          transition: "box-shadow 0.3s ease, transform 0.15s ease",
          transform: pulse ? "scale(1.08)" : "scale(1)",
        }}
      >
        🔭
        {observables.length > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#10b981", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "2px 6px", minWidth: 18, textAlign: "center", border: "2px solid var(--bg-primary, #0f172a)" }}>
            {observables.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {panelMode && (
        <TheObserverPanel observables={observables} loading={loading} onRefresh={fetchObservables} />
      )}

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSaved={(obs) => { handleSaved(obs); fetchObservables(); }}
        />
      )}
    </>
  );
}
