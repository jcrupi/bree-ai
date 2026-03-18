import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { AppConfig } from '../services/config';

interface ConfiguratorTabProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => Promise<void>;
  onBack: () => void;
}

export function ConfiguratorTab({ config, onSave, onBack }: ConfiguratorTabProps) {
  const [draft, setDraft] = useState<AppConfig>(config);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [productsStr, setProductsStr] = useState(config.enabledProducts.join(', '));
  const [suggestionsStr, setSuggestionsStr] = useState((config.aiSuggestions || []).join('\n'));

  const handleSave = async () => {
    setStatus('saving');
    const finalDraft = {
      ...draft,
      enabledProducts: productsStr.split(',').map((s) => s.trim()).filter(Boolean),
      aiSuggestions: suggestionsStr.split('\n').map((s) => s.trim()).filter(Boolean)
    };
    await onSave(finalDraft);
    setDraft(finalDraft);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const toggleTab = (key: keyof AppConfig['enabledTabs']) => {
    setDraft((prev) => ({
      ...prev,
      enabledTabs: { ...prev.enabledTabs, [key]: !prev.enabledTabs[key] },
    }));
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tech
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur p-6 shadow-2xl shadow-black/20">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl shadow-lg shadow-slate-900/30">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">App Configurator</h2>
              <p className="text-sm text-slate-400 mt-0.5">Customize features, tabs, and products</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {status === 'saving' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : status === 'saved' ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Config</>
            )}
          </button>
        </div>

        <div className="space-y-8">
          {/* General Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Features</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.showSplashScreen}
                onChange={(e) => setDraft({ ...draft, showSplashScreen: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-slate-200">Show Welcome Splash Screen</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.showBubbles}
                onChange={(e) => setDraft({ ...draft, showBubbles: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-slate-200">Show Status Bubbles (Tech Tab)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.showSyncLinear}
                onChange={(e) => setDraft({ ...draft, showSyncLinear: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-slate-200">Show 'Sync Linear' Button</span>
            </label>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Security Gate */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Security</h3>
            <p className="text-xs text-slate-500 mb-2">Gate the application behind a simple 4-digit code.</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.requireSecurityCode}
                  onChange={(e) => setDraft({ ...draft, requireSecurityCode: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                />
                <span className="text-slate-200">Require Access Code</span>
              </label>

              {draft.requireSecurityCode && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Code:</span>
                  <input
                    type="text"
                    maxLength={10}
                    value={draft.securityCode}
                    onChange={(e) => setDraft({ ...draft, securityCode: e.target.value })}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-center font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Core Tabs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Enabled Tabs</h3>
            <p className="text-xs text-slate-500 mb-2">(Tech tab is always enabled)</p>
            <div className="grid grid-cols-2 gap-4">
              {['biz', 'marketing', 'sales', 'news'].map((key) => {
                const k = key as keyof AppConfig['enabledTabs'];
                return (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.enabledTabs[k]}
                      onChange={() => toggleTab(k)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <span className="text-slate-200 capitalize">{key}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Tech Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Tech Categories / Products</h3>
            <p className="text-xs text-slate-500 mb-2">Comma separated list of products to show in the Tech sub-tabs.</p>
            <input
              type="text"
              value={productsStr}
              onChange={(e) => setProductsStr(e.target.value)}
              placeholder="e.g. Wound AI, Performance AI, Extraction AI"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <div className="h-px bg-slate-800/80" />

          {/* AI Task Assistant Suggestions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Suggestions</h3>
            <p className="text-xs text-slate-500 mb-2">Each suggestion on a new line. These appear as chips when the AI chat is empty.</p>
            <textarea
              value={suggestionsStr}
              onChange={(e) => setSuggestionsStr(e.target.value)}
              placeholder="Which tasks are about wounds?\nShow me pending tasks..."
              rows={5}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
