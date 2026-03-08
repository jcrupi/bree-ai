import React, { useState, useCallback } from 'react';
import {
  Newspaper, ExternalLink, RefreshCw, TrendingUp,
  AlertCircle, Sparkles, Clock, Tag,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface Article {
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  tags: string[];
  relevance: string;
}

// ─── Static seed articles (always shown while live fetch loads) ───────────────
const SEED_ARTICLES: Article[] = [
  {
    title: 'Waystar Expands Google Cloud Collaboration to Advance Agentic AI for Autonomous Revenue Cycle',
    summary:
      'Waystar deepened its partnership with Google Cloud, leveraging Gemini models and BigQuery to accelerate agentic AI capabilities in revenue cycle management — directly relevant to Grelin AI\'s chart & claims automation roadmap.',
    source: 'PR Newswire',
    url: 'https://www.prnewswire.com',
    date: 'Mar 2026',
    tags: ['Agentic AI', 'RCM', 'Claims'],
    relevance: 'High — autonomous claims processing aligned with Grelin AI\'s core offering',
  },
  {
    title: 'Elation Health Launches AI-Powered Billing Workflows Connecting Chart Context to Claims',
    summary:
      'Elation Health announced AI billing workflows that bridge clinical documentation, chart context, and past claims data to auto-generate bill-ready claims — a direct competitor signal for Grelin AI\'s Chart/Claims AI product.',
    source: 'Elation Health',
    url: 'https://www.elationhealth.com',
    date: 'Mar 2026',
    tags: ['Chart AI', 'Claims AI', 'Billing'],
    relevance: 'High — competitor launch in chart-to-claim automation space',
  },
  {
    title: 'Procode AI Launches Surgical Billing AI Copilot to Slash Coding Denials by 40%',
    summary:
      'Procode AI unveiled an AI coding copilot that translates operative reports into ICD-10 and CPT codes with 95%+ accuracy. Surgical specialties like Interventional Pain — a Grelin AI prospect — are primary targets.',
    source: 'Fierce Healthcare',
    url: 'https://www.fiercehealthcare.com',
    date: 'Mar 2026',
    tags: ['Coding AI', 'Denials', 'Claims'],
    relevance: 'High — maps directly to pain specialty prospects in Grelin AI pipeline',
  },
  {
    title: 'Ease Health Emerges from Stealth with $41M to Unify EHR, RCM, and CRM with AI',
    summary:
      'Ease Health raised $41M to build an AI-infused platform unifying EHR, RCM, and CRM — reducing manual billing and utilization work. A new entrant positioning in the integrated care management space Grelin AI operates in.',
    source: 'Behavioral Health Business',
    url: 'https://bhbusiness.com',
    date: 'Mar 2026',
    tags: ['EHR', 'RCM', 'Claims AI', 'Funding'],
    relevance: 'Medium — competitive entrant, also validates market demand',
  },
  {
    title: 'AI Claims Automation Projected to Help Providers Recover 40% More Revenue in 2026',
    summary:
      'New industry data shows organizations using AI-powered RCM systems recover 40% more revenue than manual-only shops. Predictive denial prevention and auto-correction of chart-coding mismatches are the top ROI drivers.',
    source: 'Medical Economics',
    url: 'https://www.medicaleconomics.com',
    date: 'Mar 2026',
    tags: ['RCM', 'Revenue Recovery', 'AI ROI'],
    relevance: 'High — strong sales proof point for Grelin AI conversations',
  },
];

const TAG_COLORS: Record<string, string> = {
  'Agentic AI':   'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'RCM':          'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Claims':       'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Claims AI':    'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Chart AI':     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Billing':      'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Coding AI':    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Denials':      'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'EHR':          'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Funding':      'bg-green-500/15 text-green-300 border-green-500/30',
  'RCM Funding':  'bg-green-500/15 text-green-300 border-green-500/30',
  'Revenue Recovery': 'bg-lime-500/15 text-lime-300 border-lime-500/30',
  'AI ROI':       'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
};

function tagClass(tag: string): string {
  return TAG_COLORS[tag] ?? 'bg-slate-700/40 text-slate-400 border-slate-600/40';
}

function relevanceDot(rel: string): string {
  if (rel.startsWith('High')) return 'bg-emerald-400';
  if (rel.startsWith('Medium')) return 'bg-amber-400';
  return 'bg-slate-500';
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <div
      className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur p-5 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all duration-300 shadow-lg shadow-black/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow shadow-indigo-500/30">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {article.date}
            <span className="text-slate-700">·</span>
            {article.source}
          </span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
          title="Open article"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-100 leading-snug mb-2 group-hover:text-white transition-colors">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed mb-3">
        {article.summary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {article.tags.map(tag => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tagClass(tag)}`}
          >
            <Tag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}
      </div>

      {/* Relevance */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/40">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${relevanceDot(article.relevance)}`} />
        <span className="text-[11px] text-slate-500">
          <span className="text-slate-400 font-medium">Grelin AI Relevance:</span>{' '}
          {article.relevance}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyNewsTab() {
  const [articles, setArticles] = useState<Article[]>(SEED_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [liveLoaded, setLiveLoaded] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const prompt = `You are a healthcare AI industry analyst. Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.

Search the web and return the top 5 most recent and relevant healthcare AI news stories for a company called **Grelin AI** that builds:
- **Chart AI**: AI that reads and understands clinical charts/medical records
- **Claims AI**: AI that automates insurance claims processing and denial management
- Autonomous Revenue Cycle Management (RCM) for healthcare providers

Return ONLY a valid JSON array (no markdown, no extra text) with exactly 5 objects following this schema:
[
  {
    "title": "article headline",
    "summary": "2–3 sentence summary explaining what happened and why it matters to Grelin AI",
    "source": "publication name",
    "url": "full https url",
    "date": "Month YYYY or exact date",
    "tags": ["tag1", "tag2"],
    "relevance": "High/Medium/Low — one sentence on why it matters to Grelin AI"
  }
]

Focus on: autonomous RCM, AI claims automation, chart-to-code AI, prior auth AI, denial management AI, clinical documentation AI, healthcare AI funding rounds, and competitor product launches.`;

    try {
      const res = await fetch(`${API_BASE}/api/openai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          query: prompt,
          context: 'Grelin AI builds Chart AI and Claims AI for autonomous healthcare revenue cycle management.',
          options: {
            model: 'gpt-4o',
            temperature: 0.3,
            max_tokens: 2000,
            systemPrompt:
              'You are a healthcare AI industry news analyst. Return only valid JSON arrays as instructed. No markdown fences, no extra text.',
          },
        }),
      });

      const data = await res.json();
      const raw: string = data.response || '';

      // Strip potential markdown code fences
      const cleaned = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const parsed: Article[] = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setArticles(parsed.slice(0, 5));
        setLiveLoaded(true);
        setLastFetched(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Could not fetch live articles. Showing curated weekly digest below.');
      // Keep seed articles visible
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur p-6 shadow-2xl shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-lg shadow-sky-500/30">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Healthcare AI News</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Top stories relevant to{' '}
                <span className="text-indigo-300 font-semibold">Grelin AI</span>{' '}
                · Chart &amp; Claims AI focus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {lastFetched && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {lastFetched}
              </span>
            )}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching…' : liveLoaded ? 'Refresh' : 'Fetch Live News'}
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">
              {liveLoaded ? 'Live results via GPT-4o' : 'Curated weekly digest'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-slate-400">AI-relevance scored per article</span>
          </div>
          {!liveLoaded && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-300">Click "Fetch Live News" for real-time articles</span>
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 animate-pulse"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-slate-800" />
                <div className="h-3 w-32 bg-slate-800 rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-slate-800 rounded-full mb-2" />
              <div className="h-3 w-full bg-slate-800/60 rounded-full mb-1" />
              <div className="h-3 w-5/6 bg-slate-800/60 rounded-full mb-3" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-slate-800/60 rounded-full" />
                <div className="h-5 w-20 bg-slate-800/60 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article cards */}
      {!loading && (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
