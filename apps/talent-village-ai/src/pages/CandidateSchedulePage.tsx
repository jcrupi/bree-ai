import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Check, Copy, ExternalLink, Network, Mail,
  Sparkles, ArrowRight, User, Download
} from 'lucide-react';

// ── iCal generator ──────────────────────────────────────────────────
// Parses a date like "2026-02-26" and time like "9:00 AM" into a UTC
// iCal datetime string (DTSTART / DTEND). Duration defaults to 1 hour.
function padTwo(n: number) { return String(n).padStart(2, '0'); }

function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  // e.g. "9:00 AM" or "1:00 PM"
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

function toICalDate(dateValue: string, timeStr: string, offsetMinutes = 0): string {
  const { hours, minutes } = parseTimeString(timeStr);
  // Build a local date object then convert to UTC iCal format
  const [year, month, day] = dateValue.split('-').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes + offsetMinutes, 0);
  return [
    d.getUTCFullYear(),
    padTwo(d.getUTCMonth() + 1),
    padTwo(d.getUTCDate()),
    'T',
    padTwo(d.getUTCHours()),
    padTwo(d.getUTCMinutes()),
    '00Z'
  ].join('');
}

function generateICalString({
  title, dateValue, timeStr, description, location, organizer, candidateName
}: {
  title: string;
  dateValue: string;
  timeStr: string;
  description: string;
  location: string;
  organizer: string;
  candidateName: string;
}): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@talentvillage.ai`;
  const dtStart = toICalDate(dateValue, timeStr);
  const dtEnd = toICalDate(dateValue, timeStr, 60); // 1-hour default
  const now = new Date();
  const dtstamp = [
    now.getUTCFullYear(),
    padTwo(now.getUTCMonth() + 1),
    padTwo(now.getUTCDate()),
    'T',
    padTwo(now.getUTCHours()),
    padTwo(now.getUTCMinutes()),
    padTwo(now.getUTCSeconds()),
    'Z'
  ].join('');
  const safeDesc = description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const safeTitle = title.replace(/,/g, '\\,');
  const safeLocation = location.replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TalentVillage.ai//Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeDesc}Join the session: ${location.replace(/,/g, '\\,')}`,
    `LOCATION:${safeLocation}`,
    organizer ? `ORGANIZER;CN=${organizer}:MAILTO:noreply@talentvillage.ai` : '',
    candidateName ? `ATTENDEE;CN=${candidateName};RSVP=TRUE:MAILTO:noreply@talentvillage.ai` : '',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

