import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Bot,
  Database,
  Layers,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { useState } from 'react'
import { getFatAppBySlug } from '../utils/fatApps'

export function FatAppDetail() {
  const { slug } = useParams<{ slug: string }>()
  const app = slug ? getFatAppBySlug(slug) : undefined
  const [copied, setCopied] = useState(false)

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">FatApp not found</p>
          <Link to="/" className="text-fat-400 hover:text-fat-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const copyBizPath = () => {
    navigator.clipboard.writeText(`${app.slug}.biz.agentx.md`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-fat-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-fat-500/20 flex items-center justify-center border border-fat-500/30">
              <Layers className="w-8 h-8 text-fat-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{app.name}</h1>
              <p className="text-slate-400 mt-1">{app.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-lg bg-slate-800/60 text-slate-400 text-xs font-mono">
                  {app.domain}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  app.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                  app.status === 'agents-generated' ? 'bg-fat-500/20 text-fat-400' :
                  app.status === 'biz-generated' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {app.cloneSources.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-fat-400" />
                Clone Sources
              </h3>
              <ul className="space-y-2">
                {app.cloneSources.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fat-400 hover:text-fat-300 text-sm truncate block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6">
              <FileText className="w-8 h-8 text-fat-400 mb-3" />
              <h4 className="font-semibold text-white">Business Spec</h4>
              <p className="text-slate-500 text-sm mt-1 mb-3">
                {app.slug}.biz.agentx.md
              </p>
              <button
                onClick={copyBizPath}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy path
              </button>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6 opacity-60">
              <Bot className="w-8 h-8 text-fat-400 mb-3" />
              <h4 className="font-semibold text-white">AI Agents</h4>
              <p className="text-slate-500 text-sm mt-1">Agentx notes (coming soon)</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6 opacity-60">
              <Database className="w-8 h-8 text-fat-400 mb-3" />
              <h4 className="font-semibold text-white">Domain & DB</h4>
              <p className="text-slate-500 text-sm mt-1">Schema, migrations (coming soon)</p>
            </div>
          </div>

          <div className="rounded-xl border border-fat-500/30 bg-fat-500/10 p-6">
            <h4 className="font-semibold text-fat-300 mb-2">Next: bree-ui AgentX</h4>
            <p className="text-slate-400 text-sm">
              The bree-ui agentx note will let any AI tool build any UI on the FatApp AI system. Once agents, domain, and DB are generated, the UI layer can be built on top.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
