import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Layers,
  Bot,
  Database,
  Cpu,
  Palette,
  Play,
  X,
  Loader2,
  Check,
  Zap,
  Link as LinkIcon,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react'
import { getFatApps, saveFatApp, slugify, type FatApp } from '../utils/fatApps'

type PhaseId =
  | 'create'
  | 'describe'
  | 'biz-spec'
  | 'agents'
  | 'domain'
  | 'db'
  | 'implement'
  | 'bree-ui'

interface PhaseBox {
  id: PhaseId
  label: string
  sublabel?: string
  icon: typeof FileText
  phaseBg: string
  canRun: boolean
}

const PHASES: PhaseBox[] = [
  { id: 'create', label: '1. Create FatApp', sublabel: 'Start new project', icon: Zap, phaseBg: 'bg-indigo-500/15', canRun: false },
  { id: 'describe', label: '2. Describe', sublabel: 'App name, domain, clone sources (ClickUp, Linear, Slack…)', icon: FileText, phaseBg: 'bg-indigo-500/15', canRun: false },
  { id: 'biz-spec', label: '3. Create {name}.biz.agentx.md', sublabel: 'Business specification', icon: Layers, phaseBg: 'bg-teal-500/15', canRun: true },
  { id: 'agents', label: 'AI Agents', sublabel: 'Agentx notes for agents', icon: Bot, phaseBg: 'bg-amber-500/15', canRun: true },
  { id: 'domain', label: 'Domain Model', sublabel: 'Entities, relationships', icon: Layers, phaseBg: 'bg-amber-500/15', canRun: true },
  { id: 'db', label: 'Database', sublabel: 'Schema, migrations', icon: Database, phaseBg: 'bg-amber-500/15', canRun: true },
  { id: 'implement', label: '7. Create System', sublabel: 'Domain, DB, agents, NATS comms', icon: Cpu, phaseBg: 'bg-purple-500/15', canRun: true },
  { id: 'bree-ui', label: '8. bree-ui.agentx.md', sublabel: 'UI generation layer (future)', icon: Palette, phaseBg: 'bg-slate-500/10', canRun: false },
]

