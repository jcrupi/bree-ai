import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Users,
  Send,
  Sparkles,
  Eye,
  Shield,
  MessageSquare,
  Zap,
  ChevronRight,
  Activity,
  Plus,
  Copy,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Mail,
  Download,
  Code,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useVillageVine } from "../hooks/useVillageVine";

// Types for consistent message handling
interface AssessmentMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isInjection?: boolean;
}

export function TalentVillageBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole =
    (searchParams.get("role") as "candidate" | "expert") || "candidate";
  const initialName = searchParams.get("name") || "";
  const urlIsLead = searchParams.get("isLead");
  const initialIsLead = urlIsLead === "true";
  const isInvitedExpert = initialRole === "expert" && urlIsLead === "false";
  const [role, setRole] = useState<"candidate" | "expert">(initialRole);
  const [userName, setUserName] = useState<string>(initialName);
  const [hasEnteredName, setHasEnteredName] = useState(!!initialName);
  const [tempName, setTempName] = useState("");
  const [isLeadRole, setIsLeadRole] = useState<boolean>(initialIsLead);
  const hideMirror = searchParams.get("hideMirror") === "true";

  const [inputText, setInputText] = useState("");
  const [expertInput, setExpertInput] = useState("");
  const [injectionInput, setInjectionInput] = useState("");

  // AI Feature State
  const [isAutoAIEnabled, setIsAutoAIEnabled] = useState(false);
  const [isAutoSuggestEnabled, setIsAutoSuggestEnabled] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [isActingAsCandidate, setIsActingAsCandidate] = useState(false);
  const [simulationInput, setSimulationInput] = useState("");

  // Question Designer State
  const [specialty, setSpecialty] = useState("React");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "junior" | "expert"
  >("junior");
  const [seed, setSeed] = useState("");
  const [generatedQuestion, setGeneratedQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // Code Snippet Mode
  const [snippetMode, setSnippetMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [generatedSnippet, setGeneratedSnippet] = useState("");

  // Profile switcher: which panel to show in expert view
  const [viewProfile, setViewProfile] = useState<
    "candidate" | "self" | "experts"
  >("self");

  // Talent Vine creation (Lead Expert only)
  const [showCreateVine, setShowCreateVine] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"expert" | "candidate">(
    "expert",
  );
  const [createdVineLink, setCreatedVineLink] = useState("");
  const [createdVineId, setCreatedVineId] = useState("");
  const [vineLinkCopied, setVineLinkCopied] = useState(false);

  // Collapsible State
  const [isExpertChatCollapsed, setIsExpertChatCollapsed] = useState(false);
  const [isBottomToolsCollapsed, setIsBottomToolsCollapsed] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // Lead Link PIN modal
  const [isLeadLinkOpen, setIsLeadLinkOpen] = useState(false);
  const [leadPin, setLeadPin] = useState("");
  const [leadPinError, setLeadPinError] = useState(false);
  const [leadLinkUnlocked, setLeadLinkUnlocked] = useState(false);
  const [leadLinkCopied, setLeadLinkCopied] = useState(false);

  // Expert chat permission state (Lead controls which experts can chat with candidate)
  const [enabledExperts, setEnabledExperts] = useState<Set<string>>(new Set());
  const [canChatWithCandidate, setCanChatWithCandidate] = useState(false);
  // Tool observer state (Lead grants read-only Lead tools access to specific experts)
  const [toolObservers, setToolObservers] = useState<Set<string>>(new Set());
  const [canObserveLeadTools, setCanObserveLeadTools] = useState(false);

  // Stealth monitoring state (copy/paste alerts)
  const [stealthAlerts, setStealthAlerts] = useState<
    { id: string; event: string; text: string; ts: string }[]
  >([]);
  const [stealthDismissed, setStealthDismissed] = useState<Set<string>>(
    new Set(),
  );

  // Determine if the user is the Lead expert. Invited experts (isLead=false in URL) are never Lead.
  const isLead = isInvitedExpert
    ? false
    : isLeadRole ||
      userName === "Expert 1" ||
      userName.toLowerCase().includes("lead");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const expertEndRef = useRef<HTMLDivElement>(null);

  // Update userName if search param changes
  useEffect(() => {
    const nameParam = searchParams.get("name");
    if (nameParam) {
      setUserName(nameParam);
      setHasEnteredName(true);
    }
  }, [searchParams]);

  const villageId = searchParams.get("villageId") || "";
  const villageName = searchParams.get("villageName") || "Talent Village";
  const leadEmail = searchParams.get("leadEmail") || "";
  const scheduledDate = searchParams.get("scheduledDate") || "";
  const scheduledTime = searchParams.get("scheduledTime") || "";

  // Format scheduled date for display
  const scheduledLabel = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return "";
    const d = new Date(scheduledDate + "T12:00:00");
    const dateLabel = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${dateLabel} · ${scheduledTime}`;
  }, [scheduledDate, scheduledTime]);

  // Email summary to lead
  const handleEmailSummary = () => {
    if (!leadEmail) return;
    const subject = encodeURIComponent(
      `[TalentVillage] Session Summary — ${villageName}`,
    );
    const body = encodeURIComponent(
      `Hi Lead,\n\n` +
        `Here is a summary for your Talent Village session.\n\n` +
        `📌 Village: ${villageName}\n` +
        (scheduledDate && scheduledTime
          ? `🗓  Scheduled: ${scheduledLabel}\n`
          : "") +
        `\n🔗 Your Lead Link (pin: 20816):\n` +
        `${window.location.origin}/talent-village?role=expert&isLead=true&name=${encodeURIComponent(userName)}${villageId ? `&villageId=${villageId}` : ""}` +
        `\n\n— TalentVillage.ai`,
    );
    window.location.href = `mailto:${leadEmail}?subject=${subject}&body=${body}`;
  };

  // iCal download for Lead
  const handleDownloadLeadIcal = () => {
    if (!scheduledDate || !scheduledTime) return;

    // Minimal iCal helpers (inlined so no external dep needed)
    function padTwo(n: number) {
      return String(n).padStart(2, "0");
    }
    function parseTime(s: string): { h: number; m: number } {
      const match = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return { h: 9, m: 0 };
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
      return { h, m };
    }
    function toUTCStr(date: string, timeStr: string, offsetMins = 0): string {
      const { h, m } = parseTime(timeStr);
      const [y, mo, d] = date.split("-").map(Number);
      const dt = new Date(y, mo - 1, d, h, m + offsetMins, 0);
      return `${dt.getUTCFullYear()}${padTwo(dt.getUTCMonth() + 1)}${padTwo(dt.getUTCDate())}T${padTwo(dt.getUTCHours())}${padTwo(dt.getUTCMinutes())}00Z`;
    }
    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${padTwo(now.getUTCMonth() + 1)}${padTwo(now.getUTCDate())}T${padTwo(now.getUTCHours())}${padTwo(now.getUTCMinutes())}${padTwo(now.getUTCSeconds())}Z`;
    const uid = `${Date.now()}-lead-${Math.random().toString(36).slice(2, 9)}@talentvillage.ai`;
    const leadLink = `${window.location.origin}/talent-village?role=expert&isLead=true&name=${encodeURIComponent(userName)}${villageId ? `&villageId=${villageId}` : ""}`;
    const safeTitle = `TalentVillage: ${villageName}`.replace(/,/g, "\\,");
    const safeLocation = leadLink.replace(/,/g, "\\,");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TalentVillage.ai//Scheduling//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toUTCStr(scheduledDate, scheduledTime)}`,
      `DTEND:${toUTCStr(scheduledDate, scheduledTime, 60)}`,
      `SUMMARY:${safeTitle}`,
      `DESCRIPTION:Lead Village Session\\nJoin as Lead: ${safeLocation}`,
      `LOCATION:${safeLocation}`,
      `ORGANIZER;CN=${userName}:MAILTO:${leadEmail || "noreply@talentvillage.ai"}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talentvillage-${villageName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-lead.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // LIVE NATS VINES
  // 1. Assessment Vine: Shared between Candidate and Expert (Mirror)
  const {
    isConnected: isAssessmentConnected,
    messages: assessmentMessages,
    sendMessage: sendAssessmentMessage,
  } = useVillageVine({
    vineId: villageId
      ? `talent-assessment-live-${villageId}`
      : "talent-assessment-live",
    userName: userName,
    onMessage: (msg) => {
      console.log("Assessment Message:", msg);
    },
  });

  // 2. Private Expert Vine: Only for Experts
  const {
    isConnected: isExpertConnected,
    messages: privateExpertMessages,
    sendMessage: sendPrivateExpertMessage,
  } = useVillageVine({
    vineId:
      role === "expert"
        ? villageId
          ? `talent-expert-private-live-${villageId}`
          : "talent-expert-private-live"
        : null,
    userName: userName,
  });

  // 3. Assessment Queue Vine: For moderated interventions
  const { messages: queueMessages, sendMessage: sendQueueMessage } =
    useVillageVine({
      vineId:
        role === "expert"
          ? villageId
            ? `talent-assessment-queue-live-${villageId}`
            : "talent-assessment-queue-live"
          : null,
      userName: userName,
    });

  // 4. Permissions Vine: Lead broadcasts which experts can chat with candidate
  const { messages: permissionMessages, sendMessage: sendPermissionMessage } =
    useVillageVine({
      vineId:
        role === "expert"
          ? villageId
            ? `talent-permissions-live-${villageId}`
            : "talent-permissions-live"
          : null,
      userName: userName,
    });

  // 5. Stealth Vine: Candidate copy/paste/cut events → Lead/Expert alerts
  const { messages: stealthMessages, sendMessage: sendStealthMessage } =
    useVillageVine({
      vineId: villageId
        ? `talent-stealth-live-${villageId}`
        : "talent-stealth-live",
      userName: userName,
    });

  // Derive the list of unique expert names from expert vine messages
  const expertRoster = useMemo(() => {
    const names = new Set<string>();
    privateExpertMessages.forEach((msg) => {
      const senderIsLead =
        msg.sender === "Expert 1" || msg.sender.toLowerCase().includes("lead");
      if (!senderIsLead) {
        names.add(msg.sender);
      }
    });
    return Array.from(names);
  }, [privateExpertMessages]);

  // Listen for permission updates (non-lead experts)
  useEffect(() => {
    if (isLead) return;
    // Find the latest PERMISSIONS message
    for (let i = permissionMessages.length - 1; i >= 0; i--) {
      try {
        const data = JSON.parse(permissionMessages[i].content);
        if (data.type === "PERMISSIONS") {
          setCanChatWithCandidate(data.enabledExperts.includes(userName));
          setCanObserveLeadTools(
            !!(data.toolObservers && data.toolObservers.includes(userName)),
          );
          break;
        }
      } catch {
        /* skip */
      }
    }
  }, [permissionMessages, userName, isLead]);

  // Lead: broadcast permissions when enabledExperts or toolObservers changes
  const broadcastPermissions = (
    chatSet: Set<string>,
    observerSet: Set<string>,
  ) => {
    sendPermissionMessage(
      userName,
      JSON.stringify({
        type: "PERMISSIONS",
        enabledExperts: Array.from(chatSet),
        toolObservers: Array.from(observerSet),
      }),
    );
  };

  const toggleExpertPermission = (expertName: string) => {
    setEnabledExperts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expertName)) newSet.delete(expertName);
      else newSet.add(expertName);
      broadcastPermissions(newSet, toolObservers);
      return newSet;
    });
  };

  const toggleToolObserver = (expertName: string) => {
    setToolObservers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expertName)) newSet.delete(expertName);
      else newSet.add(expertName);
      broadcastPermissions(enabledExperts, newSet);
      return newSet;
    });
  };

  // Candidate: attach copy/paste/cut listeners and broadcast over stealth vine
  useEffect(() => {
    if (role !== "candidate") return;

    const handleCopy = () => {
      const text = window.getSelection()?.toString() || "";
      sendStealthMessage(
        userName,
        JSON.stringify({
          type: "STEALTH",
          event: "copy",
          text: text.slice(0, 200),
          ts: new Date().toISOString(),
        }),
      ).catch(() => {});
    };

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") || "";
      sendStealthMessage(
        userName,
        JSON.stringify({
          type: "STEALTH",
          event: "paste",
          text: text.slice(0, 200),
          ts: new Date().toISOString(),
        }),
      ).catch(() => {});
    };

    const handleCut = () => {
      const text = window.getSelection()?.toString() || "";
      sendStealthMessage(
        userName,
        JSON.stringify({
          type: "STEALTH",
          event: "cut",
          text: text.slice(0, 200),
          ts: new Date().toISOString(),
        }),
      ).catch(() => {});
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste as EventListener);
    document.addEventListener("cut", handleCut);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste as EventListener);
      document.removeEventListener("cut", handleCut);
    };
  }, [role, userName, sendStealthMessage]);

  // Lead/Expert: parse incoming stealth messages into alerts
  useEffect(() => {
    if (role !== "expert") return;
    stealthMessages.forEach((msg) => {
      try {
        const data = JSON.parse(msg.content);
        if (data.type === "STEALTH") {
          setStealthAlerts((prev) => {
            if (prev.some((a) => a.id === msg.id)) return prev;
            return [
              ...prev,
              { id: msg.id, event: data.event, text: data.text, ts: data.ts },
            ];
          });
        }
      } catch {
        /* skip non-stealth messages */
      }
    });
  }, [stealthMessages, role]);

  // Parse queue messages to get active items.
  // Only messages with a well-formed { type: 'PROPOSE' } payload are treated as queue items.
  // Plain-text messages (e.g. from the Expert Vine Chat) are silently skipped.
  const assessmentQueue = useMemo(() => {
    const items: {
      id: string;
      expert: string;
      content: string;
      status: "pending" | "sent" | "deleted";
      isAI?: boolean;
    }[] = [];

    queueMessages.forEach((msg) => {
      try {
        const data = JSON.parse(msg.content);
        if (data.type === "PROPOSE") {
          items.push({
            id: msg.id,
            expert: msg.sender,
            content: data.text,
            status: "pending",
            isAI: data.isAI,
          });
        } else if (data.type === "RESOLVE") {
          const item = items.find((i) => i.id === data.targetId);
          if (item) item.status = data.status;
        }
        // Any other typed message (PERMISSIONS, etc.) is intentionally ignored here.
      } catch (e) {
        // Not a JSON queue command — silently skip. This prevents plain expert
        // chat messages from being surfaced as pending queue items.
      }
    });

    return items.filter((i) => i.status === "pending");
  }, [queueMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    expertEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assessmentMessages, privateExpertMessages]);

  // Handlers
  const handleSendCandidateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await sendAssessmentMessage(userName, inputText);
      setInputText("");

      // AI response disabled per user request
    } catch (err) {
      console.error("Failed to send candidate message:", err);
    }
  };

  const handleSendExpertMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertInput.trim()) return;

    try {
      await sendPrivateExpertMessage(userName, expertInput);
      setExpertInput("");
    } catch (err) {
      console.error("Failed to send expert message:", err);
    }
  };

  const handleProposeToQueue = async (
    content: string,
    isAI: boolean = false,
  ) => {
    if (!content.trim()) return;
    try {
      await sendQueueMessage(
        userName,
        JSON.stringify({
          type: "PROPOSE",
          text: content,
          isAI,
        }),
      );
      setInjectionInput("");
      setGeneratedQuestion(""); // Clear designer if it was from there
      setGeneratedSnippet("");
    } catch (err) {
      console.error("Failed to propose to queue:", err);
    }
  };

  // Build the combined snippet+question payload for sending
  const buildSnippetPayload = () => {
    if (!snippetMode || !generatedSnippet.trim()) return generatedQuestion;
    return `\`\`\`${codeLanguage}\n${generatedSnippet}\n\`\`\`\n\n${generatedQuestion}`;
  };

  const handleQueueAction = async (
    id: string,
    action: "send" | "delete",
    text?: string,
  ) => {
    try {
      if (action === "send") {
        await sendAssessmentMessage(userName, text || "");
        await sendQueueMessage(
          userName,
          JSON.stringify({ type: "RESOLVE", targetId: id, status: "sent" }),
        );
      } else {
        await sendQueueMessage(
          userName,
          JSON.stringify({ type: "RESOLVE", targetId: id, status: "deleted" }),
        );
      }
    } catch (err) {
      console.error("Failed to resolve queue item:", err);
    }
  };

  const handleInjectQuestion = async (
    e?: React.FormEvent,
    customContent?: string,
  ) => {
    e?.preventDefault();
    const content = customContent || injectionInput;
    if (!content.trim()) return;

    if (isLead) {
      try {
        await sendAssessmentMessage(userName, content);
        if (!customContent) setInjectionInput("");
        if (
          customContent === generatedQuestion ||
          customContent === buildSnippetPayload()
        ) {
          setGeneratedQuestion("");
          setGeneratedSnippet("");
        }
      } catch (err) {
        console.error("Failed to inject question:", err);
      }
    } else {
      handleProposeToQueue(content);
    }
  };

  // Renders message content, parsing ```lang...``` fenced code blocks
  const renderMessageContent = (content: string) => {
    const fenceRe = /```([\w+-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = fenceRe.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{content.slice(lastIndex, match.index)}</span>,
        );
      }
      const lang = match[1] || "code";
      const code = match[2];
      parts.push(
        <div
          key={key++}
          className="mt-2 mb-2 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0f1117] text-left"
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Code size={10} className="text-indigo-400" />
              {lang}
            </span>
          </div>
          <pre className="px-4 py-3 text-[11px] text-green-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? <>{parts}</> : <>{content}</>;
  };

  const handleSendSimulationMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationInput.trim()) return;
    try {
      await sendAssessmentMessage("Candidate", simulationInput);
      setSimulationInput("");
    } catch (err) {
      console.error("Failed to send simulation message:", err);
    }
  };

  const handleGenerateQuestion = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // ── Text-question templates ──────────────────────────────────────────
      const questionTemplates: Record<string, string[]> = {
        React: [
          `Can you explain how you would handle state management in a large-scale ${seed || "React"} application?`,
          `What are the advantages of using ${seed || "hooks"} over class components in this context?`,
          `How would you optimize performance for a complex list rendering in ${seed || "React"}?`,
        ],
        Node: [
          `Describe the event loop in Node.js and how it relates to ${seed || "asynchronous I/O"}.`,
          `How do you handle error management in a ${seed || "distributed"} Node ecosystem?`,
          `What's your approach to securing a ${seed || "REST API"} using Node?`,
        ],
        Python: [
          `Explain the difference between generators and regular functions in Python, especially for ${seed || "large datasets"}.`,
          `How would you design a ${seed || "RESTful"} API using FastAPI with async support?`,
          `What patterns would you use to manage ${seed || "dependency injection"} in a Python project?`,
        ],
        Architecture: [
          `Design a system that handles ${seed || "real-time data"} with high availability.`,
          `Explain the trade-offs between microservices and a monolith for ${seed || "this project"}.`,
          `How do you ensure data consistency across ${seed || "multiple databases"}?`,
        ],
      };

      // ── Code-snippet templates ───────────────────────────────────────────
      type SnippetKey = "React" | "Node" | "Python" | "Architecture";
      const snippetTemplates: Record<
        SnippetKey,
        { lang: string; code: string }[]
      > = {
        React: [
          {
            lang: "typescript",
            code: `// ${difficulty} level — ${seed || "Custom Hook"}
import { useState, useEffect } from 'react';

function useFetchData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}`,
          },
          {
            lang: "typescript",
            code: `// ${difficulty} level — Context API + Reducer
import React, { createContext, useContext, useReducer } from 'react';

type Action = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' };
type State = { count: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    case 'DECREMENT': return { count: state.count - 1 };
    case 'RESET':     return { count: 0 };
    default: return state;
  }
}

const CounterCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function CounterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return <CounterCtx.Provider value={{ state, dispatch }}>{children}</CounterCtx.Provider>;
}

export function useCounter() {
  const ctx = useContext(CounterCtx);
  if (!ctx) throw new Error('useCounter must be inside CounterProvider');
  return ctx;
}`,
          },
        ],
        Node: [
          {
            lang: "typescript",
            code: `// ${difficulty} level — Express middleware & error handling
import express, { Request, Response, NextFunction } from 'express';

const app = express();

// Rate limiter middleware
const requestCounts = new Map<string, number>();
function rateLimit(max: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? 'unknown';
    const count = (requestCounts.get(ip) ?? 0) + 1;
    requestCounts.set(ip, count);
    if (count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

app.use(rateLimit(100));

app.get('/api/${seed || "resource"}', async (req, res, next) => {
  try {
    // TODO: implement logic
    res.json({ data: [] });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

export default app;`,
          },
        ],
        Python: [
          {
            lang: "python",
            code: `# ${difficulty} level — async FastAPI endpoint with ${seed || "pagination"}
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Item(BaseModel):
    id: int
    name: str
    value: float

_items: List[Item] = [Item(id=i, name=f"item_{i}", value=i * 1.5) for i in range(1, 101)]

@app.get("/items", response_model=List[Item])
async def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    return _items[skip : skip + limit]

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    if item_id < 1 or item_id > len(_items):
        raise HTTPException(status_code=404, detail="Item not found")
    return _items[item_id - 1]`,
          },
        ],
        Architecture: [
          {
            lang: "typescript",
            code: `// ${difficulty} level — Event-driven pub/sub for ${seed || "microservices"}
type Handler<T> = (payload: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Handler<unknown>[]>();

  subscribe<T>(event: string, handler: Handler<T>) {
    const list = (this.handlers.get(event) ?? []) as Handler<T>[];
    list.push(handler);
    this.handlers.set(event, list as Handler<unknown>[]);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<T>(event: string, handler: Handler<T>) {
    const list = (this.handlers.get(event) ?? []).filter(h => h !== handler);
    this.handlers.set(event, list);
  }

  async publish<T>(event: string, payload: T) {
    const handlers = (this.handlers.get(event) ?? []) as Handler<T>[];
    await Promise.all(handlers.map(h => h(payload)));
  }
}

export const bus = new EventBus();
// Usage:
// const off = bus.subscribe<{userId: string}>('user.created', async e => { /* ... */ });
// await bus.publish('user.created', { userId: '42' });`,
          },
        ],
      };

      const qList =
        questionTemplates[specialty] || questionTemplates["Architecture"];
      const question = qList[Math.floor(Math.random() * qList.length)];

      if (snippetMode) {
        const sKey =
          (specialty as SnippetKey) in snippetTemplates
            ? (specialty as SnippetKey)
            : "Architecture";
        const sOptions = snippetTemplates[sKey];
        const chosen = sOptions[Math.floor(Math.random() * sOptions.length)];
        setGeneratedSnippet(chosen.code);
        setCodeLanguage(chosen.lang);

        // Question must be about the code snippet above
        const codeQuestions = [
          `Looking at the code above, can you walk me through what this ${chosen.lang} implementation does step by step?`,
          `Take a look at the snippet above. What potential issues or edge cases do you see in this implementation?`,
          `Review the code above — how would you improve or refactor this to be more production-ready?`,
          `Based on the snippet above, what does this pattern accomplish and where would you use it in a real project?`,
          `Looking at this ${chosen.lang} code — what happens if ${seed || "an unexpected input is passed"}? How does it handle that?`,
          `Can you explain the trade-offs of this approach shown above, and describe an alternative implementation?`,
        ];
        const snippetQuestion =
          codeQuestions[Math.floor(Math.random() * codeQuestions.length)];
        setGeneratedQuestion(snippetQuestion);
      } else {
        setGeneratedSnippet("");
        setGeneratedQuestion(question);
      }

      setIsGenerating(false);
    }, 900);
  };

  // Effect to handle Auto-AI response logic
  useEffect(() => {
    if (role === "expert" && isAutoAIEnabled && assessmentMessages.length > 0) {
      const lastMessage = assessmentMessages[assessmentMessages.length - 1];

      // If last message was from Candidate and we haven't hit the limit
      if (
        lastMessage.sender === "Candidate" &&
        currentQuestionCount < maxQuestions
      ) {
        const timer = setTimeout(async () => {
          await sendAssessmentMessage(
            "TalentVillage AI",
            `[AI Auto-Response] Interesting point about "${lastMessage.content.slice(0, 20)}...". Let's dig deeper. Question ${currentQuestionCount + 1}/${maxQuestions}: How does this scale?`,
          );
          setCurrentQuestionCount((prev) => prev + 1);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    assessmentMessages,
    isAutoAIEnabled,
    role,
    maxQuestions,
    currentQuestionCount,
  ]);

  // Effect for AI Auto-Suggest to Queue
  useEffect(() => {
    if (
      role === "expert" &&
      isAutoSuggestEnabled &&
      assessmentMessages.length > 0
    ) {
      const lastMessage = assessmentMessages[assessmentMessages.length - 1];

      // If last message was from Candidate and NOT already handled
      if (lastMessage.sender === "Candidate") {
        const timer = setTimeout(() => {
          const suggestedQuestion = `[Auto-Suggest] Follow up: How would you resolve the potential bottleneck in your ${lastMessage.content.slice(0, 15)}... approach?`;
          handleProposeToQueue(suggestedQuestion, true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [assessmentMessages, isAutoSuggestEnabled, role]);

  const toggleRole = () => {
    const newRole = role === "candidate" ? "expert" : "candidate";
    setRole(newRole);
    if (newRole === "expert") {
      setHasEnteredName(false); // Force name entry when switching to expert
    } else {
      setHasEnteredName(true); // Candidates bypass name entry for now
    }
    setSearchParams({ role: newRole, name: userName });
  };

  const handleCreateTalentVine = () => {
    if (inviteRole === "expert" && !inviteName.trim()) return;
    const vineId = `talent-${Math.random().toString(36).slice(2, 10)}`;
    let link = `${window.location.origin}/talent-village?role=${inviteRole}&vineId=${vineId}&villageId=${villageId}&villageName=${encodeURIComponent(villageName)}`;
    if (inviteRole === "expert") {
      if (inviteName.trim())
        link += `&name=${encodeURIComponent(inviteName.trim())}`;
      link += `&isLead=false`;
    }
    setCreatedVineId(vineId);
    setCreatedVineLink(link);
  };

  const copyVineLink = () => {
    navigator.clipboard.writeText(createdVineLink);
    setVineLinkCopied(true);
    setTimeout(() => setVineLinkCopied(false), 2000);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setHasEnteredName(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("name", tempName.trim());
      if (role === "expert") {
        newParams.set(
          "isLead",
          isInvitedExpert ? "false" : isLeadRole.toString(),
        );
      }
      setSearchParams(newParams);
    }
  };

  if (!hasEnteredName) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              {role === "candidate" ? <User size={32} /> : <Shield size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Welcome, {role === "candidate" ? "Candidate" : "Expert"}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {role === "candidate"
                  ? "Please enter your name to begin your assessment."
                  : "Please enter your name to join the Talent Village Board."}
              </p>
            </div>
            <form onSubmit={handleNameSubmit} className="w-full space-y-4">
              <input
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder={
                  role === "candidate" ? "e.g. John Doe" : "e.g. Sarah, Alex..."
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {role === "expert" && !isInvitedExpert && (
                <label className="flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isLeadRole}
                    onChange={(e) => setIsLeadRole(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>Join as Lead Expert</span>
                </label>
              )}
              {role === "expert" && isInvitedExpert && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  You’re joining as an Expert. You’ll see the Candidate mirror
                  and Expert vine only.
                </p>
              )}
              <button
                type="submit"
                disabled={!tempName.trim()}
                className="w-full bg-indigo-600 text-white font-bold rounded-xl py-4 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join {role === "candidate" ? "Assessment" : "Board"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1e293b] font-sans overflow-hidden flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            to="/setup"
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-display font-semibold tracking-tight flex items-center">
              TalentVillage
              <span className="text-[#3876F2] font-bold ml-1">.ai</span>
              {villageId && (
                <span className="ml-4 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {villageName}
                </span>
              )}
              {/* Scheduled time badge */}
              {scheduledLabel && (
                <span className="ml-3 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Calendar size={11} className="opacity-70" />
                  {scheduledLabel}
                </span>
              )}
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Assessment Engine •{" "}
              {role === "candidate"
                ? "Candidate Portal"
                : isLead
                  ? "Lead Dashboard"
                  : "Expert Terminal"}
            </span>
            {role === "expert" && isLead && (
              <span className="text-[9px] font-bold text-indigo-500 mt-0.5">
                You: {userName} (Lead)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all ${
              isAssessmentConnected
                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                : "bg-slate-50 border-slate-100 text-slate-400"
            }`}
          >
            <Activity
              size={10}
              className={isAssessmentConnected ? "animate-pulse" : ""}
            />
            NATS: {isAssessmentConnected ? "Connected" : "Connecting..."}
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          {/* Profile Switcher (Expert view) */}
          {role === "expert" ? (
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-slate-100 rounded-full gap-1">
                {(
                  [
                    {
                      id: "candidate",
                      label: "👤 Candidate",
                      title: "See candidate view",
                    },
                    {
                      id: "self",
                      label: isLead ? "👑 Lead Dashboard" : "👤 My Dashboard",
                      title: isLead
                        ? "My lead dashboard — chat with candidate, advanced tools, invite others"
                        : "My expert dashboard",
                    },
                    {
                      id: "experts",
                      label: "👥 Experts",
                      title: "Expert collaboration",
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setViewProfile(tab.id)}
                    title={tab.title}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      viewProfile === tab.id
                        ? "bg-white text-[#3876F2] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {isLead && (
                <>
                  <button
                    onClick={() => setIsRosterOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200"
                    title="Manage Expert Roster"
                  >
                    <Users size={12} />
                    Roster
                    {expertRoster.length > 0 && (
                      <span className="ml-1 bg-white text-emerald-600 rounded-full w-4 h-4 text-[9px] font-black flex items-center justify-center">
                        {expertRoster.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateVine(true);
                      setCreatedVineLink("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3876F2] text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
                    title="Invite candidate or other experts"
                  >
                    <Plus size={12} />
                    Invite
                  </button>
                  <button
                    onClick={() => {
                      setIsLeadLinkOpen(true);
                      setLeadPin("");
                      setLeadPinError(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700 transition-all shadow-md shadow-slate-300"
                    title="Get your Lead link back to this village"
                  >
                    <Shield size={12} />
                    My Link
                  </button>
                  {/* Email Summary button — visible to Lead when email is available */}
                  {leadEmail && (
                    <button
                      onClick={handleEmailSummary}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-sky-600 transition-all shadow-md shadow-sky-200"
                      title={`Email session summary to ${leadEmail}`}
                    >
                      <Mail size={12} />
                      Email Summary
                    </button>
                  )}
                  {/* Download iCal — visible when a schedule is set */}
                  {scheduledDate && scheduledTime && (
                    <button
                      onClick={handleDownloadLeadIcal}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200"
                      title="Download iCal invite for this session"
                    >
                      <Download size={12} />
                      iCal
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              onClick={toggleRole}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all flex items-center gap-2"
            >
              <Zap size={12} className="text-amber-500" />
              Expert View
            </button>
          )}

          {role === "expert" && (
            <button
              onClick={toggleRole}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all"
            >
              Exit Expert
            </button>
          )}
        </div>
      </header>

      {/* Stealth Alert Strip — visible to experts only */}
      {role === "expert" && (
        <AnimatePresence>
          {stealthAlerts
            .filter((a) => !stealthDismissed.has(a.id))
            .map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex items-center gap-3 px-6 py-2.5 bg-rose-600 text-white text-[11px] font-bold z-40 shadow-lg"
              >
                <AlertTriangle
                  size={14}
                  className="flex-shrink-0 animate-pulse"
                />
                <span className="uppercase tracking-widest text-[9px] font-black opacity-80">
                  {alert.event === "copy"
                    ? "⚠️ COPY"
                    : alert.event === "paste"
                      ? "📋 PASTE"
                      : "✂️ CUT"}{" "}
                  DETECTED
                </span>
                {alert.text && (
                  <span className="flex-1 font-mono text-[10px] opacity-90 truncate">
                    "{alert.text}"
                  </span>
                )}
                <span className="text-[9px] opacity-60 flex-shrink-0">
                  {new Date(alert.ts).toLocaleTimeString()}
                </span>
                <button
                  onClick={() =>
                    setStealthDismissed((prev) => new Set([...prev, alert.id]))
                  }
                  className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
        </AnimatePresence>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
        <AnimatePresence mode="wait">
          {role === "candidate" ? (
            /* VIEW 1: CANDIDATE ASSESSMENT */
            <motion.div
              key="candidate-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col max-w-4xl mx-auto w-full"
            >
              <div className="flex-1 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#7FE1C7] flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        Live Assessment
                      </h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                        Communication Channel Active
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    End-to-End Encrypted
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]">
                  {assessmentMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                      <Sparkles size={48} className="text-amber-400 mb-4" />
                      <h4 className="text-lg font-bold">
                        Initializing Assessment...
                      </h4>
                      <p className="text-sm max-w-xs">
                        Start the conversation by sending a message.
                      </p>
                    </div>
                  )}
                  {assessmentMessages.map((msg) => {
                    const isMe = msg.sender === userName;
                    const isAI = msg.sender === "TalentVillage AI";
                    const isInjection = msg.sender === "EXPERT_INJECTION";

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-2 px-1">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest ${
                                isMe
                                  ? "text-slate-400"
                                  : isAI
                                    ? "text-[#3876F2]"
                                    : "text-rose-500"
                              }`}
                            >
                              {isInjection
                                ? "🔴 EXPERT INTERVENTION"
                                : msg.sender}
                            </span>
                          </div>
                          <div
                            className={`px-5 py-4 rounded-[24px] shadow-sm text-sm leading-relaxed transition-all ${
                              isMe
                                ? "bg-slate-800 text-white rounded-tr-none"
                                : isAI
                                  ? "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                                  : "bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-tl-none font-medium"
                            }`}
                          >
                            {renderMessageContent(msg.content)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-white border-t border-slate-100">
                  <form
                    onSubmit={handleSendCandidateMessage}
                    className="relative flex items-center gap-3"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your response to the AI..."
                      className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#3876F2]/20 transition-all shadow-inner placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 bg-[#3876F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-all active:scale-95"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            /* VIEW 2: EXPERT DASHBOARD */
            <motion.div
              key="expert-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex-1 flex flex-col md:flex-row gap-6 ${hideMirror ? "justify-center overflow-x-auto p-4" : ""}`}
            >
              {/* Profile: Candidate — show the candidate mirror full-screen */}
              {viewProfile === "candidate" && (
                <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                  <div className="flex-1 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-6 md:px-8 py-4 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/30">
                      <div className="p-2 bg-indigo-500 rounded-xl text-white">
                        <Eye size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          Candidate View
                        </h3>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                          Viewing as Candidate
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]">
                      {assessmentMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                          <Sparkles size={48} className="text-amber-400 mb-4" />
                          <h4 className="text-lg font-bold">No messages yet</h4>
                          <p className="text-sm max-w-xs">
                            The candidate hasn't sent anything yet.
                          </p>
                        </div>
                      )}
                      {assessmentMessages.map((msg) => {
                        const isCandidate = msg.sender === "Candidate";
                        const isInjection = msg.sender === "EXPERT_INJECTION";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] flex flex-col gap-1 ${isCandidate ? "items-end" : "items-start"}`}
                            >
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-1 ${
                                  isCandidate
                                    ? "text-slate-400"
                                    : isInjection
                                      ? "text-rose-500"
                                      : "text-[#3876F2]"
                                }`}
                              >
                                {isInjection
                                  ? "🔴 EXPERT INTERVENTION"
                                  : msg.sender}
                              </span>
                              <div
                                className={`px-5 py-4 rounded-[24px] shadow-sm text-sm leading-relaxed ${
                                  isCandidate
                                    ? "bg-slate-800 text-white rounded-tr-none"
                                    : isInjection
                                      ? "bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-tl-none"
                                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Simulation input for expert acting as candidate */}
                    <div className="p-6 bg-white border-t border-slate-100">
                      <form
                        onSubmit={handleSendSimulationMessage}
                        className="flex gap-3"
                      >
                        <input
                          type="text"
                          value={simulationInput}
                          onChange={(e) => setSimulationInput(e.target.value)}
                          placeholder="Type as Candidate (simulation)..."
                          className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="submit"
                          className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg"
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile: Experts — show private expert collaboration */}
              {viewProfile === "experts" && (
                <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                  <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden min-h-[500px]">
                    <div className="px-6 py-5 bg-[#D3CFEF] border-b border-indigo-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-950 text-sm">
                            Expert Collaboration
                          </h4>
                          <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                            Private Vine ·{" "}
                            {isExpertConnected ? "Live" : "Connecting..."}
                          </p>
                        </div>
                      </div>
                      {isLead && (
                        <button
                          onClick={() => {
                            setShowCreateVine(true);
                            setCreatedVineLink("");
                            setInviteName("");
                            setInviteRole("expert");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
                        >
                          <Plus size={12} /> Invite
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-indigo-50/10">
                      {privateExpertMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                          <Users size={40} className="text-indigo-300 mb-3" />
                          <p className="text-sm font-bold text-indigo-400">
                            No expert messages yet
                          </p>
                          <p className="text-xs text-indigo-300 mt-1">
                            Use "Add Expert" to invite collaborators
                          </p>
                        </div>
                      )}
                      {privateExpertMessages.map((msg) => {
                        const isMe = msg.sender === userName;
                        const senderIsLead =
                          msg.sender === "Expert 1" ||
                          msg.sender.toLowerCase().includes("lead");
                        const displayName =
                          isMe && isLead
                            ? "Lead"
                            : senderIsLead
                              ? "Lead"
                              : msg.sender;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                              {displayName}
                            </span>
                            <div
                              className={`border p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed max-w-[85%] ${
                                isMe
                                  ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                                  : "bg-white text-slate-600 border-indigo-100 rounded-tl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={expertEndRef} />
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100">
                      <form
                        onSubmit={handleSendExpertMessage}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={expertInput}
                          onChange={(e) => setExpertInput(e.target.value)}
                          placeholder="Message other experts..."
                          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-4 text-xs focus:ring-1 focus:ring-indigo-200"
                        />
                        <button
                          type="submit"
                          className="p-4 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile: Self — Candidate chat (left) + Expert Vine Chat (right) at top, tools below */}
              {viewProfile === "self" && (
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                  {/* TOP ROW: Candidate Chat + Expert Vine Chat side by side */}
                  <div
                    className="flex flex-col md:flex-row gap-6"
                    style={{ minHeight: "420px" }}
                  >
                    {/* LEFT: Candidate Mirror */}
                    <div className="flex-1 bg-[#D3CFEF]/30 rounded-[32px] border-2 border-[#D3CFEF] flex flex-col overflow-hidden relative">
                      <div className="px-6 py-4 flex items-center justify-between border-b border-indigo-200/50 bg-[#D3CFEF]/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500 rounded-xl text-white">
                            <Eye size={16} />
                          </div>
                          <span className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest">
                            Candidate Mirror • Live
                          </span>
                        </div>
                        {isAssessmentConnected && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                              Live Sync
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {assessmentMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <Eye size={32} className="text-indigo-300 mb-2" />
                            <p className="text-xs font-bold text-indigo-400">
                              Waiting for candidate...
                            </p>
                          </div>
                        )}
                        {assessmentMessages.map((msg) => {
                          const isMe = msg.sender === userName;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[80%] flex flex-col gap-1 ${isMe ? "items-start" : "items-end"}`}
                              >
                                <span className="text-[9px] font-bold text-indigo-900/40 uppercase px-1">
                                  {msg.sender}
                                </span>
                                <div
                                  className={`px-4 py-3 rounded-[18px] text-[13px] ${
                                    isMe
                                      ? "bg-indigo-600 text-white rounded-tl-none"
                                      : "bg-[#7FE1C7] text-slate-800 rounded-tr-none"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Lead Expert Chat to Candidate Vine */}
                      {isLead && (
                        <div className="p-4 bg-white border-t border-indigo-200/50 flex-shrink-0">
                          <form
                            onSubmit={handleSendCandidateMessage}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              placeholder="Message the candidate..."
                              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                            />
                            <button
                              type="submit"
                              disabled={!inputText.trim()}
                              className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send size={16} />
                              <span>Send</span>
                            </button>
                          </form>
                        </div>
                      )}

                      {!isLead && !canChatWithCandidate && (
                        <div className="p-4 bg-slate-50 border-t border-slate-200/50 flex-shrink-0 space-y-3">
                          <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Read-Only Mirror
                          </span>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleProposeToQueue(injectionInput);
                              setInjectionInput("");
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={injectionInput}
                              onChange={(e) =>
                                setInjectionInput(e.target.value)
                              }
                              placeholder="Suggest a question for Lead to send..."
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-amber-100 placeholder:text-slate-400"
                            />
                            <button
                              type="submit"
                              disabled={!injectionInput.trim()}
                              className="px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all text-[10px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Propose to Queue
                            </button>
                          </form>
                        </div>
                      )}

                      {!isLead && canChatWithCandidate && (
                        <div className="p-4 bg-white border-t border-emerald-200/50 flex-shrink-0">
                          <form
                            onSubmit={handleSendCandidateMessage}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              placeholder="Message the candidate..."
                              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                            />
                            <button
                              type="submit"
                              disabled={!inputText.trim()}
                              className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send size={16} />
                              <span>Send</span>
                            </button>
                          </form>
                          <div className="mt-1 text-center">
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                              Chat Enabled by Lead
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Simulation input (Lead Only) */}
                      {isLead && isActingAsCandidate && (
                        <div className="p-4 bg-slate-900/5 border-t border-indigo-200/50 flex-shrink-0">
                          <form
                            onSubmit={handleSendSimulationMessage}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={simulationInput}
                              onChange={(e) =>
                                setSimulationInput(e.target.value)
                              }
                              placeholder="Type as Candidate..."
                              className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-100"
                            />
                            <button
                              type="submit"
                              className="px-4 py-3 bg-[#7FE1C7] text-slate-800 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Send size={16} />
                            </button>
                          </form>
                        </div>
                      )}

                      {/* AI Lenses badge — hidden for now
                    <div className="absolute bottom-20 right-4 bg-slate-900 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl border border-white/5 z-10 cursor-pointer hover:scale-105 transition-transform">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Lenses</span>
                      <div className="bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-slate-400">6</div>
                    </div>
                    */}
                    </div>

                    {/* RIGHT: Expert Vine Chat */}
                    <motion.div
                      animate={{
                        width: isExpertChatCollapsed ? "48px" : "auto",
                        flex: isExpertChatCollapsed ? "0 0 48px" : "1 1 0%",
                      }}
                      className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden relative"
                    >
                      <div className="px-6 py-4 bg-[#D3CFEF] border-b border-indigo-200 flex justify-between items-center flex-shrink-0">
                        {!isExpertChatCollapsed ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <Shield size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-indigo-950 text-sm">
                                  Expert Vine Chat
                                </h4>
                                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                                  {isLead ? "Lead & Team" : "Expert Team"} ·{" "}
                                  {isExpertConnected ? "Live" : "Connecting..."}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isLead && (
                                <button
                                  onClick={() => {
                                    setShowCreateVine(true);
                                    setCreatedVineLink("");
                                    setInviteName("");
                                    setInviteRole("expert");
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
                                >
                                  <Plus size={12} /> Invite
                                </button>
                              )}
                              <button
                                onClick={() => setIsExpertChatCollapsed(true)}
                                className="p-2 hover:bg-black/5 rounded-full transition-colors text-indigo-900/40"
                                title="Collapse Chat"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsExpertChatCollapsed(false)}
                            className="w-full h-full py-6 flex flex-col items-center gap-8 text-indigo-900/40 hover:text-indigo-900 transition-colors"
                            title="Expand Expert Chat"
                          >
                            <Shield size={18} />
                            <div className="rotate-90 whitespace-nowrap text-[10px] font-black uppercase tracking-widest">
                              Expert Chat
                            </div>
                            <div className="flex-1" />
                            <ChevronRight size={18} className="rotate-180" />
                          </button>
                        )}
                      </div>

                      {!isExpertChatCollapsed && (
                        <>
                          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-indigo-50/10">
                            {privateExpertMessages.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <Users
                                  size={32}
                                  className="text-indigo-300 mb-2"
                                />
                                <p className="text-xs font-bold text-indigo-400">
                                  No expert messages yet
                                </p>
                              </div>
                            )}
                            {privateExpertMessages.map((msg) => {
                              const isMe = msg.sender === userName;
                              const senderIsLead =
                                msg.sender === "Expert 1" ||
                                msg.sender.toLowerCase().includes("lead");
                              const displayName =
                                isMe && isLead
                                  ? "Lead"
                                  : senderIsLead
                                    ? "Lead"
                                    : msg.sender;

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                                >
                                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                                    {displayName}
                                  </span>
                                  <div
                                    className={`border p-3 rounded-2xl shadow-sm text-[13px] leading-relaxed max-w-[85%] ${
                                      isMe
                                        ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                                        : "bg-white text-slate-600 border-indigo-100 rounded-tl-none"
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={expertEndRef} />
                          </div>

                          <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                            <form
                              onSubmit={handleSendExpertMessage}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={expertInput}
                                onChange={(e) => setExpertInput(e.target.value)}
                                placeholder="Message the expert team..."
                                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-indigo-200"
                              />
                              <button
                                type="submit"
                                className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                              >
                                <Send size={16} />
                              </button>
                            </form>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>

                  {/* OBSERVER ROW — Read-only Lead Tools panel for non-lead experts with observer access */}
                  {!isLead && canObserveLeadTools && (
                    <div className="flex flex-col gap-4 mt-6">
                      <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          <Eye size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            Lead Tools — Observer View
                          </h4>
                          <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">
                            Read-only · Live Data
                          </p>
                        </div>
                        <div className="ml-auto px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-[9px] font-black text-purple-500 uppercase tracking-widest animate-pulse">
                          Live
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 opacity-90">
                        {/* Read-only Intervention Queue */}
                        <div className="bg-white rounded-[32px] border-2 border-purple-100 p-6 shadow-xl shadow-purple-500/5 flex flex-col">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                                <MessageSquare size={16} />
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                Intervention Queue
                              </h4>
                            </div>
                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">
                              {assessmentQueue.length} Pending
                            </span>
                          </div>
                          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                            {assessmentQueue.length === 0 ? (
                              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                  No pending items
                                </p>
                              </div>
                            ) : (
                              assessmentQueue.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-4 rounded-2xl border ${item.isAI ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50 border-slate-100"}`}
                                >
                                  <div className="flex justify-between items-start gap-3 mb-2">
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${item.isAI ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"}`}
                                    >
                                      {item.isAI
                                        ? "AI SUGGESTION"
                                        : `PROPOSED BY ${item.expert}`}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                    "{item.content}"
                                  </p>
                                  {/* Read-only badge — no approve/dismiss for observers */}
                                  <div className="w-full py-2 bg-purple-50 text-purple-500 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest border border-purple-100">
                                    Observer View — Awaiting Lead Action
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Read-only AI Config */}
                        <div className="bg-white rounded-[32px] border-2 border-purple-100 p-6 shadow-xl shadow-purple-500/5">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                              <Zap size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              AI Configuration
                            </h4>
                          </div>
                          <div className="space-y-3 pointer-events-none select-none">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700">
                                  Auto-AI Response
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  Lead's setting
                                </span>
                              </div>
                              <div
                                className={`w-10 h-5 rounded-full relative ${isAutoAIEnabled ? "bg-blue-500" : "bg-slate-300"}`}
                              >
                                <div
                                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoAIEnabled ? "left-6" : "left-1"}`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700">
                                  AI Auto-Suggest
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  Lead's setting
                                </span>
                              </div>
                              <div
                                className={`w-10 h-5 rounded-full relative ${isAutoSuggestEnabled ? "bg-indigo-500" : "bg-slate-300"}`}
                              >
                                <div
                                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSuggestEnabled ? "left-6" : "left-1"}`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700">
                                  Candidate Simulation
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  Lead's setting
                                </span>
                              </div>
                              <div
                                className={`w-10 h-5 rounded-full relative ${isActingAsCandidate ? "bg-emerald-500" : "bg-slate-300"}`}
                              >
                                <div
                                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActingAsCandidate ? "left-6" : "left-1"}`}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[11px] font-bold text-slate-700">
                                  Question Limit
                                </span>
                                <span className="text-[11px] font-bold text-blue-500">
                                  {currentQuestionCount}/{maxQuestions}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full">
                                <div
                                  className="h-1.5 bg-blue-400 rounded-full"
                                  style={{
                                    width: `${(currentQuestionCount / maxQuestions) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-purple-400 font-bold text-center uppercase tracking-widest mt-4">
                            Observer — Controls Disabled
                          </p>
                        </div>

                        {/* Read-only Question Designer — shows most recent AI-generated question */}
                        <div className="bg-white rounded-[32px] border-2 border-purple-100 p-6 shadow-xl shadow-purple-500/5 flex flex-col">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-100">
                              <Sparkles size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              AI Question Designer
                            </h4>
                          </div>
                          <div className="flex-1 flex flex-col gap-3 pointer-events-none select-none">
                            <div className="flex gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1">
                              <span className="bg-slate-100 rounded px-2 py-1">
                                {specialty}
                              </span>
                              <span className="bg-slate-100 rounded px-2 py-1">
                                {difficulty}
                              </span>
                              {seed && (
                                <span className="bg-slate-100 rounded px-2 py-1 truncate">
                                  {seed}
                                </span>
                              )}
                            </div>
                            {generatedQuestion ? (
                              <div className="flex-1 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">
                                  Latest Generated Question
                                </p>
                                <p className="text-xs text-purple-900 leading-relaxed italic">
                                  "{generatedQuestion}"
                                </p>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center p-4">
                                  No question generated yet
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-purple-400 font-bold text-center uppercase tracking-widest mt-4">
                            Observer — Controls Disabled
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM ROW (Lead Expert Only) */}
                  {isLead && (
                    <div className="flex flex-col gap-4 mt-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-800 rounded-lg text-white">
                            <Zap size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              AI Intervention & Tools
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              Moderation & Optimization Suite
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setIsBottomToolsCollapsed(!isBottomToolsCollapsed)
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                        >
                          {isBottomToolsCollapsed ? (
                            <>
                              <Plus size={14} />
                              <span>Show Tools</span>
                            </>
                          ) : (
                            <>
                              <X size={14} />
                              <span>Hide Tools</span>
                            </>
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {!isBottomToolsCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8"
                          >
                            {/* AI Configuration */}
                            <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5">
                              <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                  <Zap size={16} />
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                  AI Configuration
                                </h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-700">
                                      Auto-AI Response
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      Trigger follow-ups automatically
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setIsAutoAIEnabled(!isAutoAIEnabled)
                                    }
                                    className={`w-10 h-5 rounded-full transition-all relative ${isAutoAIEnabled ? "bg-blue-500" : "bg-slate-300"}`}
                                  >
                                    <div
                                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoAIEnabled ? "left-6" : "left-1"}`}
                                    />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border-2 border-indigo-100">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-700">
                                        AI Auto-Suggest
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-indigo-500 text-[7px] text-white font-black rounded uppercase tracking-tighter">
                                        Queue
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400">
                                      Suggest questions for review
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setIsAutoSuggestEnabled(
                                        !isAutoSuggestEnabled,
                                      )
                                    }
                                    className={`w-10 h-5 rounded-full transition-all relative ${isAutoSuggestEnabled ? "bg-indigo-500" : "bg-slate-300"}`}
                                  >
                                    <div
                                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSuggestEnabled ? "left-6" : "left-1"}`}
                                    />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-indigo-700">
                                      Candidate Simulation
                                    </span>
                                    <span className="text-[9px] text-indigo-400">
                                      Act as candidate in the mirror
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setIsActingAsCandidate(
                                        !isActingAsCandidate,
                                      )
                                    }
                                    className={`w-10 h-5 rounded-full transition-all relative ${isActingAsCandidate ? "bg-emerald-500" : "bg-slate-300"}`}
                                  >
                                    <div
                                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActingAsCandidate ? "left-6" : "left-1"}`}
                                    />
                                  </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-slate-700">
                                      Question Limit
                                    </span>
                                    <span className="text-[11px] font-bold text-blue-500">
                                      {currentQuestionCount}/{maxQuestions}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={maxQuestions}
                                    onChange={(e) =>
                                      setMaxQuestions(parseInt(e.target.value))
                                    }
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Intervention Queue */}
                            <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5 flex flex-col">
                              <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                                    <MessageSquare size={16} />
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    Intervention Queue
                                  </h4>
                                </div>
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">
                                  {assessmentQueue.length} Pending
                                </span>
                              </div>
                              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                {assessmentQueue.length === 0 ? (
                                  <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                      No pending actions
                                    </p>
                                  </div>
                                ) : (
                                  assessmentQueue.map((item) => (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`p-4 rounded-2xl border ${item.isAI ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50 border-slate-100"}`}
                                    >
                                      <div className="flex justify-between items-start gap-3 mb-2">
                                        <span
                                          className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                            item.isAI
                                              ? "bg-indigo-500 text-white"
                                              : "bg-slate-200 text-slate-500"
                                          }`}
                                        >
                                          {item.isAI
                                            ? "AI SUGGESTION"
                                            : `PROPOSED BY ${item.expert}`}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                        "{item.content}"
                                      </p>
                                      <div className="flex gap-2">
                                        {isLead ? (
                                          <>
                                            <button
                                              onClick={() =>
                                                handleQueueAction(
                                                  item.id,
                                                  "send",
                                                  item.content,
                                                )
                                              }
                                              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                            >
                                              Approve & Send
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleQueueAction(
                                                  item.id,
                                                  "delete",
                                                )
                                              }
                                              className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-500 hover:border-rose-200 transition-all"
                                            >
                                              Dismiss
                                            </button>
                                          </>
                                        ) : (
                                          <div className="w-full py-2 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest">
                                            Awaiting Lead Approval
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* AI Question Designer */}
                            <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5 flex flex-col">
                              <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-100">
                                  <Sparkles size={16} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    AI Question Designer
                                  </h4>
                                </div>
                                {/* Code Snippet Mode toggle */}
                                <button
                                  onClick={() => {
                                    setSnippetMode((v) => !v);
                                    setGeneratedSnippet("");
                                    setGeneratedQuestion("");
                                  }}
                                  title={
                                    snippetMode
                                      ? "Switch to question-only mode"
                                      : "Switch to code snippet + question mode"
                                  }
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                    snippetMode
                                      ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200"
                                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                  }`}
                                >
                                  <Code size={11} />
                                  {snippetMode ? "Code On" : "Code Off"}
                                </button>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">
                                    Specialty
                                  </label>
                                  <select
                                    value={specialty}
                                    onChange={(e) =>
                                      setSpecialty(e.target.value)
                                    }
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-purple-200"
                                  >
                                    <option>React</option>
                                    <option>Node</option>
                                    <option>Python</option>
                                    <option>Architecture</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">
                                    Level
                                  </label>
                                  <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                                    {(
                                      ["beginner", "junior", "expert"] as const
                                    ).map((lvl) => (
                                      <button
                                        key={lvl}
                                        onClick={() => setDifficulty(lvl)}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${difficulty === lvl ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                      >
                                        {lvl}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Language selector — only in snippet mode */}
                                {snippetMode && (
                                  <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1 px-1">
                                      Code Language
                                    </label>
                                    <select
                                      value={codeLanguage}
                                      onChange={(e) =>
                                        setCodeLanguage(e.target.value)
                                      }
                                      className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs text-indigo-700 focus:ring-1 focus:ring-indigo-300"
                                    >
                                      <option value="typescript">
                                        TypeScript
                                      </option>
                                      <option value="javascript">
                                        JavaScript
                                      </option>
                                      <option value="python">Python</option>
                                      <option value="go">Go</option>
                                      <option value="rust">Rust</option>
                                      <option value="sql">SQL</option>
                                      <option value="bash">Bash</option>
                                    </select>
                                  </div>
                                )}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">
                                    Seed Context
                                  </label>
                                  <input
                                    type="text"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                    placeholder="e.g. React 19, Hooks..."
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-purple-200"
                                  />
                                </div>
                                <button
                                  onClick={handleGenerateQuestion}
                                  disabled={isGenerating}
                                  className={`w-full py-3 text-white rounded-2xl font-bold text-xs shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                                    snippetMode
                                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-purple-200"
                                      : "bg-purple-600 shadow-purple-200"
                                  }`}
                                >
                                  {isGenerating
                                    ? "Designing..."
                                    : snippetMode
                                      ? "Generate Code Challenge"
                                      : "Generate AI Question"}
                                  {!isGenerating && <ChevronRight size={14} />}
                                </button>
                                {generatedQuestion && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-2 space-y-3"
                                  >
                                    {/* Code Snippet editor — shown only in snippet mode */}
                                    {snippetMode && generatedSnippet && (
                                      <div className="rounded-2xl overflow-hidden border border-slate-700 bg-[#0f1117]">
                                        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Code
                                              size={10}
                                              className="text-indigo-400"
                                            />
                                            {codeLanguage}
                                          </span>
                                          <span className="text-[8px] text-slate-500 font-bold">
                                            editable
                                          </span>
                                        </div>
                                        <textarea
                                          value={generatedSnippet}
                                          onChange={(e) =>
                                            setGeneratedSnippet(e.target.value)
                                          }
                                          rows={8}
                                          spellCheck={false}
                                          className="w-full bg-transparent px-4 py-3 text-[11px] text-green-300 font-mono resize-y focus:outline-none leading-relaxed"
                                        />
                                      </div>
                                    )}
                                    {/* Question editor */}
                                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">
                                        {snippetMode
                                          ? "Question for candidate"
                                          : "Edit before sending"}
                                      </p>
                                      <textarea
                                        value={generatedQuestion}
                                        onChange={(e) =>
                                          setGeneratedQuestion(e.target.value)
                                        }
                                        rows={3}
                                        className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2.5 text-xs text-purple-900 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-purple-300 mb-3"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleProposeToQueue(
                                              buildSnippetPayload(),
                                              true,
                                            )
                                          }
                                          className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-600 transition-colors"
                                        >
                                          {isLead
                                            ? "Queue for Send"
                                            : "Propose to Lead"}
                                        </button>
                                        {isLead && (
                                          <button
                                            onClick={() =>
                                              handleInjectQuestion(
                                                undefined,
                                                buildSnippetPayload(),
                                              )
                                            }
                                            className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold hover:bg-rose-600 transition-colors"
                                          >
                                            Send Now
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Expert Roster Slide-in Drawer (Lead only) */}
      <AnimatePresence>
        {isRosterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="roster-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRosterOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              key="roster-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl shadow-black/20 z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">
                      Expert Roster
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Access & Observer Controls
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRosterOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Count badge */}
              <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-50">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Connected Experts
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                  {expertRoster.length}
                </span>
              </div>

              {/* Expert list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {expertRoster.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-50">
                    <Users size={40} className="text-slate-200 mb-3" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      No experts yet
                    </p>
                    <p className="text-[10px] text-slate-300 mt-2 max-w-[200px]">
                      Experts appear here after sending a message in the Expert
                      Vine Chat
                    </p>
                  </div>
                ) : (
                  expertRoster.map((name) => {
                    const chatEnabled = enabledExperts.has(name);
                    const isObserver = toolObservers.has(name);
                    return (
                      <div
                        key={name}
                        className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3"
                      >
                        {/* Expert name + status chips */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <User size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-slate-800 truncate">
                              {name}
                            </p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {chatEnabled && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black rounded uppercase tracking-tighter">
                                  Chat ✓
                                </span>
                              )}
                              {isObserver && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-black rounded uppercase tracking-tighter">
                                  Observer ✓
                                </span>
                              )}
                              {!chatEnabled && !isObserver && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded uppercase tracking-tighter">
                                  Read-only
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Chat toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-600">
                              Chat with Candidate
                            </p>
                            <p className="text-[9px] text-slate-400">
                              Send messages to the assessment vine
                            </p>
                          </div>
                          <button
                            onClick={() => toggleExpertPermission(name)}
                            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                              chatEnabled ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                chatEnabled ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Observer toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                              <Eye size={10} /> Observer Mode
                            </p>
                            <p className="text-[9px] text-slate-400">
                              Read-only view of Lead tools
                            </p>
                          </div>
                          <button
                            onClick={() => toggleToolObserver(name)}
                            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                              isObserver ? "bg-purple-500" : "bg-slate-300"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                isObserver ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setShowCreateVine(true);
                    setCreatedVineLink("");
                    setInviteName("");
                    setInviteRole("expert");
                    setIsRosterOpen(false);
                  }}
                  className="w-full py-3 bg-[#3876F2] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
                >
                  <Plus size={14} /> Invite New Expert
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lead Village Link — PIN Modal */}
      <AnimatePresence>
        {isLeadLinkOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLeadLinkOpen(false);
                setLeadLinkUnlocked(false);
                setLeadPin("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Your Lead Link
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Secure Village Access
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsLeadLinkOpen(false);
                    setLeadLinkUnlocked(false);
                    setLeadPin("");
                  }}
                  className="ml-auto p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {!leadLinkUnlocked ? (
                /* PIN Entry */
                <div className="space-y-5">
                  <p className="text-sm text-slate-500 text-center">
                    Enter your Lead access code to reveal your village link.
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="password"
                      value={leadPin}
                      onChange={(e) => {
                        setLeadPin(e.target.value);
                        setLeadPinError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (leadPin === "20816") {
                            setLeadLinkUnlocked(true);
                            setLeadPinError(false);
                          } else {
                            setLeadPinError(true);
                            setLeadPin("");
                          }
                        }
                      }}
                      placeholder="Enter code"
                      className={`w-40 text-center text-2xl font-mono tracking-[0.4em] bg-slate-50 border-2 rounded-2xl px-4 py-3 focus:outline-none transition-all ${
                        leadPinError
                          ? "border-rose-400 animate-pulse"
                          : "border-slate-200 focus:border-slate-400"
                      }`}
                      autoFocus
                    />
                    {leadPinError && (
                      <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                        Incorrect code
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (leadPin === "20816") {
                        setLeadLinkUnlocked(true);
                        setLeadPinError(false);
                      } else {
                        setLeadPinError(true);
                        setLeadPin("");
                      }
                    }}
                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl text-sm hover:bg-slate-700 transition-all"
                  >
                    Unlock
                  </button>
                </div>
              ) : (
                /* Revealed Link */
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <Check size={12} /> Access Verified — Your Lead Link
                  </p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {`${window.location.origin}/board?role=expert&isLead=true&name=${encodeURIComponent(userName)}${villageId ? `&villageId=${villageId}` : ""}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/board?role=expert&isLead=true&name=${encodeURIComponent(userName)}${villageId ? `&villageId=${villageId}` : ""}`;
                      navigator.clipboard.writeText(link);
                      setLeadLinkCopied(true);
                      setTimeout(() => setLeadLinkCopied(false), 2000);
                    }}
                    className={`w-full py-3 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all ${
                      leadLinkCopied
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    {leadLinkCopied ? (
                      <>
                        <Check size={14} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Link
                      </>
                    )}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center">
                    Bookmark this link to return to your village as Lead at any
                    time.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vine Creation Modal (Lead Expert only) */}
      <AnimatePresence>
        {showCreateVine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateVine(false);
                setCreatedVineLink("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-blue-500/10 border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#3876F2] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Invite to Village
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Send link to candidate or other experts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateVine(false);
                    setCreatedVineLink("");
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Role Selection */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => {
                      setInviteRole("candidate");
                      setCreatedVineLink("");
                      setInviteName("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${inviteRole === "candidate" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Candidate
                  </button>
                  <button
                    onClick={() => {
                      setInviteRole("expert");
                      setCreatedVineLink("");
                      setInviteName("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${inviteRole === "expert" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Expert
                  </button>
                </div>

                {inviteRole === "expert" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">
                      Expert Name
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateTalentVine()
                      }
                      placeholder="e.g. Expert Celeste"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-[#3876F2]/20 focus:border-[#3876F2]/40 transition-all outline-none"
                      autoFocus
                    />
                  </div>
                )}

                <button
                  onClick={handleCreateTalentVine}
                  disabled={inviteRole === "expert" && !inviteName.trim()}
                  className="w-full py-4 bg-[#3876F2] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Generate {inviteRole === "candidate"
                    ? "Candidate"
                    : "Expert"}{" "}
                  Link
                </button>

                {createdVineLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                          ✅ Vine Created
                        </span>
                        <span className="text-[9px] font-mono text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-lg">
                          {createdVineId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl p-2">
                        <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">
                          {createdVineLink}
                        </span>
                        <button
                          onClick={copyVineLink}
                          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                            vineLinkCopied
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {vineLinkCopied ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 text-center">
                        Share this link{" "}
                        {inviteName ? `with ` : `for the candidate `}
                        <strong>{inviteName}</strong> to join the vine
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateVine(false);
                        setCreatedVineLink("");
                      }}
                      className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="px-12 py-6 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span>Engine Status: OPTIMAL</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>NATS Tunnel: SECURE P2P</span>
        </div>
        <div>talent.ai // village protocol v3.0</div>
      </footer>
    </div>
  );
}
