import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface SecurityGateProps {
  correctCode: string;
  onUnlock: () => void;
}

export function SecurityGate({ correctCode, onUnlock }: SecurityGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctCode) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fdfcff] flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 -z-10 blur-xl"></div>
      
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner shadow-indigo-100/50">
          <ShieldCheck size={32} strokeWidth={2} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center mb-2">Access Required</h2>
        <p className="text-slate-500 text-center text-sm mb-8">Please enter the security PIN to access the application.</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono text-slate-800 transition-colors focus:outline-none focus:bg-white ${
                error 
                  ? 'border-rose-300 focus:border-rose-500 text-rose-600 bg-rose-50' 
                  : 'border-slate-200 focus:border-indigo-500'
              }`}
            />
            {error && <p className="text-rose-500 text-xs text-center mt-2 font-medium">Incorrect PIN, please try again.</p>}
          </div>

          <button 
            type="submit"
            disabled={pin.length < 1}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            Unlock <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
