import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle2, Loader2 } from 'lucide-react';
import { loadLeadNotes, saveLeadNotes } from '../services/leadNotes';

interface LeadNotesTabProps {
  field: 'bizText' | 'marketingText';
  label: string;
  placeholder: string;
}

export function LeadNotesTab({ field, label, placeholder }: LeadNotesTabProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved'>('loading');

  // Load on mount
  useEffect(() => {
    loadLeadNotes().then((data) => {
      setText(data[field] ?? '');
      setStatus('idle');
    });
  }, [field]);

  // Auto-save debounced
  const save = useCallback(async (value: string) => {
    setStatus('saving');
    await saveLeadNotes({ [field]: value });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  }, [field]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSave = () => save(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">{label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Enter your {label.toLowerCase()} notes — saved automatically when you click Save.
          </p>
        </div>
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

      {status === 'loading' ? (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => {
            // Cmd/Ctrl + S to save
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
