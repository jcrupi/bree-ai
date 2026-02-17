import { Elysia } from "elysia";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const MIGHTY_BASE_URL = "https://api.mn.co/admin/v1";
const API_KEY = process.env.MIGHTY_API_KEY;
const NETWORK_ID = process.env.MIGHTY_NETWORK_ID;
const AGENTX_DIR = process.env.AGENTX_DIR || (process.env.NODE_ENV === "production" ? "/app/data/agentx" : join(process.cwd(), "agentx"));

// Ensure directory exists
if (!existsSync(AGENTX_DIR)) {
  try {
    mkdirSync(AGENTX_DIR, { recursive: true });
  } catch (err) {
    console.error(`Failed to create AGENTX_DIR: ${AGENTX_DIR}`, err);
  }
}

async function mightyFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${MIGHTY_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Mighty API Error: ${response.status}`);
  }
  return response.json();
}

// ============ MEMBER TYPES ============
interface Member {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  location: string | null;
  created_at: string;
  avatar: string | null;
  time_zone?: string;
}

interface Subscription {
  member_id: number;
  email: string;
  first_name: string;
  last_name: string;
  location: string | null;
  created_at: string;
  plan: {
    id: number;
    name: string;
    amount: number;
    currency: string;
    type: string;
  };
  subscription: {
    canceled_at: string | null;
    trial_end: string | null;
  };
}

// ============ POST TYPES ============
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
  space_id: number;
  creator_id: number;
  images: (string | null)[];
  comments_enabled: boolean;
}

interface Space {
  id: number;
  name: string;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  post_id: number;
}

// ============ GENERATE MEMBERS NOTES ============
async function generateMembersNotes(): Promise<string> {
  // Fetch data
  const [membersRes, subscriptionsRes] = await Promise.all([
    mightyFetch<{ items: Member[] }>(`/networks/${NETWORK_ID}/members?per_page=200`),
    mightyFetch<{ items: Subscription[] }>(`/networks/${NETWORK_ID}/subscriptions?per_page=200`),
  ]);

  const members = membersRes.items;
  const subscriptions = subscriptionsRes.items;

  // Create subscription map
  const subMap = new Map<number, Subscription>();
  for (const sub of subscriptions) {
    subMap.set(sub.member_id, sub);
  }

  // Calculate metrics
  const now = new Date();
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const newLast7Days = members.filter(m => new Date(m.created_at) > day7Ago).length;
  const newLast30Days = members.filter(m => new Date(m.created_at) > day30Ago).length;
  const newLast90Days = members.filter(m => new Date(m.created_at) > day90Ago).length;

  // Subscription breakdown
  let paidCount = 0;
  let trialCount = 0;
  let freeCount = 0;
  let noneCount = 0;
  const planCounts = new Map<string, number>();

  for (const member of members) {
    const sub = subMap.get(member.id);
    if (sub) {
      const planName = sub.plan.name;
      planCounts.set(planName, (planCounts.get(planName) || 0) + 1);

      if (sub.plan.type === "subscription" && sub.plan.amount > 0) {
        const isTrial = sub.subscription.trial_end && new Date(sub.subscription.trial_end) > now;
        if (isTrial) {
          trialCount++;
        } else {
          paidCount++;
        }
      } else {
        freeCount++;
      }
    } else {
      noneCount++;
    }
  }

  // Geographic distribution
  const locationCounts = new Map<string, number>();
  for (const member of members) {
    const loc = member.location || "Unknown";
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
  }
  const topLocations = [...locationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Profile completeness
  const withAvatar = members.filter(m => m.avatar).length;
  const withBio = members.filter(m => m.bio && m.bio.trim().length > 10).length;

  // Cohort analysis - members by month
  const cohortCounts = new Map<string, number>();
  for (const member of members) {
    const date = new Date(member.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    cohortCounts.set(key, (cohortCounts.get(key) || 0) + 1);
  }
  const cohorts = [...cohortCounts.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  // Plan breakdown
  const planBreakdown = [...planCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Generate timestamp
  const generatedAt = now.toISOString();
  const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // Build markdown
  const markdown = `---
type: agentx-notes
subject: members
generated_at: ${generatedAt}
data_snapshot:
  total_members: ${members.length}
  paid_members: ${paidCount}
  trial_members: ${trialCount}
  free_members: ${freeCount}
  no_subscription: ${noneCount}
valid_until: ${validUntil}
---

# Member Analytics Summary

> **Generated:** ${new Date(generatedAt).toLocaleString()}
> **Valid Until:** ${new Date(validUntil).toLocaleString()}

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total Members** | ${members.length} |
| **Paid Members** | ${paidCount} (${((paidCount / members.length) * 100).toFixed(1)}%) |
| **Trial Members** | ${trialCount} (${((trialCount / members.length) * 100).toFixed(1)}%) |
| **Free Plan Members** | ${freeCount} (${((freeCount / members.length) * 100).toFixed(1)}%) |
| **No Subscription** | ${noneCount} (${((noneCount / members.length) * 100).toFixed(1)}%) |

## Growth Metrics

| Period | New Members |
|--------|-------------|
| Last 7 days | ${newLast7Days} |
| Last 30 days | ${newLast30Days} |
| Last 90 days | ${newLast90Days} |

**Average daily signups (30 day):** ${(newLast30Days / 30).toFixed(1)} members/day

## Subscription Breakdown

### By Status
- **Paid (Active):** ${paidCount} members
- **Trial:** ${trialCount} members
- **Free Plan:** ${freeCount} members
- **No Plan:** ${noneCount} members

### By Plan
${planBreakdown.map(p => `- **${p.name}:** ${p.count} members`).join('\n')}

## Geographic Distribution

### Top 10 Locations
${topLocations.map(([loc, count], i) => `${i + 1}. **${loc}:** ${count} members`).join('\n')}

## Profile Completeness

| Metric | Count | Percentage |
|--------|-------|------------|
| Members with avatar | ${withAvatar} | ${((withAvatar / members.length) * 100).toFixed(1)}% |
| Members with bio | ${withBio} | ${((withBio / members.length) * 100).toFixed(1)}% |

## Cohort Analysis (Members by Join Month)

| Month | New Members |
|-------|-------------|
${cohorts.map(([month, count]) => `| ${month} | ${count} |`).join('\n')}

## Key Insights

${paidCount + trialCount > 0 ? `- **Revenue Members:** ${paidCount + trialCount} members are on paid/trial plans (${(((paidCount + trialCount) / members.length) * 100).toFixed(1)}% of total)` : '- No paid subscribers currently'}
${trialCount > 0 ? `- **Trial Pipeline:** ${trialCount} members in trial - potential conversion opportunity` : ''}
${newLast7Days > newLast30Days / 4 ? `- **Growth Accelerating:** Recent week (${newLast7Days}) exceeds weekly average (${(newLast30Days / 4).toFixed(0)})` : `- **Growth Steady:** ${newLast7Days} new members this week`}
${withAvatar < members.length * 0.5 ? `- **Profile Opportunity:** Only ${((withAvatar / members.length) * 100).toFixed(0)}% have avatars - consider profile completion campaign` : ''}
- **Top Location:** ${topLocations[0]?.[0] || 'Unknown'} with ${topLocations[0]?.[1] || 0} members

## Recommendations

${paidCount < members.length * 0.1 ? '1. **Increase Conversions:** Less than 10% are paid - consider targeted upgrade campaigns' : ''}
${trialCount > 0 ? `2. **Nurture Trials:** Engage ${trialCount} trial members before expiration` : ''}
${withBio < members.length * 0.3 ? '3. **Profile Completion:** Encourage members to complete profiles for better community connection' : ''}
4. **Geographic Focus:** Consider localized content for top locations

## Raw Aggregations

\`\`\`json
${JSON.stringify({
  total_members: members.length,
  subscription_breakdown: { paid: paidCount, trial: trialCount, free: freeCount, none: noneCount },
  growth: { last_7_days: newLast7Days, last_30_days: newLast30Days, last_90_days: newLast90Days },
  profile_completeness: { with_avatar: withAvatar, with_bio: withBio },
  top_locations: topLocations.slice(0, 5),
  plans: planBreakdown,
  recent_cohorts: cohorts.slice(0, 6),
}, null, 2)}
\`\`\`
`;

  return markdown;
}

