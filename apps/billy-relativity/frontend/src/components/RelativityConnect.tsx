/**
 * RelativityConnect — Authenticate via OAuth2 Client Credentials
 * Mock mode: returns an instant fake token (no network call).
 * Live mode:  direct browser → Relativity Identity SSL (no Fly proxy involved).
 */

import React, { useState } from 'react';
import { Lock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight, Eye, EyeOff, Plug, Copy, Check, ListTree, Server, FlaskConical, Wifi } from 'lucide-react';
import { useAppMode, isLocalhost } from '../context/AppModeContext';

/** A realistic-looking but completely fake JWT for Mock mode */
const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJtb2NrLXVzZXItMTIzNDUiLCJpc3MiOiJodHRwczovL21vY2sucmVsYXRpdml0eS5vbmUvUmVsYXRpdml0eS9JZGVudGl0eSIsImF1ZCI6InJlbGF0aXZpdHktYXBpIiwiZXhwIjoxODAwMDAwMDAwLCJpYXQiOjE3MDAwMDAwMDAsInNjb3BlIjoiU3lzdGVtVXNlckluZm8iLCJjbGllbnRfaWQiOiJtb2NrLWNsaWVudC1pZCIsInJlbGF0aXZpdHkvdXNlcmlkIjo5OTk5LCJyZWxhdGl2aXR5L3VzZXJ0eXBlIjoiU3lzdGVtIiwibmFtZSI6Ik1vY2sgVXNlciIsImVtYWlsIjoibW9ja0BleGFtcGxlLmNvbSIsInByZWZlcnJlZF91c2VybmFtZSI6Im1vY2sudXNlciIsImp0aSI6Im1vY2stanRpLXRlc3QifQ' +
  '.MOCK_SIGNATURE_NOT_VALID';

interface AuthResult {
  success: boolean;
  message: string;
  tokenType?: string;
  expiresIn?: number;
  accessToken?: string;
  error?: string;
  errorDescription?: string;
}

/** Decode a JWT payload without any library — pure base64url → JSON. */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    // base64url → base64
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - part.length % 4) % 4);
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

/** Friendly label overrides for common Relativity / OIDC claims */
const CLAIM_LABELS: Record<string, string> = {
  sub:                   'Subject (sub)',
  iss:                   'Issuer (iss)',
  aud:                   'Audience (aud)',
  exp:                   'Expires (exp)',
  iat:                   'Issued At (iat)',
  nbf:                   'Not Before (nbf)',
  jti:                   'JWT ID (jti)',
  azp:                   'Authorized Party (azp)',
  scope:                 'Scopes',
  client_id:             'Client ID',
  name:                  'Full Name',
  email:                 'Email',
  given_name:            'First Name',
  family_name:           'Last Name',
  preferred_username:    'Username',
  'relativity/userid':   'Relativity User ID',
  'relativity/usertype': 'User Type',
};

function formatClaimValue(key: string, val: any): string {
  if ((key === 'exp' || key === 'iat' || key === 'nbf') && typeof val === 'number') {
    return `${new Date(val * 1000).toLocaleString()} (${val})`;
  }
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

/** True when running via local Docker / dev server — Live auth only works here */
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '0.0.0.0');

