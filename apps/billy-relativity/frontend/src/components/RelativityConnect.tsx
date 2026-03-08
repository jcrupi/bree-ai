/**
 * RelativityConnect — Authenticate via OAuth2 Client Credentials
 * POST {instanceUrl}/Relativity/Identity/connect/token
 * Proxied through the Elysia backend to avoid CORS.
 */

import React, { useState } from 'react';
import { Lock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight, Eye, EyeOff, Plug, Key, Copy, Check } from 'lucide-react';

interface AuthResult {
  success: boolean;
  message: string;
  tokenType?: string;
  expiresIn?: number;
  accessToken?: string;
  error?: string;
  errorDescription?: string;
}

export function RelativityConnect() {
  const [open, setOpen] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  const [copied, setCopied] = useState(false);

  const authenticate = async () => {
    if (!instanceUrl.trim() || !clientId.trim() || !clientSecret.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/relativity/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: instanceUrl.trim().replace(/\/$/, ''),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });
      const data = await res.json() as AuthResult;
      setResult(data);
    } catch {
      setResult({ success: false, message: 'Network error — could not reach backend proxy.', error: 'NETWORK_ERROR' });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (result?.accessToken) {
      navigator.clipboard.writeText(result.accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`border-b transition-colors duration-300 ${result?.success ? 'bg-emerald-950 border-emerald-900' : 'bg-gray-950 border-gray-800'}`}>
      {/* ── Collapsed bar ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3 text-left group"
      >
        <div className="flex items-center gap-3">
          <Plug className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-white">Relativity Connection</span>
          {result?.success && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
              <CheckCircle className="w-3 h-3" /> Authenticated
            </span>
          )}
          {result && !result.success && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-900 text-red-300 border border-red-700">
              <XCircle className="w-3 h-3" /> Auth Failed
            </span>
          )}
          {!result && (
            <span className="text-xs text-gray-600">OAuth2 Client Credentials — enter Client ID &amp; Secret</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-300 transition-colors">
          <span className="text-xs">{open ? 'Collapse' : 'Configure'}</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Expanded form ──────────────────────────────────────────── */}
      {open && (
        <div className="px-6 pb-5 bg-gray-900/80">
          <div className="max-w-4xl">

            {/* Explain the flow */}
            <div className="flex items-start gap-2 mb-4 text-xs text-gray-400 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5">
              <Key className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
              <span>
                Uses Relativity <strong className="text-gray-200">OAuth2 Client Credentials</strong> flow. Creates a POST to{' '}
                <code className="text-indigo-300 font-mono">{instanceUrl || 'https://your-instance.relativity.one'}/Relativity/Identity/connect/token</code>{' '}
                with <code className="text-indigo-300 font-mono">grant_type=client_credentials</code>. Get your Client ID &amp; Secret from <strong className="text-gray-200">Relativity → Home → OAuth2 Clients</strong>.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Instance URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Instance URL</label>
                <input
                  id="rel-instance-url"
                  type="url"
                  value={instanceUrl}
                  onChange={e => setInstanceUrl(e.target.value)}
                  placeholder="https://yourco.relativity.one"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Client ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Client ID</label>
                <input
                  id="rel-client-id"
                  type="text"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="t348bff173b12ok36d6d5ab80id"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                />
              </div>

              {/* Client Secret */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Client Secret</label>
                <div className="relative">
                  <input
                    id="rel-client-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && authenticate()}
                    placeholder="69f2c71d25e464fb…"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 pr-9 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                    title={showSecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="rel-authenticate-btn"
                onClick={authenticate}
                disabled={loading || !instanceUrl.trim() || !clientId.trim() || !clientSecret.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? 'Authenticating…' : 'Authenticate'}
              </button>

              {/* Result inline */}
              {result && !loading && (
                <div className={`flex items-start gap-2.5 text-sm rounded-lg px-4 py-2 ${result.success ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-200' : 'bg-red-900/60 border border-red-700 text-red-300'}`}>
                  {result.success
                    ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                    : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />}
                  <div>
                    <div className="font-semibold">{result.message}</div>
                    {result.success && result.expiresIn && (
                      <div className="text-xs mt-0.5 opacity-70">Token expires in {result.expiresIn}s · Type: {result.tokenType}</div>
                    )}
                    {!result.success && result.errorDescription && (
                      <div className="text-xs mt-0.5 opacity-70 italic">{result.errorDescription}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Token reveal (only on success) */}
            {result?.success && result.accessToken && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-emerald-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-400">Bearer Token</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowToken(v => !v)}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showToken ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      onClick={copyToken}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="font-mono text-xs text-emerald-300 break-all">
                  {showToken ? result.accessToken : '•'.repeat(40) + ' (click Reveal)'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