// ============ GENERATE POSTS NOTES ============
async function generatePostsNotes(): Promise<string> {
  // Fetch data
  const [spacesRes, postsRes, commentsRes] = await Promise.all([
    mightyFetch<{ items: Space[] }>(`/networks/${NETWORK_ID}/spaces?per_page=100`),
    mightyFetch<{ items: Post[] }>(`/networks/${NETWORK_ID}/posts?per_page=200`),
    fetchAllComments(),
  ]);

  const spaces = spacesRes.items;
  const posts = postsRes.items;
  const comments = commentsRes;

  // Create space map
  const spaceMap = new Map<number, string>();
  for (const space of spaces) {
    spaceMap.set(space.id, space.name);
  }

  // Calculate metrics
  const now = new Date();
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const postsLast7Days = posts.filter(p => new Date(p.created_at) > day7Ago).length;
  const postsLast30Days = posts.filter(p => new Date(p.created_at) > day30Ago).length;

  // Posts by type
  const typeCounts = new Map<string, number>();
  for (const post of posts) {
    typeCounts.set(post.post_type, (typeCounts.get(post.post_type) || 0) + 1);
  }

  // Posts by space
  const spaceCounts = new Map<number, number>();
  for (const post of posts) {
    spaceCounts.set(post.space_id, (spaceCounts.get(post.space_id) || 0) + 1);
  }
  const spaceActivity = [...spaceCounts.entries()]
    .map(([id, count]) => ({ id, name: spaceMap.get(id) || `Space ${id}`, count }))
    .sort((a, b) => b.count - a.count);

  // Comments per post
  const commentsByPost = new Map<number, number>();
  for (const comment of comments) {
    commentsByPost.set(comment.post_id, (commentsByPost.get(comment.post_id) || 0) + 1);
  }
  const totalComments = comments.length;
  const avgCommentsPerPost = posts.length > 0 ? totalComments / posts.length : 0;

  // Posts with most comments
  const postsWithComments = posts
    .map(p => ({ ...p, commentCount: commentsByPost.get(p.id) || 0 }))
    .filter(p => p.commentCount > 0)
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 10);

  // Unique creators
  const creatorIds = new Set(posts.map(p => p.creator_id));

  // Content analysis - extract themes from titles/summaries
  const allText = posts
    .map(p => `${p.title || ''} ${p.summary || ''} ${p.description || ''}`.toLowerCase())
    .join(' ');

  // Theme detection
  const themes = {
    recovery: countMatches(allText, ['progress', 'better', 'improved', 'milestone', 'streak', 'success', 'proud', 'achieved']),
    struggles: countMatches(allText, ['hard', 'difficult', 'relapse', 'frustrated', 'help', 'struggle', 'challenge', 'setback']),
    tools: countMatches(allText, ['keen', 'bracelet', 'fidget', 'ampt', 'tracking', 'blocking', 'awareness', 'tool']),
    support: countMatches(allText, ['feeling', 'anxiety', 'shame', 'support', 'understand', 'emotion', 'stress']),
    questions: countMatches(allText, ['how do', 'what is', 'why', 'does anyone', 'has anyone', 'question', 'advice']),
    wins: countMatches(allText, ['win', 'celebrate', 'excited', 'finally', 'accomplished', 'victory']),
    welcome: countMatches(allText, ['welcome', 'introduce', 'new here', 'hello', 'hi everyone', 'joined']),
  };

  // Posts with images
  const postsWithImages = posts.filter(p => p.images && p.images.some(img => img !== null)).length;

  // Generate timestamp
  const generatedAt = now.toISOString();
  const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // Recent posts and Top Engaged for samples
  const recentPosts = posts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map(p => ({
      title: p.title || p.summary || '(No title)',
      space: spaceMap.get(p.space_id) || 'Unknown',
      type: p.post_type,
      date: p.created_at.split('T')[0],
      comments: commentsByPost.get(p.id) || 0,
      creator: p.creator_id
    }));

  const topEngaged = posts
    .map(p => ({ ...p, commentCount: commentsByPost.get(p.id) || 0 }))
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 15)
    .map(p => ({
      title: p.title || p.summary || '(No title)',
      comments: p.commentCount,
      space: spaceMap.get(p.space_id) || 'Unknown',
      date: p.created_at.split('T')[0]
    }));

  // Build markdown
  const markdown = `---
type: agentx-notes
subject: posts
generated_at: ${generatedAt}
data_snapshot:
  total_posts: ${posts.length}
  total_comments: ${totalComments}
  active_spaces: ${spaceActivity.filter(s => s.count > 0).length}
  unique_creators: ${creatorIds.size}
  avg_posts_per_day: ${(postsLast30Days / 30).toFixed(1)}
valid_until: ${validUntil}
---

# Post Analytics Summary

> **Generated:** ${new Date(generatedAt).toLocaleString()}
> **Valid Until:** ${new Date(validUntil).toLocaleString()}

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total Posts** | ${posts.length} |
| **Total Comments** | ${totalComments} |
| **Active Spaces** | ${spaceActivity.filter(s => s.count > 0).length} |
| **Unique Content Creators** | ${creatorIds.size} |
| **Posts with Images** | ${postsWithImages} (${((postsWithImages / posts.length) * 100).toFixed(1)}%) |

## Activity Metrics

| Period | Posts |
|--------|-------|
| Last 7 days | ${postsLast7Days} |
| Last 30 days | ${postsLast30Days} |

**Average daily posts (30 day):** ${(postsLast30Days / 30).toFixed(1)} posts/day

## Top 10 Active Spaces

| Rank | Space | Posts |
|------|-------|-------|
${spaceActivity.slice(0, 10).map((s, i) => `| ${i + 1} | ${s.name} | ${s.count} |`).join('\n')}

## Trending Topics & Themes
Based on content analysis of titles and summaries:

| Theme | Mentions | Relevance |
|-------|----------|-----------|
| Recovery & Progress | ${themes.recovery} | ${getRelevance(themes.recovery, posts.length)} |
| Struggles & Challenges | ${themes.struggles} | ${getRelevance(themes.struggles, posts.length)} |
| Tools & Techniques | ${themes.tools} | ${getRelevance(themes.tools, posts.length)} |
| Emotional Support | ${themes.support} | ${getRelevance(themes.support, posts.length)} |
| Questions & Help | ${themes.questions} | ${getRelevance(themes.questions, posts.length)} |
| Wins & Celebrations | ${themes.wins} | ${getRelevance(themes.wins, posts.length)} |
| Welcomes & Intros | ${themes.welcome} | ${getRelevance(themes.welcome, posts.length)} |

### Deep Dive: Top Themes
${getTopThemes(themes)}

## Top Engaged Content (Most Comments)
These posts generated the most discussion in the community:

${topEngaged.map((p, i) => `${i + 1}. **"${p.title}"** in *${p.space}* (${p.comments} comments) - ${p.date}`).join('\n')}

## Recent Activity Sample (Last 50 Posts)
A sample of recent community activity to understand current mood and topics:

${recentPosts.map(p => `- **[${p.space}]** "${p.title}" (${p.type}) by User ${p.creator} - ${p.comments} comments, ${p.date}`).join('\n')}

## Key Insights
- **Most Active Space:** "${spaceActivity[0]?.name}" with ${spaceActivity[0]?.count} posts
- **Engagement Health:** Average of ${avgCommentsPerPost.toFixed(1)} comments per post
- **Creator Diversity:** ${creatorIds.size} unique members contributing content
${themes.struggles > themes.wins ? `- **Support Opportunity:** Higher volume of struggle-related content than wins. Community may benefit from extra encouragement.` : `- **Positive Momentum:** More success stories and wins are being shared than struggles.`}
${themes.questions > posts.length * 0.1 ? `- **Knowledge Base Opportunity:** High percentage of questions suggests a need for centralized FAQs or expert sessions.` : ''}

## Recommendations
1. **Highlight Success:** Feature a "Post of the Week" from the **Recovery & Progress** category.
2. **Community Building:** Encourage more introduces in the **Welcomes** category to integrate new members.
3. **Engagement:** Prompt for more comments on posts in quieter active spaces like *${spaceActivity[spaceActivity.length > 5 ? 5 : 0]?.name}*.

## Raw Aggregations
\`\`\`json
${JSON.stringify({
  total_posts: posts.length,
  total_comments: totalComments,
  activity: { last_7_days: postsLast7Days, last_30_days: postsLast30Days },
  space_activity: spaceActivity.slice(0, 10),
  themes,
  engagement: { avg_comments: avgCommentsPerPost, top_engaged_count: topEngaged.length },
  creators: { unique: creatorIds.size, ratio: creatorIds.size / posts.length },
}, null, 2)}
\`\`\`
`;

  return markdown;
}

