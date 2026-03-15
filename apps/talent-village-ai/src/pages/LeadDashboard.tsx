import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Shield, Plus, ArrowRight, Calendar, Clock,
  Zap, Users, ExternalLink, RefreshCw, Trash2, Check,
  ChevronRight, Activity, Lock, MessageSquare
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
export interface SavedVillage {
  villageId: string;
  villageName: string;
  description: string;
  leadName: string;
  leadEmail: string;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  lastAccessedAt?: string;
  status: 'scheduled' | 'active' | 'completed';
  slotCount?: number;
}

const STORAGE_KEY = 'tv_lead_villages';
const LEAD_PIN = '20816';

// ── Storage helpers ───────────────────────────────────────────────────
export function loadVillages(): SavedVillage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedVillage[];
  } catch {
    return [];
  }
}

export function saveVillage(village: SavedVillage): void {
  const all = loadVillages();
  const idx = all.findIndex(v => v.villageId === village.villageId);
  if (idx >= 0) {
    all[idx] = village;
  } else {
    all.unshift(village);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function deleteVillage(villageId: string): void {
  const all = loadVillages().filter(v => v.villageId !== villageId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function formatSchedule(date?: string, time?: string): string {
  if (!date || !time) return '';
  const d = new Date(date + 'T12:00:00');
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'ring-amber-100',
  },
  active: {
    label: 'Active',
    dot: 'bg-emerald-400 animate-pulse',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'ring-emerald-100',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-500 border-slate-200',
    ring: 'ring-slate-100',
  },
} as const;

// ── PIN Gate ──────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [dots, setDots] = useState<boolean[]>([false, false, false, false, false]);

  const handleDigit = useCallback((d: string) => {
    if (pin.length >= 5) return;
    const next = pin + d;
    setPin(next);
    setDots(prev => {
      const n = [...prev];
      n[next.length - 1] = true;
      return n;
    });
    if (next.length === 5) {
      setTimeout(() => {
        if (next === LEAD_PIN) {
          onUnlock();
        } else {
          setShake(true);
          setTimeout(() => {
            setPin('');
            setDots([false, false, false, false, false]);
            setShake(false);
          }, 600);
        }
      }, 200);
    }
  }, [pin, onUnlock]);

  const handleBackspace = useCallback(() => {
    if (pin.length === 0) return;
    const next = pin.slice(0, -1);
    setPin(next);
    setDots(prev => {
      const n = [...prev];
      n[pin.length - 1] = false;
      return n;
    });
  }, [pin]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleBackspace();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDigit, handleBackspace]);

  const keypad = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sky-600/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs text-center"
      >
        {/* Brand */}
        <div className="mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/50 mb-5">
            <Network size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            TalentVillage<span className="text-indigo-400">.ai</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Lead Command Center</p>
        </div>

        {/* Lock icon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Lock size={11} />
            Enter Lead PIN
          </div>
        </div>

        {/* Dots */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          {dots.map((filled, i) => (
            <motion.div
              key={i}
              animate={{ scale: filled ? 1.2 : 1 }}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                filled
                  ? 'bg-indigo-400 border-indigo-400 shadow-lg shadow-indigo-500/40'
                  : 'bg-transparent border-slate-600'
              }`}
            />
          ))}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {keypad.map((k, i) => {
            if (k === '') return <div key={i} />;
            const isBack = k === '⌫';
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => isBack ? handleBackspace() : handleDigit(k)}
                className={`h-14 rounded-2xl font-bold text-xl transition-all flex items-center justify-center ${
                  isBack
                    ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                    : 'bg-white/8 text-white hover:bg-white/15 border border-white/10 shadow-sm'
                }`}
              >
                {isBack ? <span className="text-base">⌫</span> : k}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Village Card ──────────────────────────────────────────────────────
function VillageCard({
  village,
  onConnect,
  onReschedule,
  onDelete,
}: {
  village: SavedVillage;
  onConnect: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cfg = STATUS_CONFIG[village.status];
  const schedule = formatSchedule(village.scheduledDate, village.scheduledTime);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all ring-4 ${cfg.ring}`}
    >
      {/* Top color stripe based on status */}
      <div className={`h-1 w-full ${
        village.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-sky-400' :
        village.status === 'scheduled' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
        'bg-gradient-to-r from-slate-300 to-slate-200'
      }`} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 truncate mt-1">{village.villageName}</h3>
            {village.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{village.description}</p>
            )}
          </div>
          <button
            onClick={() => setConfirmDelete(!confirmDelete)}
            className="ml-3 flex-shrink-0 p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
          >
            {confirmDelete ? <Check size={14} className="text-red-400" /> : <Trash2 size={14} />}
          </button>
        </div>

        {/* Meta */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield size={11} className="text-slate-400" />
            <span className="font-medium">{village.leadName}</span>
            {village.leadEmail && <span className="text-slate-400">· {village.leadEmail}</span>}
          </div>
          {schedule ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-bold">
              <Calendar size={11} className="text-amber-500" />
              <span>{schedule}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock size={11} />
              <span>No schedule set</span>
            </div>
          )}
          {village.slotCount && village.slotCount > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Users size={11} />
              <span>{village.slotCount} candidate slot{village.slotCount !== 1 ? 's' : ''} offered</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Activity size={11} />
            <span>Created {timeAgo(village.createdAt)}</span>
          </div>
        </div>

        {/* Confirm delete */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-3">
                <p className="text-xs text-red-700 flex-1 font-medium">Remove this village from your dashboard?</p>
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false); }}
                  className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-xl hover:bg-red-600 transition-all"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-white text-slate-500 text-[10px] font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onConnect}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <ExternalLink size={13} />
            Connect
          </button>
          {village.status === 'scheduled' && (
            <button
              onClick={onReschedule}
              className="flex items-center gap-1.5 px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-all"
            >
              <RefreshCw size={13} />
              Reschedule
            </button>
          )}
          {village.status === 'completed' && (
            <button
              onClick={() => {
                // Mark as active again
              }}
              className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all"
            >
              <Zap size={13} />
              Reopen
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export function LeadDashboard() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => {
    // Persist unlock in session storage so PIN isn't needed on every page nav
    return sessionStorage.getItem('tv_lead_unlocked') === '1';
  });
  const [villages, setVillages] = useState<SavedVillage[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'active' | 'completed'>('all');

  const reload = useCallback(async () => {
    // Start with localStorage for instant render
    const local = loadVillages();
    setVillages(local);

    // Merge with server villages (server is source of truth)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';
      const res = await fetch(`${apiUrl}/api/talent-village/villages`);
      if (res.ok) {
        const data = await res.json() as { success: boolean; villages: SavedVillage[] };
        if (data.success && Array.isArray(data.villages) && data.villages.length > 0) {
          // Build a merged map: server villages win on overlap
          const merged = new Map<string, SavedVillage>();
          local.forEach(v => merged.set(v.villageId, v));
          data.villages.forEach(v => merged.set(v.villageId, v));
          const final = Array.from(merged.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          // Sync back to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
          setVillages(final);
        }
      }
    } catch {
      // Server unavailable — localStorage fallback is already set
    }
  }, []);

  useEffect(() => {
    if (unlocked) reload();
  }, [unlocked, reload]);

  const handleUnlock = () => {
    sessionStorage.setItem('tv_lead_unlocked', '1');
    setUnlocked(true);
  };

  const handleConnect = (v: SavedVillage) => {
    // Update lastAccessedAt & mark active
    const updated: SavedVillage = { ...v, status: 'active', lastAccessedAt: new Date().toISOString() };
    saveVillage(updated);
    const params = new URLSearchParams({
      villageId: v.villageId,
      role: 'expert',
      name: v.leadName,
      isLead: 'true',
      villageName: v.villageName,
      description: v.description,
      leadEmail: v.leadEmail,
    });
    if (v.scheduledDate) params.set('scheduledDate', v.scheduledDate);
    if (v.scheduledTime) params.set('scheduledTime', v.scheduledTime);
    navigate(`/talent-village?${params.toString()}`);
  };

  const handleReschedule = (v: SavedVillage) => {
    // Navigate to setup with village pre-filled for rescheduling
    navigate(`/setup?reschedule=${v.villageId}`);
  };

  const handleDelete = (villageId: string) => {
    deleteVillage(villageId);
    reload();
  };

  const filtered = villages.filter(v => filter === 'all' || v.status === filter);

  if (!unlocked) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  const counts = {
    all: villages.length,
    active: villages.filter(v => v.status === 'active').length,
    scheduled: villages.filter(v => v.status === 'scheduled').length,
    completed: villages.filter(v => v.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 text-white px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Network size={20} />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight">
              TalentVillage<span className="text-indigo-400">.ai</span>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Shield size={10} className="text-indigo-400" />
            Lead Access
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/fatzero')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30"
          >
            <MessageSquare size={14} />
            FatZero-ai
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/setup')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30"
          >
            <Plus size={14} />
            New Village
          </motion.button>
        </div>
      </header>

      {/* Hero stat bar */}
      <div className="bg-slate-900 px-8 pb-6 pt-2 border-b border-slate-800">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          {[
            { label: 'Total Villages', value: counts.all, icon: Network, color: 'text-slate-300' },
            { label: 'Active Now', value: counts.active, icon: Activity, color: 'text-emerald-400' },
            { label: 'Scheduled', value: counts.scheduled, icon: Calendar, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3">
              <stat.icon size={18} className={stat.color} />
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl gap-1 shadow-sm">
            {(['all', 'active', 'scheduled', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f} {counts[f] > 0 && <span className={`ml-1 ${filter === f ? 'opacity-70' : 'opacity-50'}`}>({counts[f]})</span>}
              </button>
            ))}
          </div>
          <button
            onClick={reload}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Village grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
                <Network size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-2">
                {filter === 'all' ? 'No Villages Yet' : `No ${filter} villages`}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
                {filter === 'all'
                  ? "Create your first Talent Village to start running live assessments with your expert team."
                  : `You don't have any ${filter} villages right now.`}
              </p>
              {filter === 'all' && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/setup')}
                  className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                >
                  <Plus size={16} />
                  Create Your First Village
                  <ChevronRight size={16} className="opacity-60" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filtered.map(v => (
                <VillageCard
                  key={v.villageId}
                  village={v}
                  onConnect={() => handleConnect(v)}
                  onReschedule={() => handleReschedule(v)}
                  onDelete={() => handleDelete(v.villageId)}
                />
              ))}
              {/* Create new tile */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/setup')}
                className="border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-3 py-12 text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all group min-h-[220px]"
              >
                <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center transition-all">
                  <Plus size={24} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black">New Village</p>
                  <p className="text-[10px] opacity-60 mt-0.5">Set up & schedule</p>
                </div>
                <ArrowRight size={16} className="opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="text-center py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">
        TalentVillage.ai · Lead Command Center · PIN Protected
      </footer>
    </div>
  );
}
