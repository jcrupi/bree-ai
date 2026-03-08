import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { loadLeadNotes, saveLeadNotes } from '../services/leadNotes';

const PIN_CODE = '2026';
const SESSION_KEY = 'crazy_fast_unlocked';

interface LeadNotesTabProps {
  field: 'bizText' | 'marketingText' | 'salesText';
  label: string;
  placeholder: string;
  defaultText?: string;
  onContextChange?: (text: string) => void;
}

/** Simple PIN gate — unlocked state lives in sessionStorage for the session */
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className={`p-4 rounded-2xl transition-colors ${error ? 'bg-red-500/20' : 'bg-slate-800/60'} border ${error ? 'border-red-500/40' : 'border-slate-700/50'}`}>
        <Lock className={`w-8 h-8 mx-auto ${error ? 'text-red-400' : 'text-indigo-400'}`} />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-200">Access Code Required</h3>
        <p className="text-sm text-slate-500 mt-1">Enter the code to view this section.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-64">
        <div className="relative w-full">
          <input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter code…"
            autoFocus
            className={`w-full text-center text-xl tracking-[0.4em] font-mono bg-slate-900 border rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-500/60 focus:ring-red-500/30 text-red-400'
                : 'border-slate-700 focus:ring-indigo-500/40 text-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">Incorrect code — try again.</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

export function LeadNotesTab({ field, label, placeholder, defaultText = '', onContextChange }: LeadNotesTabProps) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved'>('loading');

  useEffect(() => {
    if (!unlocked) return;
    loadLeadNotes().then((data) => {
      const saved = data[field];
      const val = saved && saved.trim() ? saved : defaultText;
      setText(val);
      onContextChange?.(val);
      setStatus('idle');
    });
  }, [field, unlocked, defaultText]);

  const save = useCallback(async (value: string) => {
    setStatus('saving');
    await saveLeadNotes({ [field]: value });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  }, [field]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onContextChange?.(e.target.value);
  };
  const handleSave = () => save(text);

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">{label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Enter your {label.toLowerCase()} notes — click Save or press ⌘S.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setUnlocked(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            title="Lock section"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={status === 'saving' || status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/25 text-sm font-medium"
          >
            {status === 'saving' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : status === 'saved' ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              save(text);
            }
          }}
          placeholder={placeholder}
          rows={18}
          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-5 py-4 text-slate-200 text-sm leading-relaxed placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 resize-none backdrop-blur-md transition-all"
        />
      )}

      <p className="text-xs text-slate-600">Tip: Press ⌘S to save quickly.</p>
    </div>
  );
}