// Helper functions
async function fetchAllComments(): Promise<Comment[]> {
  try {
    const postsRes = await mightyFetch<{ items: { id: number }[] }>(`/networks/${NETWORK_ID}/posts?per_page=50`);
    const commentPromises = postsRes.items.slice(0, 20).map(async (post) => {
      try {
        const res = await mightyFetch<{ items: Comment[] }>(`/networks/${NETWORK_ID}/posts/${post.id}/comments`);
        return res.items.map(c => ({ ...c, post_id: post.id }));
      } catch {
        return [];
      }
    });
    return (await Promise.all(commentPromises)).flat();
  } catch {
    return [];
  }
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function getRelevance(count: number, totalPosts: number): string {
  const ratio = count / totalPosts;
  if (ratio > 0.5) return '🔥 High';
  if (ratio > 0.2) return '📈 Medium';
  if (ratio > 0.05) return '📊 Low';
  return '➖ Minimal';
}

function getTopThemes(themes: Record<string, number>): string {
  const sorted = Object.entries(themes).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3);
  const descriptions: Record<string, string> = {
    recovery: 'Members are sharing progress and recovery milestones',
    struggles: 'Members are discussing challenges and seeking help',
    tools: 'Discussion around Keen bracelets, AMPT tracking, and management techniques',
    support: 'Emotional support and understanding within the community',
    questions: 'Members asking questions and seeking advice',
    wins: 'Celebrations and success stories being shared',
    welcome: 'New member introductions and welcomes',
  };

  return top3.map(([ key, count], i) =>
    `${i + 1} **${key.charAt(0).toUpperCase() + key.slice(1)}** (${count} mentions): ${descriptions[key] || ''}`
  ).join('\n');
}