function downloadIcal(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse slots from query string, group by date
interface SlotGroup {
  dateValue: string;
  dateLabel: string;
  times: string[];
}

function groupSlots(slotsRaw: string): SlotGroup[] {
  if (!slotsRaw) return [];
  const allSlots = slotsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const map = new Map<string, string[]>();
  allSlots.forEach(slot => {
    const [dateValue, ...rest] = slot.split('T');
    const time = rest.join('T');
    if (!map.has(dateValue)) map.set(dateValue, []);
    map.get(dateValue)!.push(time);
  });
  return Array.from(map.entries()).map(([dateValue, times]) => {
    const d = new Date(dateValue + 'T12:00:00'); // noon to avoid TZ issues
    const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return { dateValue, dateLabel, times };
  });
}

export function CandidateSchedulePage() {
  const [searchParams] = useSearchParams();

  const villageId = searchParams.get('villageId') || '';
  const villageName = searchParams.get('villageName') || 'Talent Village';
  const description = searchParams.get('description') || '';
  const leadName = searchParams.get('leadName') || 'the Lead';
  const leadEmail = searchParams.get('leadEmail') || '';
  const slotsRaw = searchParams.get('slots') || '';

  const slotGroups = useMemo(() => groupSlots(slotsRaw), [slotsRaw]);

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm' | 'done'>('pick');
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const selectedGroup = slotGroups.find(g => g.dateValue === selectedDate);

  // The final village link for the candidate
  const villageLink = useMemo(() => {
    if (!selectedDate || !selectedTime || !candidateName.trim()) return '';
    const params = new URLSearchParams({
      villageId,
      role: 'candidate',
      villageName,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      name: candidateName.trim(),
    });
    return `${window.location.origin}/talent-village?${params.toString()}`;
  }, [selectedDate, selectedTime, candidateName, villageId, villageName]);

  const handlePick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !candidateName.trim()) return;
    setStep('confirm');
  };

  // Email the lead via mailto with the scheduling info
  const emailLead = () => {
    if (!leadEmail) return;
    const subject = encodeURIComponent(`[TalentVillage] ${candidateName} scheduled: ${villageName}`);
    const dateLabel = selectedGroup?.dateLabel || selectedDate;
    const body = encodeURIComponent(
      `Hi ${leadName},\n\n` +
      `${candidateName} has selected a time for the Talent Village session.\n\n` +
      `📅 Village: ${villageName}\n` +
      (description ? `📝 Description: ${description}\n` : '') +
      `\n🗓  Date: ${dateLabel}\n` +
      `⏰  Time: ${selectedTime}\n` +
      (candidateEmail ? `📧  Candidate Email: ${candidateEmail}\n` : '') +
      `\n🔗 Candidate Village Link:\n${villageLink}\n\n` +
      `They will use the link above to join the session at the scheduled time.\n\n` +
      `— TalentVillage.ai`
    );
    window.location.href = `mailto:${leadEmail}?subject=${subject}&body=${body}`;
    setEmailSent(true);
  };

  const copyLink = () => {
    if (!villageLink) return;
    navigator.clipboard.writeText(villageLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Download iCal invite
  const handleDownloadIcal = () => {
    if (!selectedDate || !selectedTime) return;
    const icsContent = generateICalString({
      title: `TalentVillage: ${villageName}`,
      dateValue: selectedDate,
      timeStr: selectedTime,
      description: description ? `${description}\n\n` : '',
      location: villageLink,
      organizer: leadName,
      candidateName: candidateName.trim(),
    });
    const safeVillageName = villageName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    downloadIcal(icsContent, `talentvillage-${safeVillageName}.ics`);
  };

  const confirm = () => {
    setStep('done');
    // Auto-trigger email to lead
    emailLead();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-sky-50/30 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Network size={20} />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900">
            TalentVillage<span className="text-indigo-600">.ai</span>
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Scheduling</p>
        </div>
        <div className="ml-auto px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
          {villageName}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Abstract blobs */}
          <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-400/8 rounded-full blur-[150px] pointer-events-none" />
          <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-400/8 rounded-full blur-[120px] pointer-events-none" />

          <AnimatePresence mode="wait">

            {/* ── STEP: Pick ── */}
            {step === 'pick' && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white p-10 relative overflow-hidden"
              >
                {/* Gradient top bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-inner">
                    <Calendar size={32} className="text-indigo-600" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pick Your Time</h1>
                  <p className="text-slate-500 mt-2 leading-relaxed text-sm max-w-sm mx-auto">
                    Select a date and time that works for you to join the <strong>{villageName}</strong> assessment with {leadName}.
                  </p>
                  {description && (
                    <p className="mt-3 text-[11px] text-slate-400 italic">{description}</p>
                  )}
                </div>

                <form onSubmit={handlePick} className="space-y-6">
                  {/* Candidate name + email */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Your Info</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="text" required
                        value={candidateName}
                        onChange={e => setCandidateName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-3.5 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all outline-none"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={e => setCandidateEmail(e.target.value)}
                        placeholder="Your email (optional)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-3.5 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Available Dates</label>
                    {slotGroups.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No available dates were found. Please contact the lead directly.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {slotGroups.map(group => (
                          <button
                            key={group.dateValue}
                            type="button"
                            onClick={() => { setSelectedDate(group.dateValue); setSelectedTime(''); }}
                            className={`py-3 px-4 rounded-2xl text-left transition-all border ${ 
                              selectedDate === group.dateValue
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-tighter">{group.dateLabel.split(',')[0]}</p>
                            <p className={`text-[10px] ${selectedDate === group.dateValue ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {group.dateLabel.split(',').slice(1).join(',').trim()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time picker */}
                  <AnimatePresence>
                    {selectedDate && selectedGroup && (
                      <motion.div
                        key="times"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={11} /> Available Times
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedGroup.times.map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTime(t)}
                              className={`py-3 rounded-2xl text-[11px] font-bold transition-all border ${
                                selectedTime === t
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selection summary */}
                  <AnimatePresence>
                    {selectedDate && selectedTime && candidateName.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200"
                      >
                        <Check size={16} className="text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">
                            {selectedGroup?.dateLabel} at {selectedTime}
                          </p>
                          <p className="text-[10px] text-emerald-600">Ready to confirm your slot</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!selectedDate || !selectedTime || !candidateName.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={18} className="text-indigo-200" />
                    <span>Get My Village Link</span>
                    <ArrowRight size={18} className="text-indigo-200" />
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: Confirm ── */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white p-10 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-inner">
                    <Check size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Confirm Your Slot</h2>
                  <p className="text-slate-500 mt-2 text-sm">Review the details below before confirming.</p>
                </div>

                <div className="space-y-4 mb-8">
                  {/* Summary card */}
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <Network size={16} className="text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Village</p>
                        <p className="text-sm font-bold text-slate-800">{villageName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</p>
                        <p className="text-sm font-bold text-slate-800">{candidateName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
                        <p className="text-sm font-bold text-slate-800">{selectedGroup?.dateLabel} at {selectedTime}</p>
                      </div>
                    </div>
                    {leadEmail && (
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-indigo-500 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Notification</p>
                          <p className="text-sm font-bold text-slate-800">{leadEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Village link preview */}
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Your Village Link</p>
                    <div className="flex items-center gap-2 bg-white border border-indigo-100 rounded-xl p-2">
                      <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">{villageLink}</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 mt-2">
                      📧 This link will be emailed to {leadEmail} automatically.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={confirm}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-all"
                  >
                    <Check size={18} className="text-emerald-200" />
                    <span>Confirm & Notify Lead</span>
                  </motion.button>
                  <button
                    onClick={() => setStep('pick')}
                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-all"
                  >
                    ← Change Selection
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: Done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-indigo-900/5 border border-white p-10 relative overflow-hidden text-center"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />

                {/* Celebration icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner"
                >
                  <Check size={40} className="text-emerald-600" />
                </motion.div>

                <h2 className="text-3xl font-black text-slate-900 mb-2">You're Booked!</h2>
                <p className="text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
                  Your session with <strong>{leadName}</strong> is scheduled. Save your village link to join at the right time.
                </p>

                {/* Scheduled details */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{selectedGroup?.dateLabel} at {selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Network size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{villageName}</span>
                  </div>
                </div>

                {/* Village link */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Village Link</p>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
                    <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">{villageLink}</span>
                    <button
                      onClick={copyLink}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        linkCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {linkCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>

              <div className="flex flex-col gap-3">
                  <a
                    href={villageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-sm"
                  >
                    <ExternalLink size={16} /> Open Village Session
                  </a>
                  <button
                    onClick={handleDownloadIcal}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 transition-all text-sm"
                  >
                    <Download size={16} /> Add to Calendar (.ics)
                  </button>
                  {leadEmail && !emailSent && (
                    <button
                      onClick={emailLead}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all text-sm"
                    >
                      <Mail size={16} /> Re-send Email to Lead
                    </button>
                  )}
                  {emailSent && (
                    <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-[11px] font-bold">
                      <Check size={13} /> Email sent to {leadEmail}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="text-center py-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        TalentVillage.ai · Candidate Scheduling Portal
      </footer>
    </div>
  );
}
