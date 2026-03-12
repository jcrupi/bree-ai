/**
 * Observer — Playbook Review Observation & AI Analysis for Playbook.ai
 * Adapted from the Billy Relativity Observer.
 * AI context is playbook-specific: specialty rules, algos findings, domain insights.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Attachment {
  name: string;
  mime: string;
  data: string; // base64
  size: number; // original bytes
}

export interface Observable {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
  app?: string;
  source?: "observer";
  metadata?: { name?: string; email?: string };
  attachments?: Attachment[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_KEY = "playbook_ai_observer_chat";

const CATEGORIES = [
  { value: "rule-gap", label: "⚠️ Rule Gap", color: "#f59e0b" },
  { value: "algo-issue", label: "🔧 Algo Issue", color: "#ef4444" },
  { value: "insight", label: "💡 Insight", color: "#6366f1" },
  { value: "feedback", label: "📝 Feedback", color: "#10b981" },
  { value: "question", label: "❓ Question", color: "#8b5cf6" },
  { value: "general", label: "📋 General", color: "#64748b" },
];

function getCat(value: string) {
  return (
    CATEGORIES.find((c) => c.value === value) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

async function fetchObservablesFromServer(): Promise<Observable[]> {
  const res = await fetch("/api/observations");
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return (data.data ?? []) as Observable[];
}

async function postObservableToServer(payload: {
  text: string;
  category: string;
  tags: string[];
  attachments?: Attachment[];
}): Promise<Observable> {
  const res = await fetch("/api/observations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.observation as Observable;
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (obs: Observable) => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}\nAllowed: images (PNG, JPG, GIF, WebP, SVG) and PDFs.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        alert(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size is 10 MB.`);
        continue;
      }
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      setAttachments((prev) => [
        ...prev,
        { name: file.name, mime: file.type, data: base64, size: file.size },
      ]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleSave() {
    if (!text.trim()) return;
    try {
      const obs = await postObservableToServer({
        text: text.trim(),
        category,
        tags,
        attachments: attachments.length ? attachments : undefined,
      });
      onSaved(obs);
      onClose();
    } catch {
      // Fallback: create locally if server unreachable
      const obs: Observable = {
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(),
        category,
        tags,
        createdAt: new Date().toISOString(),
        app: "playbook-ai",
        source: "observer",
        attachments: attachments.length ? attachments : undefined,
      };
      onSaved(obs);
      onClose();
    }
  }

  const catMeta = getCat(category);

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 540,
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
            <span style={{ fontSize: 22 }}>🔭</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>
                New Observation
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Saved to server — scoped to Playbook.ai
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
              color: "#94a3b8",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Category pills */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Category
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 99,
                    border:
                      category === c.value
                        ? `1.5px solid ${c.color}`
                        : "1.5px solid rgba(255,255,255,0.1)",
                    background:
                      category === c.value ? `${c.color}22` : "transparent",
                    color: category === c.value ? c.color : "#94a3b8",
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
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Observation
            </label>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
              }}
              placeholder="What did you notice? e.g. Rule HIP.PRV.003 may be missing a carve-out for business associates, the HIPAA algo flow gets stuck on dual-role scenarios…"
              rows={5}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#f1f5f9",
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
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Tags
            </label>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    background: "rgba(13,148,136,0.15)",
                    border: "1px solid rgba(13,148,136,0.3)",
                    borderRadius: 99,
                    fontSize: 12,
                    color: "#5eead4",
                  }}
                >
                  #{t}
                  <button
                    onClick={() => setTags((p) => p.filter((x) => x !== t))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#5eead4",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="hipaa, algo, rule-id…"
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                    width: 130,
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#94a3b8",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Attachments
            </label>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: 8,
                padding: "16px",
                border: `2px dashed ${dragOver ? "#0d9488" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 12,
                background: dragOver ? "rgba(13,148,136,0.08)" : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Drop images or PDFs here, or <span style={{ color: "#0d9488", textDecoration: "underline" }}>clickto browse</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                PNG, JPG, GIF, WebP, SVG, PDF · Max 10 MB each
              </div>
            </div>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files) processFiles(e.target.files); }}
            />

            {/* Previews */}
            {attachments.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      flexShrink: 0,
                    }}
                  >
                    {att.mime === "application/pdf" ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 28 }}>📄</span>
                        <span style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", padding: "0 4px", wordBreak: "break-all", lineHeight: 1.2 }}>
                          {att.name.length > 12 ? att.name.slice(0, 10) + "…" : att.name}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={`data:${att.mime};base64,${att.data}`}
                        alt={att.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAttachments((p) => p.filter((_, j) => j !== i)); }}
                      title="Remove"
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.65)",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        lineHeight: "18px",
                        textAlign: "center",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                    {/* Size label */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.55)",
                        fontSize: 9,
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                        padding: "2px 0",
                      }}
                    >
                      {formatFileSize(att.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                color: "#94a3b8",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              style={{
                padding: "10px 24px",
                background: text.trim()
                  ? catMeta.color
                  : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 10,
                color: text.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 14,
                fontWeight: 700,
                cursor: text.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              Save Observation{attachments.length > 0 ? ` + ${attachments.length} file${attachments.length > 1 ? "s" : ""}` : ""}
            </button>
          </div>
          <div
            style={{
              textAlign: "right",
              marginTop: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
            }}
          >
            ⌘↵ to save
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Observations List ────────────────────────────────────────────────────────

function ObservationsList({
  observables,
  onRefresh,
}: {
  observables: Observable[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = observables.filter(
    (o) =>
      !search ||
      o.text.toLowerCase().includes(search.toLowerCase()) ||
      o.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search observations…"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "9px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#f1f5f9",
            fontSize: 14,
          }}
        />
        <button
          onClick={onRefresh}
          style={{
            padding: "8px 14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#94a3b8",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {observables.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            color: "#94a3b8",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔭</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: 8,
            }}
          >
            No observations yet
          </div>
          <div style={{ fontSize: 14 }}>
            Tap the 🔭 button to record a playbook rule gap, algo issue, or
            insight.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((obs) => {
          const cat = getCat(obs.category);
          return (
            <div
              key={obs.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${cat.color}`,
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: 99,
                    background: `${cat.color}22`,
                    color: cat.color,
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid ${cat.color}44`,
                  }}
                >
                  {cat.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    marginLeft: "auto",
                  }}
                >
                  {formatDate(obs.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#f1f5f9",
                  whiteSpace: "pre-wrap",
                }}
              >
                {obs.text}
              </p>
              {obs.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: obs.attachments?.length ? 10 : 0 }}>
                  {obs.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "2px 8px",
                        background: "rgba(13,148,136,0.12)",
                        border: "1px solid rgba(13,148,136,0.2)",
                        borderRadius: 99,
                        fontSize: 11,
                        color: "#5eead4",
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Attachment thumbnails */}
              {obs.attachments && obs.attachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {obs.attachments.map((att, i) => (
                    att.mime === "application/pdf" ? (
                      <a
                        key={i}
                        href={`data:${att.mime};base64,${att.data}`}
                        download={att.name}
                        title={att.name}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 3,
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          textDecoration: "none",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 26 }}>📄</span>
                        <span style={{ fontSize: 9, color: "#f87171", textAlign: "center", padding: "0 4px", wordBreak: "break-all", lineHeight: 1.2 }}>
                          {att.name.length > 10 ? att.name.slice(0, 9) + "…" : att.name}
                        </span>
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={`data:${att.mime};base64,${att.data}`}
                        download={att.name}
                        title={att.name}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.1)",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={`data:${att.mime};base64,${att.data}`}
                          alt={att.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && search && (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No observations match "{search}".
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Chat (Playbook context) ────────────────────────────────────────────────

function ObserverChat({ observables }: { observables: Observable[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildContext() {
    if (observables.length === 0) return "No observations recorded yet.";
    return observables
      .map((o, i) => {
        const cat = getCat(o.category);
        const tags = o.tags.length
          ? ` | Tags: ${o.tags.map((t) => `#${t}`).join(", ")}`
          : "";
        return `[${i + 1}] ${cat.label} — ${formatDate(o.createdAt)}${tags}\n${o.text}`;
      })
      .join("\n\n");
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
      const systemContext =
        observables.length > 0
          ? `You are an expert playbook and medical/tax coding analyst assistant embedded in Playbook.ai.

The user has recorded the following observations about specialty playbooks and algorithms (rule gaps, algo issues, insights, feedback):

${context}

---

Answer the following question in the context of specialty playbooks, algorithm rules, HIPAA compliance, and 1040 tax coding. Be specific and actionable.

Question: ${q}`
          : `You are an expert playbook and medical/tax coding analyst. Answer this question about specialty playbooks, algorithms, and compliance:\n\n${q}`;

      const res = await fetch(`${window.location.origin}/api/observer/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: systemContext,
          history: updated
            .slice(0, -1)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = (data.answer ?? data.response) || "No response from AI.";
      } else {
        replyText = `⚠️ AI unavailable (HTTP ${res.status}). Check that the server is running and OPENAI_API_KEY is configured.`;
      }

      const final = [
        ...updated,
        { role: "assistant" as const, content: replyText },
      ];
      setMessages(final);
      saveChat(final);
    } catch (e) {
      const final = [
        ...updated,
        {
          role: "assistant" as const,
          content: `⚠️ Network error: ${e instanceof Error ? e.message : String(e)}.`,
        },
      ];
      setMessages(final);
      saveChat(final);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What rule gaps have I captured?",
    "Summarize all observations by category",
    "What algo issues should I prioritize?",
    "Are there any patterns in my observations?",
    "What insights can you draw from my notes?",
    "Which observations relate to HIPAA compliance?",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 480,
      }}
    >
      {/* Context banner */}
      <div
        style={{
          padding: "10px 16px",
          background: "rgba(13,148,136,0.08)",
          border: "1px solid rgba(13,148,136,0.15)",
          borderRadius: 10,
          marginBottom: 16,
          fontSize: 12,
          color: "#5eead4",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>🔭</span>
        <span>
          Analyzing <strong>{observables.length}</strong> playbook observation
          {observables.length !== 1 ? "s" : ""} — AI context is specialty &
          compliance aware
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {messages.length === 0 && (
          <div style={{ padding: "24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>
                Ask anything about your playbook observations
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#94a3b8",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
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
                borderRadius:
                  msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #0d9488, #0f766e)"
                    : "rgba(255,255,255,0.05)",
                border:
                  msg.role === "assistant"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
                fontSize: 14,
                lineHeight: 1.65,
                color: "#f1f5f9",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
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
                    background: "#0d9488",
                    display: "inline-block",
                    animation: `obs-bounce 1.2s ${n * 0.2}s infinite ease-in-out`,
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask about your playbook observations…"
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#f1f5f9",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 20px",
            background:
              input.trim() && !loading
                ? "linear-gradient(135deg, #0d9488, #0f766e)"
                : "rgba(255,255,255,0.06)",
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
          onClick={() => {
            setMessages([]);
            saveChat([]);
          }}
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
      <style>{`@keyframes obs-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── Observer Panel ────────────────────────────────────────────────────────────

function ObserverPanel({
  observables,
  onRefresh,
  loadError,
}: {
  observables: Observable[];
  onRefresh: () => void;
  loadError?: string;
}) {
  const [activeView, setActiveView] = useState<"list" | "chat">("list");

  const categoryStats = CATEGORIES.map((c) => ({
    ...c,
    count: observables.filter((o) => o.category === c.value).length,
  })).filter((c) => c.count > 0);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>🔭</span> <span>Observer</span>
        </h2>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
          Capture rule gaps, algo issues, and insights during playbook review —
          saved to server
        </p>
        {loadError && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              fontSize: 12,
              color: "#dc2626",
            }}
          >
            ⚠️ Could not load from server: {loadError}
          </div>
        )}
      </div>

      {categoryStats.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {categoryStats.map((c) => (
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
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>
                {c.count}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "rgba(0,0,0,0.04)",
          padding: 4,
          borderRadius: 10,
          width: "fit-content",
        }}
      >
        {(["list", "chat"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background:
                activeView === v ? "rgba(13,148,136,0.15)" : "transparent",
              color: activeView === v ? "#0d9488" : "#64748b",
              fontWeight: activeView === v ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {v === "list"
              ? `📋 Observations (${observables.length})`
              : "🧠 AI Analysis"}
          </button>
        ))}
      </div>

      {activeView === "list" ? (
        <ObservationsList observables={observables} onRefresh={onRefresh} />
      ) : (
        <div
          style={{
            background: "#1e293b",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <ObserverChat observables={observables} />
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ObserverProps {
  panelMode?: boolean;
}

export default function Observer({ panelMode = false }: ObserverProps) {
  const [observables, setObservables] = useState<Observable[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchObservablesFromServer();
      setObservables(data);
      setLoadError("");
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to load observations",
      );
    }
  }, []);

  useEffect(() => {
    // Always load observations on mount — ensures FAB badge count is correct
    // and the panel shows current data when switching to Observer tab
    refresh();
  }, [refresh]);

  function handleSaved(obs: Observable) {
    setObservables((prev) => [obs, ...prev]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    refresh();
  }

  return (
    <>
      {/* Floating Action Button — always visible */}
      <button
        id="observer-fab"
        onClick={() => setShowModal(true)}
        title="New Observation (Observer)"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 8888,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d9488, #0f766e)",
          border: "none",
          boxShadow: pulse
            ? "0 0 0 8px rgba(13,148,136,0.25), 0 8px 24px rgba(13,148,136,0.5)"
            : "0 4px 20px rgba(13,148,136,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          transition: "box-shadow 0.3s ease, transform 0.15s ease",
          transform: pulse ? "scale(1.08)" : "scale(1)",
        }}
      >
        🔭
        {observables.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#f59e0b",
              color: "#fff",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 5px",
              minWidth: 17,
              textAlign: "center",
              border: "2px solid #fff",
            }}
          >
            {observables.length}
          </span>
        )}
      </button>

      {/* Panel (when observer tab is active) */}
      {panelMode && (
        <ObserverPanel
          observables={observables}
          onRefresh={refresh}
          loadError={loadError}
        />
      )}

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSaved={(obs) => handleSaved(obs)}
        />
      )}
    </>
  );
}