// ============ ROUTES ============
export const agentxRoutes = new Elysia()

  // Generate members notes
  .post("/generate/members", async () => {
    try {
      const markdown = await generateMembersNotes();
      const filePath = join(AGENTX_DIR, "members.agentx.md");
      writeFileSync(filePath, markdown, "utf-8");
      return {
        success: true,
        message: "Members notes generated successfully",
        path: filePath,
        size: markdown.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })

  // Generate posts notes
  .post("/generate/posts", async () => {
    try {
      const markdown = await generatePostsNotes();
      const filePath = join(AGENTX_DIR, "posts.agentx.md");
      writeFileSync(filePath, markdown, "utf-8");
      return {
        success: true,
        message: "Posts notes generated successfully",
        path: filePath,
        size: markdown.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  })

  // Generate all notes
  .post("/generate/all", async () => {
    const results = {
      members: { success: false, error: null as string | null },
      posts: { success: false, error: null as string | null },
    };

    try {
      const membersMarkdown = await generateMembersNotes();
      writeFileSync(join(AGENTX_DIR, "members.agentx.md"), membersMarkdown, "utf-8");
      results.members.success = true;
    } catch (error) {
      results.members.error = error instanceof Error ? error.message : "Unknown error";
    }

    try {
      const postsMarkdown = await generatePostsNotes();
      writeFileSync(join(AGENTX_DIR, "posts.agentx.md"), postsMarkdown, "utf-8");
      results.posts.success = true;
    } catch (error) {
      results.posts.error = error instanceof Error ? error.message : "Unknown error";
    }

    return {
      success: results.members.success && results.posts.success,
      results,
    };
  })

  // Get notes content
  .get("/notes/:type", ({ params }) => {
    const filePath = join(AGENTX_DIR, `${params.type}.agentx.md`);
    if (!existsSync(filePath)) {
      return { exists: false, content: null };
    }
    const content = readFileSync(filePath, "utf-8");
    return { exists: true, content };
  })

  // Get notes status
  .get("/status", () => {
    const membersPath = join(AGENTX_DIR, "members.agentx.md");
    const postsPath = join(AGENTX_DIR, "posts.agentx.md");

    const getMeta = (path: string) => {
      if (!existsSync(path)) return null;
      const content = readFileSync(path, "utf-8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) return { exists: true, meta: null };

      // Parse YAML-like frontmatter
      const lines = match[1].split('\n');
      const meta: Record<string, string> = {};
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          meta[key.trim()] = valueParts.join(':').trim();
        }
      }
      return { exists: true, meta };
    };

    return {
      members: getMeta(membersPath),
      posts: getMeta(postsPath),
    };
  });
