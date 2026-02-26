import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Shield, Users, Network,
  Calendar, Clock, Mail, Copy, Check, ExternalLink, ChevronLeft
} from 'lucide-react';
import { saveVillage } from './LeadDashboard';

// All possible time slots a lead can offer
const ALL_TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM',
];

function generateAvailableDates(): { label: string; shortLabel: string; value: string }[] {
  const dates: { label: string; shortLabel: string; value: string }[] = [];
  const now = new Date();
  let count = 0;
  let offset = 1;
  while (count < 7) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    offset++;
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // skip weekends
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const value = d.toISOString().split('T')[0];
    dates.push({ label, shortLabel, value });
    count++;
  }
  return dates;
}

export function TalentVillageSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [villageName, setVillageName] = useState('');
  const [villageDescription, setVillageDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 — availability picker (multi-select)
  const availableDates = useMemo(() => generateAvailableDates(), []);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());

  const [villageId] = useState(() => crypto.randomUUID());
  const [schedLinkCopied, setSchedLinkCopied] = useState(false);

  // Toggle a date on/off
  const toggleDate = (v: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  // Toggle a time on/off
  const toggleTime = (t: string) => {
    setSelectedTimes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  // Build slots = every selected date × every selected time, in chronological order
  const selectedSlots = useMemo(() => {
    const orderedDates = availableDates.filter(d => selectedDates.has(d.value));
    return orderedDates.flatMap(d =>
      ALL_TIME_SLOTS.filter(t => selectedTimes.has(t)).map(t => `${d.value}T${t}`)
    );
  }, [selectedDates, selectedTimes, availableDates]);

  const hasSlots = selectedSlots.length > 0;

  // The candidate scheduling link (only show when at least one slot chosen)
  const candidateScheduleLink = useMemo(() => {
    if (!villageName.trim() || !hasSlots) return '';
    const params = new URLSearchParams({
      villageId,
      villageName: villageName.trim(),
      description: villageDescription.trim(),
      leadName: leadName.trim(),
      leadEmail: leadEmail.trim(),
    });
    params.set('slots', selectedSlots.join(','));
    return `${window.location.origin}/schedule?${params.toString()}`;
  }, [villageId, villageName, villageDescription, leadName, leadEmail, selectedSlots, hasSlots]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim() || !villageDescription.trim() || !leadName.trim() || !leadEmail.trim()) return;
    setStep(2);
  };

  const handleDeployVillage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const record = {
      villageId,
      villageName: villageName.trim(),
      description: villageDescription.trim(),
      leadName: leadName.trim(),
      leadEmail: leadEmail.trim(),
      slots: selectedSlots,
      slotCount: selectedSlots.length,
      status: (selectedSlots.length > 0 ? 'scheduled' : 'active') as 'scheduled' | 'active',
      createdAt: now,
    };

    // Persist to localStorage (dashboard cache)
    saveVillage({ ...record, updatedAt: now } as any);

    // Persist to server as agentx.md (fire-and-forget)
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';
    fetch(`${apiUrl}/api/talent-village/villages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(err => console.warn('Village server save failed (non-blocking):', err));

    const params = new URLSearchParams({
      villageId,
      role: 'expert',
      name: leadName.trim(),
      isLead: 'true',
      villageName: villageName.trim(),
      description: villageDescription.trim(),
      leadEmail: leadEmail.trim(),
    });
    setTimeout(() => {
      navigate(`/talent-village?${params.toString()}`);
    }, 600);
  };


  const copySchedLink = () => {
    navigator.clipboard.writeText(candidateScheduleLink);
    setSchedLinkCopied(true);
    setTimeout(() => setSchedLinkCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">
              TalentVillage<span className="text-indigo-600">.ai</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Village Setup</span>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
            step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-emerald-500 text-white'
          }`}>1</div>
          <div className="w-8 h-px bg-slate-200" />
          <div className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
            step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'
          }`}>2</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Village Info ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white/50 p-10 md:p-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

                <div className="text-center space-y-4 mb-10">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center text-indigo-600 shadow-inner mb-6"
                  >
                    <Network size={40} className="text-indigo-600" />
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Start a New Village</h1>
                  <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                    Create an isolated, real-time environment to assess candidates alongside your expert team.
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-6 max-w-md mx-auto">
                  {/* Village Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Village Name</label>
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Users size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text" autoFocus required value={villageName}
                        onChange={(e) => setVillageName(e.target.value)}
                        placeholder="e.g., Senior Full Stack Engineering"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Village Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Village Description</label>
                    <textarea
                      required value={villageDescription}
                      onChange={(e) => setVillageDescription(e.target.value)}
                      placeholder="Describe the purpose of this village..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none h-24"
                    />
                  </div>

                  {/* Lead Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Your Name (Lead Expert)</label>
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text" required value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="e.g., Sarah Chen"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 ml-2 font-medium">As the creator, you will automatically be assigned the Lead Expert role.</p>
                  </div>

                  {/* Lead Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Your Email (Lead)</label>
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="email" required value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 ml-2 font-medium">Scheduled session confirmations will be sent here.</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!villageName.trim() || !villageDescription.trim() || !leadName.trim() || !leadEmail.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Calendar size={20} className="text-indigo-200" />
                    <span className="text-lg">Next: Set Your Availability</span>
                    <ArrowRight size={20} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Availability Picker ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white/50 p-10 md:p-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />

                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider mb-8 transition-colors"
                >
                  <ChevronLeft size={15} /> Back
                </button>

                <div className="text-center space-y-3 mb-10">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl mx-auto flex items-center justify-center shadow-inner mb-4">
                    <Calendar size={40} className="text-emerald-600" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Set Your Availability</h2>
                  <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                    Choose which dates <strong>and</strong> times you're available. The candidate will only see the slots you select.
                  </p>
                </div>

                <form onSubmit={handleDeployVillage} className="space-y-8 max-w-md mx-auto">

                  {/* ── Date Multi-Select ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={11} /> Available Dates
                      </label>
                      {selectedDates.size > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {selectedDates.size} selected
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDates.map(d => {
                        const isOn = selectedDates.has(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDate(d.value)}
                            className={`relative py-3 px-4 rounded-2xl text-left transition-all border ${
                              isOn
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            {isOn && (
                              <span className="absolute top-2 right-2">
                                <Check size={11} className="text-indigo-200" />
                              </span>
                            )}
                            <p className="text-[11px] font-black uppercase tracking-tight">{d.shortLabel.split(',')[0]}</p>
                            <p className={`text-[10px] ${isOn ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {d.shortLabel.split(',').slice(1).join(',').trim()}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Time Multi-Select (shown once at least one date is chosen) ── */}
                  <AnimatePresence>
                    {selectedDates.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={11} /> Available Times
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTimes(new Set(ALL_TIME_SLOTS))}
                              className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                            >
                              All
                            </button>
                            <span className="text-slate-300 text-[9px]">|</span>
                            <button
                              type="button"
                              onClick={() => setSelectedTimes(new Set())}
                              className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                              Clear
                            </button>
                            {selectedTimes.size > 0 && (
                              <>
                                <span className="text-slate-300 text-[9px]">|</span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded-full">
                                  {selectedTimes.size} selected
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {ALL_TIME_SLOTS.map(t => {
                            const isOn = selectedTimes.has(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => toggleTime(t)}
                                className={`relative py-3 rounded-2xl text-[11px] font-bold transition-all border ${
                                  isOn
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                                }`}
                              >
                                {isOn && (
                                  <span className="absolute top-1.5 right-1.5">
                                    <Check size={9} className="text-indigo-200" />
                                  </span>
                                )}
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Slot Summary ── */}
                  <AnimatePresence>
                    {hasSlots && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Check size={14} className="text-emerald-600 flex-shrink-0" />
                          <p className="text-xs font-bold text-emerald-800">
                            {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} available for the candidate
                          </p>
                        </div>
                        <p className="text-[10px] text-emerald-600 ml-5">
                          {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} · {selectedTimes.size} time{selectedTimes.size !== 1 ? 's' : ''} each
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Candidate Scheduling Link ── */}
                  <AnimatePresence>
                    {hasSlots && candidateScheduleLink && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-sky-50/60 rounded-3xl border border-sky-100 space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow">
                            <ExternalLink size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-sky-900">Candidate Scheduling Link</p>
                            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Share with your candidate</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Your candidate will see only the {selectedSlots.length} slots you've selected, pick one, and receive their personalized village link.
                        </p>

                        <div className="flex items-center gap-2 p-3 bg-white border border-sky-200 rounded-2xl">
                          <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">
                            {candidateScheduleLink}
                          </span>
                          <button
                            type="button"
                            onClick={copySchedLink}
                            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                              schedLinkCopied ? 'bg-emerald-500 text-white' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                            }`}
                          >
                            {schedLinkCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                          </button>
                        </div>
                        <a
                          href={candidateScheduleLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-sky-200 text-sky-600 font-bold text-xs rounded-2xl hover:bg-sky-50 transition-all"
                        >
                          <ExternalLink size={13} /> Preview Scheduling Page
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Initializing Village...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} className="text-indigo-200" />
                        <span className="text-lg">Deploy Village{hasSlots ? ` — ${selectedSlots.length} Slots` : ''}</span>
                        <ArrowRight size={20} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                  {!hasSlots && (
                    <p className="text-center text-[11px] text-slate-400">
                      No slots selected — deploy and share the scheduling link once you set your availability, or run the village on demand.
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