export function ProcessDiagram() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PhaseBox | null>(null)
  const [running, setRunning] = useState<PhaseId | null>(null)
  const [runComplete, setRunComplete] = useState<PhaseId | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState('')
  const [cloneLinks, setCloneLinks] = useState<string[]>([''])
  const [bizAgentxContent, setBizAgentxContent] = useState('')
  const [fatAppId, setFatAppId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const apps = getFatApps()
  const activeApp = apps.find((a) => a.id === fatAppId) ?? apps[0]
  const slug = slugify(name) || 'my-fatapp'

  const addCloneLink = () => setCloneLinks((prev) => [...prev, ''])
  const removeCloneLink = (i: number) => setCloneLinks((prev) => prev.filter((_, j) => j !== i))
  const updateCloneLink = (i: number, v: string) =>
    setCloneLinks((prev) => [...prev.slice(0, i), v, ...prev.slice(i + 1)])

  const handleSaveDescribe = () => {
    setSaving(true)
    const id = fatAppId || `fatapp-${Date.now()}`
    const now = new Date().toISOString()
    const app: FatApp = {
      id,
      slug: slugify(name) || 'my-fatapp',
      name,
      description,
      domain,
      cloneSources: cloneLinks.filter(Boolean),
      status: 'draft',
      createdAt: fatAppId ? (getFatApps().find((a) => a.id === id)?.createdAt ?? now) : now,
      updatedAt: now,
    }
    saveFatApp(app)
    setFatAppId(id)
    setSaving(false)
    setSelected(null)
  }

  const handleGenerateBiz = () => {
    setSaving(true)
    const template = `# ${name} - Business Specification (AgentX)

kind: biz
slug: ${slug}
version: "1.0.0"
description: |
  ${description}

domain: ${domain}

clone_sources:
${cloneLinks.filter(Boolean).map((l) => `  - ${l}`).join('\n')}

---

## Business Context

**Domain:** ${domain}

**App Purpose:** ${description}

**Reference Apps (clone from domain perspective):**
${cloneLinks.filter(Boolean).map((l) => `- ${l}`).join('\n')}

## Core Entities

<!-- Define from domain analysis of clone sources -->

## Domain Model

<!-- Entities, relationships, invariants -->

## API Surface

<!-- Endpoints, events, NATS subjects -->

## AgentX NATS Comms

<!-- Subjects, message formats for agent coordination -->
`
    setBizAgentxContent(template)
    setSaving(false)
  }

  const handleSaveBiz = () => {
    if (!fatAppId) return
    setSaving(true)
    const apps = getFatApps()
    const app = apps.find((a) => a.id === fatAppId)
    if (app) {
      app.bizAgentxPath = `${slug}.biz.agentx.md`
      app.status = 'biz-generated'
      app.updatedAt = new Date().toISOString()
      saveFatApp(app)
    }
    setSaving(false)
    setSelected(null)
  }

  const handleRun = async (box: PhaseBox) => {
    if (!box.canRun) return
    setRunning(box.id)
    setRunComplete(null)
    await new Promise((r) => setTimeout(r, 1200))
    setRunning(null)
    setRunComplete(box.id)
    setTimeout(() => setRunComplete(null), 2000)
    setSelected(null)
  }

  const handleFinish = () => {
    if (fatAppId) {
      const apps = getFatApps()
      const app = apps.find((a) => a.id === fatAppId)
      if (app) {
        app.status = 'agents-generated'
        app.updatedAt = new Date().toISOString()
        saveFatApp(app)
      }
    }
    navigate(`/app/${slug}`)
  }

  const copyBiz = () => {
    navigator.clipboard.writeText(bizAgentxContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderPanelContent = () => {
    if (!selected) return null

    const isDefine = selected.id === 'create' || selected.id === 'describe'
    const isBizSpec = selected.id === 'biz-spec'
    const isBuild = ['agents', 'domain', 'db'].includes(selected.id)
    const isImplement = selected.id === 'implement'
    const isBreeUi = selected.id === 'bree-ui'

    if (isDefine) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">App Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TaskFlow Pro"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-fat-500/20 outline-none"
            />
            {name && <p className="text-slate-500 text-xs mt-1 font-mono">Slug: {slug}.biz.agentx.md</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A project management tool for teams..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-fat-500/20 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. project-management, crm"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-fat-500/20 outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Clone Sources
              </label>
              <button onClick={addCloneLink} className="text-fat-400 hover:text-fat-300 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {cloneLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={link}
                    onChange={(e) => updateCloneLink(i, e.target.value)}
                    placeholder="https://clickup.com, https://linear.app..."
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-fat-500/20 outline-none"
                  />
                  <button onClick={() => removeCloneLink(i)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveDescribe}
            disabled={saving || !name.trim() || !description.trim()}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-fat-500/20 text-fat-300 font-semibold border border-fat-500/40 hover:bg-fat-500/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Save
          </button>
        </div>
      )
    }

    if (isBizSpec) {
      return (
        <div className="space-y-4">
          {!bizAgentxContent ? (
            <button
              onClick={handleGenerateBiz}
              disabled={saving || !name.trim()}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-fat-500/20 text-fat-300 font-semibold border border-fat-500/40 hover:bg-fat-500/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
              Generate {slug}.biz.agentx.md
            </button>
          ) : (
            <>
              <div className="rounded-xl border border-slate-600 bg-slate-800/60 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-600 flex items-center justify-between">
                  <span className="text-slate-400 text-sm font-mono">{slug}.biz.agentx.md</span>
                  <button onClick={copyBiz} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={bizAgentxContent}
                  onChange={(e) => setBizAgentxContent(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-4 bg-slate-900 text-slate-300 font-mono text-sm resize-none focus:outline-none focus:ring-0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBiz}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-fat-500/20 text-fat-300 font-semibold border border-fat-500/40 hover:bg-fat-500/30 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Save
                </button>
                <button onClick={handleGenerateBiz} className="px-4 py-3 rounded-xl bg-slate-700/50 text-slate-400 hover:text-slate-200">
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )
    }

    if (isBuild) {
      return (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Generate agentx notes for {selected.label.toLowerCase()}. These will be used to create the domain, db, and agents.
          </p>
          <button
            onClick={() => handleRun(selected)}
            disabled={running === selected.id}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {running === selected.id ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Running…</>
            ) : (
              <><Play className="w-5 h-5" /> Generate</>
            )}
          </button>
          <button
            onClick={handleFinish}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium border border-slate-600 hover:bg-slate-600/50"
          >
            <Check className="w-5 h-5" /> Finish & View FatApp
          </button>
        </div>
      )
    }

    if (isImplement) {
      return (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Create domain model, DB, AI agents, and NATS comms from the generated notes.
          </p>
          <button
            onClick={() => handleRun(selected)}
            disabled={running === selected.id}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {running === selected.id ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Running…</>
            ) : (
              <><Play className="w-5 h-5" /> Run</>
            )}
          </button>
        </div>
      )
    }

    if (isBreeUi) {
      return (
        <p className="text-slate-500 text-sm">
          Coming soon. Any AI tool will be able to build UIs on the FatApp AI system.
        </p>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-fat-400 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>

        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-2xl font-bold text-white">FatApp Creation Process</h1>
          <p className="text-slate-400 text-sm mt-1">Click any block to design or run that step</p>
          {activeApp && (
            <p className="text-slate-500 text-xs mt-2">
              Active: <span className="text-fat-400">{activeApp.name}</span>
            </p>
          )}
        </motion.header>

        <div className="space-y-4">
          <div className={`rounded-2xl p-4 bg-indigo-500/15 border border-indigo-500/20`}>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Define</div>
            <div className="flex flex-col sm:flex-row gap-3">
              {PHASES.slice(0, 2).map((box) => (
                <PhaseBoxButton key={box.id} box={box} onClick={() => setSelected(box)} running={running === box.id} runComplete={runComplete === box.id} />
              ))}
            </div>
          </div>

          <ArrowDown />

          <div className="rounded-2xl p-4 bg-teal-500/15 border border-teal-500/20">
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">Design</div>
            <PhaseBoxButton box={PHASES[2]} onClick={() => setSelected(PHASES[2])} running={running === PHASES[2].id} runComplete={runComplete === PHASES[2].id} />
          </div>

          <ArrowDown />

          <div className="rounded-2xl p-4 bg-amber-500/15 border border-amber-500/20">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Build — Generate Agentx Notes</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PHASES.slice(3, 6).map((box) => (
                <PhaseBoxButton key={box.id} box={box} onClick={() => setSelected(box)} running={running === box.id} runComplete={runComplete === box.id} />
              ))}
            </div>
          </div>

          <ArrowDown />

          <div className="rounded-2xl p-4 bg-purple-500/15 border border-purple-500/20">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Implement</div>
            <PhaseBoxButton box={PHASES[6]} onClick={() => setSelected(PHASES[6])} running={running === PHASES[6].id} runComplete={runComplete === PHASES[6].id} />
          </div>

          <ArrowDown />

          <div className="rounded-2xl p-4 bg-slate-800/40 border border-dashed border-slate-600">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Future</div>
            <PhaseBoxButton box={PHASES[7]} onClick={() => setSelected(PHASES[7])} running={false} runComplete={false} />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 text-sm font-mono">AgentX NATS</span>
          <span className="text-slate-600 text-xs">— connects agents throughout</span>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 rounded-xl ${selected.phaseBg}`}>
                    <selected.icon className="w-6 h-6 text-fat-400" />
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">{selected.label}</h3>
                {selected.sublabel && <p className="text-slate-400 text-sm mt-1">{selected.sublabel}</p>}
                <div className="mt-6">{renderPanelContent()}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ArrowDown() {
  return (
    <div className="flex justify-center py-1">
      <ChevronDown className="w-6 h-6 text-slate-600" />
    </div>
  )
}

function PhaseBoxButton({
  box,
  onClick,
  running,
  runComplete,
}: {
  box: PhaseBox
  onClick: () => void
  running: boolean
  runComplete: boolean
}) {
  const Icon = box.icon
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${box.phaseBg} border-slate-700/50 hover:border-fat-500/40 hover:shadow-lg hover:shadow-fat-500/10 focus:outline-none focus:ring-2 focus:ring-fat-500/20`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${box.phaseBg}`}>
          <Icon className="w-5 h-5 text-fat-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{box.label}</div>
          {box.sublabel && <div className="text-slate-500 text-xs mt-0.5 line-clamp-2">{box.sublabel}</div>}
        </div>
        <div className="flex-1" />
        {runComplete && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-1 rounded-full bg-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-400" />
          </motion.div>
        )}
        {running && <Loader2 className="w-5 h-5 text-fat-400 animate-spin flex-shrink-0" />}
      </div>
    </motion.button>
  )
}