export function RelativityConnect() {
  const { isLive, setAuth } = useAppMode();
  const [open, setOpen] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState(import.meta.env.VITE_REL_INSTANCE_URL || 'https://ey-us.relativity.one');
  const [clientId, setClientId] = useState(import.meta.env.VITE_REL_CLIENT_ID || 'd7d0c577328f41fe878de7aa4cfbf807');
  const [clientSecret, setClientSecret] = useState(import.meta.env.VITE_REL_CLIENT_SECRET || 'b0d3afc024ce3d81f4c18adade9303c72e');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [requestUrl, setRequestUrl] = useState('');
  const [claims, setClaims] = useState<Record<string, any> | null>(null);

  const authenticate = async () => {
    if (!instanceUrl.trim() || !clientId.trim() || !clientSecret.trim()) return;
    setLoading(true);
    setResult(null);
    setClaims(null);

    const base = instanceUrl.trim().replace(/\/$/, '');
    const tokenEndpoint = `${base}/Relativity/Identity/connect/token`;
    setRequestUrl(tokenEndpoint);

    // ── MOCK MODE ──────────────────────────────────────────────────────
    if (!isLive) {
      await new Promise(r => setTimeout(r, 600)); // simulate latency
      const mockClaims = decodeJwtPayload(MOCK_ACCESS_TOKEN);
      setResult({
        success:     true,
        message:     'Mock authentication successful',
        tokenType:   'Bearer',
        expiresIn:   3600,
        accessToken: MOCK_ACCESS_TOKEN,
      });
      setClaims(mockClaims);
      setLoading(false);
      return;
    }

    // ── LIVE MODE — Proxy to Backend to bypass CORS ──
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const proxyEndpoint = `${apiBase}/api/auth/token`;
      
      const res = await fetch(proxyEndpoint, {
        method:   'POST',
        headers:  { 'Content-Type': 'application/json' },
        body:     JSON.stringify({ 
          instanceUrl: base, 
          clientId: clientId.trim(), 
          clientSecret: clientSecret.trim() 
        }),
      });

      // A redirect means the endpoint sent us to a login page instead of a token
      if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
        setResult({
          success:          false,
          message:          'Redirected to SSO login — this OAuth2 client does not support Client Credentials',
          error:            'REDIRECT_TO_SSO',
          errorDescription: 'The client ID provided is an SSO/browser-login client (Authorization Code flow). You need a separate OAuth2 client with "Client Credentials" grant type enabled. Ask your Relativity admin to create one under Home -> OAuth2 Clients.',
        });
        return;
      }

      if (res.ok) {
        const data = await res.json() as any;
        setResult({
          success:     true,
          message:     'Authentication successful',
          tokenType:   data.token_type,
          expiresIn:   data.expires_in,
          accessToken: data.access_token,
        });
        setClaims(decodeJwtPayload(data.access_token ?? ''));
        setAuth({ accessToken: data.access_token, instanceUrl: base });
      } else {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { /* plain text */ }
        setResult({
          success:          false,
          message:          `Auth failed — HTTP ${res.status}`,
          error:            errBody.error            ?? String(res.status),
          errorDescription: errBody.error_description ?? res.statusText,
        });
      }
    } catch (err: any) {
      const isCors = err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch');
      setResult({
        success:          false,
        message:          isCors
          ? 'Network blocked — ensure you are on the VPN/network that can reach this Relativity instance.'
          : 'Network error — could not reach the Relativity Identity endpoint.',
        error:            isCors ? 'NETWORK_BLOCKED' : 'NETWORK_ERROR',
        errorDescription: err?.message,
      });
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
              {isLive
                ? <Wifi className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                : <FlaskConical className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
              }
              <span>
                {isLive ? (
                  <>
                    <strong className="text-amber-300">LIVE — Server Proxy to Relativity SSL.</strong>{' '}
                    Authentication is proxied through the local backend to bypass CORS.{' '}
                    Credentials: <strong className="text-gray-200">Relativity → Home → OAuth2 Clients</strong>.
                  </>
                ) : (
                  <>
                    <strong className="text-indigo-300">MOCK — No network call.</strong>{' '}
                    Returns a fake token instantly so you can explore the UI. Switch to{' '}
                    <strong className="text-gray-200">Live Mode</strong> to authenticate against a real Relativity instance.
                  </>
                )}
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
                  placeholder="https://ey-us.relativity.one"
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

              {/* Endpoint badge while loading or after attempt */}
              {requestUrl && (
                <span className="text-[10px] text-gray-600 font-mono truncate max-w-xs" title={requestUrl}>
                  → {requestUrl}
                </span>
              )}

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

            {/* ── JWT Claims panel ─────────────────────────────── */}
            {claims && (
              <div className="mt-3 rounded-lg border border-indigo-900/60 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-950/70 border-b border-indigo-900/60">
                  <ListTree className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-300">JWT Claims</span>
                  <span className="text-xs text-indigo-600 ml-auto">{Object.keys(claims).length} claims</span>
                </div>
                <div className="divide-y divide-gray-800/60">
                  {Object.entries(claims).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-3 px-3 py-1.5 hover:bg-indigo-950/30 transition-colors">
                      <span className="text-[11px] font-mono text-indigo-400 shrink-0 w-44 pt-0.5 truncate" title={key}>
                        {CLAIM_LABELS[key] ?? key}
                      </span>
                      <span className="text-[11px] text-gray-300 break-all font-mono">
                        {formatClaimValue(key, val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

