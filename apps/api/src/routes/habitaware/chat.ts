import { Elysia, t } from "elysia";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

import { ChatterboxClient } from "../../chatterbox-client";

// Path to agentx notes - Use persistent volume in production
const AGENTX_DIR = process.env.AGENTX_DIR || (process.env.NODE_ENV === "production" ? "/app/data/agentx" : join(process.cwd(), "agentx"));

// Ensure directory exists
if (!existsSync(AGENTX_DIR)) {
  try {
    mkdirSync(AGENTX_DIR, { recursive: true });
  } catch (err) {
    console.error(`Failed to create AGENTX_DIR: ${AGENTX_DIR}`, err);
  }
}


interface AgentXNotes {
  members: string | null;
  posts: string | null;
  isStale: boolean;
}

function loadAgentXNotes(): AgentXNotes {
  const membersPath = join(AGENTX_DIR, "members.agentx.md");
  const postsPath = join(AGENTX_DIR, "posts.agentx.md");

  let members: string | null = null;
  let posts: string | null = null;
  let isStale = false;

  // Load members notes
  if (existsSync(membersPath)) {
    members = readFileSync(membersPath, "utf-8");
    // Check if stale by parsing valid_until from frontmatter
    const validUntilMatch = members.match(/valid_until:\s*(.+)/);
    if (validUntilMatch) {
      const validUntil = new Date(validUntilMatch[1]);
      if (validUntil < new Date()) {
        isStale = true;
      }
    }
  }

  // Load posts notes
  if (existsSync(postsPath)) {
    posts = readFileSync(postsPath, "utf-8");
    // Check if stale
    const validUntilMatch = posts.match(/valid_until:\s*(.+)/);
    if (validUntilMatch) {
      const validUntil = new Date(validUntilMatch[1]);
      if (validUntil < new Date()) {
        isStale = true;
      }
    }
  }

  return { members, posts, isStale };
}

