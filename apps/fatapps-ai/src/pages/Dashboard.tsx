import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Layers, ArrowRight, Sparkles } from 'lucide-react'
import { getFatApps } from '../utils/fatApps'

export function Dashboard() {
  const apps = getFatApps()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-fat-500/20 flex items-center justify-center border border-fat-500/30">
              <Layers className="w-6 h-6 text-fat-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                FatApps.ai
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Get off your Fat Apps!
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <Link
            to="/create"
            className="block rounded-2xl border-2 border-dashed border-fat-500/40 bg-fat-500/5 hover:bg-fat-500/10 hover:border-fat-500/60 p-8 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-fat-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-7 h-7 text-fat-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New FatApp</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Click blocks to design or run each step — Define → Design → Build → Implement
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-fat-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {apps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Your FatApps
              </h3>
              <div className="space-y-3">
                {apps.map((app) => (
                  <Link
                    key={app.id}
                    to={`/app/${app.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-fat-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-fat-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-fat-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{app.name}</h4>
                      <p className="text-slate-500 text-sm truncate">{app.domain}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      app.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                      app.status === 'agents-generated' ? 'bg-fat-500/20 text-fat-400' :
                      app.status === 'biz-generated' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {app.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-fat-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {apps.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <p className="text-slate-500">No FatApps yet. Create your first one to get started.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