export const chatRoutes = new Elysia()
  .post("/analyze", async ({ body }) => {
    const { question, history, userContext, convoId: reqConvoId, smartMemory } = body;

    let convoId = reqConvoId;
    let assembledContext = "";
    let smartMemoryEnabled = smartMemory === true;

    // ── Chatterbox Integration ───────────────────────────────────────────
    if (convoId) {
      try {
        const ctxRes = await ChatterboxClient.getContext(convoId);
        if (ctxRes && ctxRes.success && ctxRes.context) {
          const { latestMemory } = ctxRes.context;
          
          if (latestMemory?.summary) {
            assembledContext += `\n### SMART MEMORY (Summary of previous turns):\n${latestMemory.summary}\n`;
          }
        }
      } catch (err) {
        console.warn(`[habitaware] Failed to fetch Chatterbox context for ${convoId}:`, err);
      }
    } else if (userContext?.email) {
      // Start a new convo if none provided
      try {
        const startRes = await ChatterboxClient.startConvo({
          appId: "habitaware-ai",
          orgId: "habitaware",
          userId: userContext.email,
        });
        if (startRes.success) {
          convoId = startRes.convo.convoId;
        }
      } catch (err) {
        console.warn("[habitaware] Failed to start Chatterbox convo:", err);
      }
    }

    // Load pre-computed agentx notes instead of calling APIs
    const notes = loadAgentXNotes();

    // Build conversation messages
    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: question,
      },
    ];

    // Build system prompt with agentx notes
    let dataContext = "";

    if (notes.members) {
      dataContext += `\n## MEMBER ANALYTICS\n${notes.members}\n`;
    }

    if (notes.posts) {
      dataContext += `\n## POST ANALYTICS\n${notes.posts}\n`;
    }

    const staleWarning = notes.isStale
      ? "\n⚠️ NOTE: The analytics data may be stale. Consider regenerating the agentx notes.\n"
      : "";

    const userProfile = userContext 
      ? `\n## CURRENT USER PROFILE\nYou are currently talking to ${userContext.name || "a user"} (${userContext.email || "unknown email"}).\nBio: ${userContext.bio || "No bio provided."}\n`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: `You are an expert AI community analytics assistant for "HabitAware", a community focused on recovery and awareness.
Your job is to provide deep, actionable insights into community engagement and member behavior.

${userProfile}

### DATA ACCESS
You HAVE direct access to pre-computed analytics notes containing:
1. **Aggregated Member Data**: Growth, subscriptions, geography, and cohorts.
2. **Aggregated Post Data**: Engagement rankings, space activity, and theme analysis.
3. **Recent Content Sample**: Metadata for the 50 most recent posts, including titles, spaces, and comment counts.
4. **Top Engaged Content**: A list of the most discussed posts in the community.

### ANALYSIS GUIDELINES
- **Be Confident & Proactive**: Never say "I don't have access to your data" because you DO have access to the analytics provided below. 
- **Identify Patterns**: Use the theme analysis (Recovery, Struggles, Tools, etc.) to understand the community's "pulse".
- **Reference Specifics**: When answering,cite specific spaces, post titles from the sample, or data points from the statistics.
- **Actionable Advice**: If a user asks for strategy, use the "Recommendations" and "Engagement Metrics" to provide tailored advice.
- **Tone**: Professional, empathetic, and data-driven.

${staleWarning}
${dataContext}

### FORMATTING
- Format your responses using **Markdown**.
- Use ## and ### for sections.
- Use tables for data comparisons.
- Use > for important insights or summaries.

${assembledContext}

### CUSTOM PERSONA
${userContext?.email === 'ellen@habitaware.com' ? 
  "You are talking to Ellen, the founder. Use a warm, visionary, and encouraging tone. When she asks to write blogs or posts, pull from the POST ANALYTICS below and write in HER voice: empathetic, slightly informal but deeply knowledgeable, and always focused on 'habit reversal' as a journey of awareness." : 
  "Maintain a professional and empathetic tone appropriate for community leadership."
}`,
      messages,
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "I couldn't generate a response.";

    // ── Persist Turn to Chatterbox ────────────────────────────────────────
    if (convoId && userContext?.email) {
      try {
        await ChatterboxClient.storeTurn({
          convoId,
          appId: "habitaware-ai",
          orgId: "habitaware",
          userId: userContext.email,
          questionEhash: ChatterboxClient.createEhash("habitaware", userContext.email, question),
          answerEhash:   ChatterboxClient.createEhash("habitaware", userContext.email, assistantMessage),
          metadata: {
            model: "claude-3-haiku-20240307",
            isEllen: userContext.email === 'ellen@habitaware.com'
          }
        });
      } catch (err) {
        console.warn(`[habitaware] Failed to store turn in Chatterbox:`, err);
      }
    }

    // Extract quick stats from notes for snapshot
    const postsMatch = notes.posts?.match(/total_posts:\s*(\d+)/);
    const membersMatch = notes.members?.match(/total_members:\s*(\d+)/);
    const spacesMatch = notes.posts?.match(/active_spaces:\s*(\d+)/);

    return {
      response: assistantMessage,
      dataSnapshot: {
        totalSpaces: spacesMatch ? parseInt(spacesMatch[1]) : 0,
        totalPosts: postsMatch ? parseInt(postsMatch[1]) : 0,
        totalMembers: membersMatch ? parseInt(membersMatch[1]) : 0,
      },
      convoId,
      notesStatus: {
        hasMembers: !!notes.members,
        hasPosts: !!notes.posts,
        isStale: notes.isStale,
      },
    };
  }, {
    body: t.Object({
      question: t.String(),
      convoId: t.Optional(t.String()),
      smartMemory: t.Optional(t.Boolean()),
      history: t.Optional(t.Array(t.Object({
        role: t.String(),
        content: t.String(),
      }))),
      userContext: t.Optional(t.Object({
        id: t.Optional(t.Number()),
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
        first_name: t.Optional(t.String()),
        last_name: t.Optional(t.String()),
        bio: t.Optional(t.Nullable(t.String())),
      })),
    }),
  })
  .post("/book-chat", async ({ body }) => {
    const { question, history, collection, orgId, ragsterUrl, convoId: reqConvoId, smartMemory } = body;

    let convoId = reqConvoId;
    let assembledContext = "";

    // ── Chatterbox Integration ───────────────────────────────────────────
    if (convoId) {
      try {
        const ctxRes = await ChatterboxClient.getContext(convoId);
        if (ctxRes && ctxRes.success && ctxRes.context) {
          const { latestMemory } = ctxRes.context;
          if (latestMemory?.summary) {
            assembledContext += `\n### SMART MEMORY (Summary of previous brainstorming):\n${latestMemory.summary}\n`;
          }
        }
      } catch (err) {
        console.warn(`[habitaware-book] Failed to fetch Chatterbox context for ${convoId}:`, err);
      }
    }

    const RAGSTER_API_URL = ragsterUrl || process.env.RAGSTER_API_URL || "https://agent-collective-ragster.fly.dev/api";
    const RAGSTER_ORG_ID = orgId || process.env.RAGSTER_DEFAULT_ORG_ID || "habitaware.ai";
    const RAGSTER_COLLECTION = collection || process.env.RAGSTER_BOOK_COLLECTION || "ae495393-50b8-4211-8edd-f2953afbdfa2";

    // Step 1: Search ragster for relevant chunks
    let bookContext = "";
    try {
      const searchRes = await fetch(`${RAGSTER_API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": RAGSTER_ORG_ID,
        },
        body: JSON.stringify({
          query: question,
          collection: RAGSTER_COLLECTION,
          org_id: RAGSTER_ORG_ID,
          topK: 10,
        }),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData.results || searchData.matches || [];
        if (results.length > 0) {
          bookContext = results
            .map((r: any, i: number) => {
              const text = r.text || r.content || r.metadata?.text || "";
              const score = r.score ? ` (relevance: ${(r.score * 100).toFixed(0)}%)` : "";
              return `[Excerpt ${i + 1}${score}]\n${text}`;
            })
            .join("\n\n---\n\n");
        }
      } else {
        console.error(`📖 Ragster search failed: ${searchRes.status} ${searchRes.statusText}`);
      }
    } catch (err) {
      console.error("📖 Ragster search error:", err);
    }

    if (!bookContext) {
      bookContext = "(No relevant excerpts found in the book for this question.)";
    }

    // Step 2: Send chunks + question to Claude
    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: question,
      },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are a helpful, warm, and knowledgeable assistant for the HabitAware parenting book.
You answer questions based on excerpts retrieved from the book.

### BOOK EXCERPTS
${bookContext}

### GUIDELINES
- Answer questions based on the book excerpts provided above. Quote or reference specific passages when possible.
- Be supportive and encouraging — the reader is a parent seeking guidance.
- If the excerpts don't cover the question, say so honestly and offer general advice.
- Format responses in **Markdown** with headers, lists, and emphasis for readability.
- Format responses in **Markdown** with headers, lists, and emphasis for readability.
- Keep answers focused and practical.

${assembledContext}`,
      messages,
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "I couldn't generate a response.";

    // ── Persist Turn to Chatterbox ────────────────────────────────────────
    const userEmail = body.userContext?.email || "anonymous-book-user";

    if (convoId) {
      try {
        await ChatterboxClient.storeTurn({
          convoId,
          appId: "habitaware-ai-book",
          orgId: "habitaware",
          userId: userEmail,
          questionEhash: ChatterboxClient.createEhash("habitaware", userEmail, question),
          answerEhash:   ChatterboxClient.createEhash("habitaware", userEmail, assistantMessage),
          metadata: {
            model: "claude-sonnet-4-20250514",
            type: "book-chat"
          }
        });
      } catch (err) {
        console.warn(`[habitaware-book] Failed to store turn in Chatterbox:`, err);
      }
    }

    return { response: assistantMessage, convoId };
  }, {
    body: t.Object({
      question: t.String(),
      convoId: t.Optional(t.String()),
      smartMemory: t.Optional(t.Boolean()),
      userContext: t.Optional(t.Any()),
      history: t.Optional(t.Array(t.Object({
        role: t.String(),
        content: t.String(),
      }))),
      collection: t.Optional(t.String()),
      orgId: t.Optional(t.String()),
      ragsterUrl: t.Optional(t.String()),
    }),
  });

