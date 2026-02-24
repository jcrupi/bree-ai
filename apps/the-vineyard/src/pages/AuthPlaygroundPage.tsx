import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Key,
  Fingerprint,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  ArrowLeft,
  Building2,
  Users,
  Plus,
  ChevronDown,
  UserPlus
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthConfig {
  provider: 'identity-zero' | 'better-auth';
  demoMode: boolean;
}

interface DecodedPayload {
  userId?: number | string;
  email?: string;
  name?: string;
  username?: string;
  client_id?: string;
  role?: string;
  roles?: Array<{ role: string; organizationSlug?: string }>;
  org_id?: string;
  org_role?: string;
  org_permissions?: string[];
  token_balance?: number;
  allowed_models?: string[];
  plan_tier?: string;
  [key: string]: unknown;
}

export function AuthPlaygroundPage() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'identity-zero' | 'bree' | 'better-auth'>('identity-zero');

  // Identity Zero
  const [izUsername, setIzUsername] = useState('admin@bree.ai');
  const [izPassword, setIzPassword] = useState('admin');
  const [izLoading, setIzLoading] = useState(false);
  const [izToken, setIzToken] = useState<string | null>(null);
  const [izError, setIzError] = useState<string | null>(null);

  // BREE Auth
  const [breeEmail, setBreeEmail] = useState('admin@bree.ai');
  const [breePassword, setBreePassword] = useState('admin123');
  const [breeLoading, setBreeLoading] = useState(false);
  const [breeToken, setBreeToken] = useState<string | null>(null);
  const [breeError, setBreeError] = useState<string | null>(null);

  // Better Auth (paste token)
  const [baToken, setBaToken] = useState('');
  const [baLoading, setBaLoading] = useState(false);
  const [baDecoded, setBaDecoded] = useState<DecodedPayload | null>(null);
  const [baError, setBaError] = useState<string | null>(null);

  // Shared decoded state for display
  const [decodedPayload, setDecodedPayload] = useState<DecodedPayload | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/config`)
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ provider: 'identity-zero', demoMode: false }));
  }, []);

  const handleIzLogin = async () => {
    setIzLoading(true);
    setIzError(null);
    setIzToken(null);
    setDecodedPayload(null);
    try {
      const res = await fetch(`${API_URL}/api/identity-zero/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: izUsername, password: izPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setIzError(data.error || 'Login failed');
        return;
      }
      setIzToken(data.token);
      setDecodedPayload({
        id: data.user?.id,
        username: data.user?.username,
        client_id: data.user?.clientId,
        role: data.user?.role
      });
    } catch (e) {
      setIzError('Network error');
    } finally {
      setIzLoading(false);
    }
  };

  const handleBreeLogin = async () => {
    setBreeLoading(true);
    setBreeError(null);
    setBreeToken(null);
    setDecodedPayload(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: breeEmail, password: breePassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setBreeError(data.error || 'Login failed');
        return;
      }
      setBreeToken(data.accessToken);
      setDecodedPayload(
        data.user
          ? {
              userId: data.user.id,
              email: data.user.email,
              name: data.user.name,
              roles: data.user.roles
            }
          : {}
      );
    } catch (e) {
      setBreeError('Network error');
    } finally {
      setBreeLoading(false);
    }
  };

  const handleBaValidate = async () => {
    if (!baToken.trim()) return;
    setBaLoading(true);
    setBaError(null);
    setBaDecoded(null);
    setDecodedPayload(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/decode-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: baToken.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setBaError(data.error || 'Invalid token');
        return;
      }
      setBaDecoded(data.decoded);
      setDecodedPayload(data.decoded);
    } catch (e) {
      setBaError('Network error');
    } finally {
      setBaLoading(false);
    }
  };

  const currentToken = izToken || breeToken || (baDecoded ? baToken : null);
  const displayPayload = decodedPayload;

  const copyToken = () => {
    if (currentToken) {
      navigator.clipboard.writeText(currentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs = [
    { id: 'identity-zero' as const, label: 'Identity Zero', icon: Fingerprint },
    { id: 'bree' as const, label: 'BREE Auth', icon: Lock },
    { id: 'better-auth' as const, label: 'Better Auth', icon: Key }
  ];

  // Setup mode: org/member management
  const [mode, setMode] = useState<'auth' | 'setup'>('auth');
  const [setupProvider, setSetupProvider] = useState<'identity-zero' | 'bree'>('bree');

  // BREE Setup
  const [breeOrgs, setBreeOrgs] = useState<Array<{ id: number; slug: string; name: string; parent_id?: number; children?: any[] }>>([]);
  const [breeUsers, setBreeUsers] = useState<any[]>([]);
  const [breeSetupLoading, setBreeSetupLoading] = useState(false);
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgParentId, setNewOrgParentId] = useState<number | ''>('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('changeMe123!');
  const [newUserOrgSlug, setNewUserOrgSlug] = useState('');
  const [newUserRole, setNewUserRole] = useState<'org' | 'admin' | 'member'>('member');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  // Identity Zero Setup
  const [izOrgs, setIzOrgs] = useState<Array<{ id: string; client_id: string; client_name: string; parent_client_id?: string; user_count?: number }>>([]);
  const [izUsers, setIzUsers] = useState<any[]>([]);
  const [izSetupLoading, setIzSetupLoading] = useState(false);
  const [izNewClientId, setIzNewClientId] = useState('');
  const [izNewClientName, setIzNewClientName] = useState('');
  const [izNewClientParent, setIzNewClientParent] = useState('');
  const [izNewMemberEmail, setIzNewMemberEmail] = useState('');
  const [izNewMemberPassword, setIzNewMemberPassword] = useState('changeMe123!');
  const [izNewMemberClientId, setIzNewMemberClientId] = useState('');
  const [izNewMemberRole, setIzNewMemberRole] = useState('org_admin');

  const fetchBreeOrgs = useCallback(() => {
    fetch(`${API_URL}/api/auth/playground/organizations`)
      .then((r) => r.json())
      .then((d) => d.success && setBreeOrgs(d.organizations || []))
      .catch(() => {});
  }, []);
  const fetchBreeUsers = useCallback(() => {
    fetch(`${API_URL}/api/auth/playground/users`)
      .then((r) => r.json())
      .then((d) => d.success && setBreeUsers(d.users || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'setup' && setupProvider === 'bree') {
      fetchBreeOrgs();
      fetchBreeUsers();
    }
  }, [mode, setupProvider, fetchBreeOrgs, fetchBreeUsers]);

  const fetchIzOrgs = useCallback(() => {
    if (!izToken) return;
    fetch(`${API_URL}/api/identity-zero/organizations`, {
      headers: { Authorization: `Bearer ${izToken}` }
    })
      .then((r) => r.json())
      .then((d) => setIzOrgs(d.organizations || []))
      .catch(() => {});
  }, [izToken]);
  const fetchIzUsers = useCallback(() => {
    if (!izToken) return;
    fetch(`${API_URL}/api/identity-zero/users`, {
      headers: { Authorization: `Bearer ${izToken}` }
    })
      .then((r) => r.json())
      .then((d) => setIzUsers(d.users || []))
      .catch(() => {});
  }, [izToken]);

  useEffect(() => {
    if (mode === 'setup' && setupProvider === 'identity-zero' && izToken) {
      fetchIzOrgs();
      fetchIzUsers();
    }
  }, [mode, setupProvider, izToken, fetchIzOrgs, fetchIzUsers]);

  const handleCreateBreeOrg = async () => {
    setSetupError(null);
    setSetupSuccess(null);
    setBreeSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/playground/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newOrgSlug.trim(),
          name: newOrgName.trim(),
          parentId: newOrgParentId === '' ? undefined : newOrgParentId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed');
        return;
      }
      setSetupSuccess(`Org "${newOrgName}" created`);
      setNewOrgSlug('');
      setNewOrgName('');
      setNewOrgParentId('');
      fetchBreeOrgs();
    } catch (e) {
      setSetupError('Network error');
    } finally {
      setBreeSetupLoading(false);
    }
  };

  const handleCreateBreeUser = async () => {
    setSetupError(null);
    setSetupSuccess(null);
    setBreeSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword,
          name: newUserName.trim(),
          role: newUserRole,
          organizationSlug: newUserOrgSlug || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed');
        return;
      }
      setSetupSuccess(`User ${newUserEmail} created`);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('changeMe123!');
      setNewUserOrgSlug('');
      fetchBreeUsers();
    } catch (e) {
      setSetupError('Network error');
    } finally {
      setBreeSetupLoading(false);
    }
  };

  const handleCreateIzOrg = async () => {
    if (!izToken) return;
    setSetupError(null);
    setSetupSuccess(null);
    setIzSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/identity-zero/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${izToken}`
        },
        body: JSON.stringify({
          client_id: izNewClientId.trim(),
          client_name: izNewClientName.trim(),
          parent_client_id: izNewClientParent || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed');
        return;
      }
      setSetupSuccess(`Org "${izNewClientName}" created`);
      setIzNewClientId('');
      setIzNewClientName('');
      setIzNewClientParent('');
      fetchIzOrgs();
    } catch (e) {
      setSetupError('Network error');
    } finally {
      setIzSetupLoading(false);
    }
  };

  const handleCreateIzMember = async () => {
    if (!izToken) return;
    setSetupError(null);
    setSetupSuccess(null);
    setIzSetupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/identity-zero/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${izToken}`
        },
        body: JSON.stringify({
          username: izNewMemberEmail.trim(),
          password: izNewMemberPassword,
          client_id: izNewMemberClientId,
          role: izNewMemberRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed');
        return;
      }
      setSetupSuccess(`Member ${izNewMemberEmail} created`);
      setIzNewMemberEmail('');
      setIzNewMemberPassword('changeMe123!');
      setIzNewMemberClientId('');
      fetchIzUsers();
    } catch (e) {
      setSetupError('Network error');
    } finally {
      setIzSetupLoading(false);
    }
  };

  const flattenOrgs = (orgs: any[], depth = 0): Array<{ org: any; depth: number }> => {
    const out: Array<{ org: any; depth: number }> = [];
    for (const o of orgs) {
      out.push({ org: o, depth });
      if (o.children?.length) {
        out.push(...flattenOrgs(o.children, depth + 1));
      }
    }
    return out;
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 font-sans overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Auth Playground
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Test Identity Zero, BREE Auth, and Better Auth
              </p>
            </div>
          </div>
          {config && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 text-sm">Active provider:</span>
              <span className="font-mono text-sm font-medium text-cyan-400">
                {config.provider}
              </span>
              {config.demoMode && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold">
                  DEMO
                </span>
              )}
            </div>
          )}
        </motion.header>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setMode('auth')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              mode === 'auth'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" />
            Auth
          </button>
          <button
            onClick={() => setMode('setup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              mode === 'setup'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Setup Orgs & Members
          </button>
        </motion.div>

        {mode === 'setup' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setSetupProvider('bree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  setupProvider === 'bree' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
                }`}
              >
                <Lock className="w-4 h-4" />
                BREE Auth
              </button>
              <button
                onClick={() => setSetupProvider('identity-zero')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  setupProvider === 'identity-zero' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
                }`}
              >
                <Fingerprint className="w-4 h-4" />
                Identity Zero
                {!izToken && (
                  <span className="text-amber-400 text-xs">(login first)</span>
                )}
              </button>
            </div>

            {setupError && (
              <div className="flex items-center gap-2 text-rose-400 text-sm px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <XCircle className="w-4 h-4 shrink-0" />
                {setupError}
              </div>
            )}
            {setupSuccess && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {setupSuccess}
              </div>
            )}

            {setupProvider === 'bree' && (
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    Organizations (Super Org: Bree AI)
                  </h3>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {flattenOrgs(breeOrgs).map(({ org, depth }) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-2 py-2 border-b border-slate-700/30 last:border-0"
                        style={{ paddingLeft: depth * 16 }}
                      >
                        {depth > 0 && <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                        <span className="font-medium text-slate-200">{org.name}</span>
                        <span className="text-slate-500 text-xs font-mono">({org.slug})</span>
                      </div>
                    ))}
                    {breeOrgs.length === 0 && (
                      <p className="text-slate-500 text-sm">No orgs yet. Create Bree AI first, then child orgs.</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      placeholder="Slug (e.g. kick-analytics)"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    />
                    <input
                      placeholder="Name (e.g. Kick Analytics)"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    />
                    <select
                      value={newOrgParentId}
                      onChange={(e) => setNewOrgParentId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    >
                      <option value="">Super Org (Bree AI) — top level</option>
                      {flattenOrgs(breeOrgs).map(({ org }) => (
                        <option key={org.id} value={org.id}>{org.name} ({org.slug})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateBreeOrg}
                      disabled={breeSetupLoading || !newOrgSlug.trim() || !newOrgName.trim()}
                      className="w-full py-2 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-medium text-sm border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {breeSetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Organization
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Members
                  </h3>
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                    {breeUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 text-sm">
                        <span className="text-slate-200">{u.email}</span>
                        <span className="text-slate-500 text-xs">
                          {u.roles?.map((r: any) => r.role).join(', ') || '—'}
                        </span>
                      </div>
                    ))}
                    {breeUsers.length === 0 && <p className="text-slate-500 text-sm">No users yet.</p>}
                  </div>
                  <div className="space-y-3">
                    <input
                      placeholder="Email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    />
                    <input
                      placeholder="Name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    />
                    <input
                      placeholder="Password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    />
                    <select
                      value={newUserOrgSlug}
                      onChange={(e) => setNewUserOrgSlug(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    >
                      <option value="">No org (super_org)</option>
                      {flattenOrgs(breeOrgs).map(({ org }) => (
                        <option key={org.id} value={org.slug}>{org.name}</option>
                      ))}
                    </select>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                    >
                      <option value="org">org</option>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                    <button
                      onClick={handleCreateBreeUser}
                      disabled={breeSetupLoading || !newUserEmail.trim() || !newUserName.trim()}
                      className="w-full py-2 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-medium text-sm border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {breeSetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Add Member
                    </button>
                  </div>
                </div>
              </div>
            )}

            {setupProvider === 'identity-zero' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {!izToken ? (
                  <div className="col-span-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
                    <p className="text-amber-300 mb-4">Sign in as Identity Zero super admin first (admin@bree.ai / admin)</p>
                    <button
                      onClick={() => setMode('auth')}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      Go to Auth
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        Organizations (Super Org: super-org)
                      </h3>
                      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                        {izOrgs.map((o) => (
                          <div key={o.client_id} className="flex items-center justify-between py-2 border-b border-slate-700/30 text-sm">
                            <span className="text-slate-200">{o.client_name}</span>
                            <span className="text-slate-500 text-xs font-mono">{o.client_id}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <input
                          placeholder="Client ID (e.g. kick-analytics)"
                          value={izNewClientId}
                          onChange={(e) => setIzNewClientId(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        />
                        <input
                          placeholder="Client Name"
                          value={izNewClientName}
                          onChange={(e) => setIzNewClientName(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        />
                        <select
                          value={izNewClientParent}
                          onChange={(e) => setIzNewClientParent(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        >
                          <option value="">Super Org (top level)</option>
                          {izOrgs.map((o) => (
                            <option key={o.client_id} value={o.client_id}>{o.client_name}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleCreateIzOrg}
                          disabled={izSetupLoading || !izNewClientId.trim() || !izNewClientName.trim()}
                          className="w-full py-2 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-medium text-sm border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {izSetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add Organization
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        Members
                      </h3>
                      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                        {izUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 text-sm">
                            <span className="text-slate-200">{u.username}</span>
                            <span className="text-slate-500 text-xs">{u.role} @ {u.client_id}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <input
                          placeholder="Email (username)"
                          type="email"
                          value={izNewMemberEmail}
                          onChange={(e) => setIzNewMemberEmail(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        />
                        <input
                          placeholder="Password"
                          type="password"
                          value={izNewMemberPassword}
                          onChange={(e) => setIzNewMemberPassword(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        />
                        <select
                          value={izNewMemberClientId}
                          onChange={(e) => setIzNewMemberClientId(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        >
                          <option value="">Select org</option>
                          {izOrgs.map((o) => (
                            <option key={o.client_id} value={o.client_id}>{o.client_name}</option>
                          ))}
                        </select>
                        <select
                          value={izNewMemberRole}
                          onChange={(e) => setIzNewMemberRole(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-sm"
                        >
                          <option value="super_admin">super_admin</option>
                          <option value="org_admin">org_admin</option>
                          <option value="provider">provider</option>
                          <option value="user">user</option>
                        </select>
                        <button
                          onClick={handleCreateIzMember}
                          disabled={izSetupLoading || !izNewMemberEmail.trim() || !izNewMemberClientId}
                          className="w-full py-2 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-medium text-sm border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {izSetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                          Add Member
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <>
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Auth forms */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-6"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'identity-zero' && (
                <motion.div
                  key="iz"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-8">
                    <Fingerprint className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">Identity Zero</h2>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">
                    Multi-tenant auth with envelope-encrypted secrets. Seed: admin@bree.ai / admin
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Username
                      </label>
                      <input
                        type="text"
                        value={izUsername}
                        onChange={(e) => setIzUsername(e.target.value)}
                        placeholder="admin@bree.ai"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Password
                      </label>
                      <input
                        type="password"
                        value={izPassword}
                        onChange={(e) => setIzPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all"
                      />
                    </div>
                    {izError && (
                      <div className="flex items-center gap-2 text-rose-400 text-sm">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {izError}
                      </div>
                    )}
                    <button
                      onClick={handleIzLogin}
                      disabled={izLoading}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {izLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          Sign In
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'bree' && (
                <motion.div
                  key="bree"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-8">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">BREE Auth</h2>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">
                    Legacy auth with SQLite. Seed: admin@bree.ai / admin123
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        type="email"
                        value={breeEmail}
                        onChange={(e) => setBreeEmail(e.target.value)}
                        placeholder="admin@bree.ai"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Password
                      </label>
                      <input
                        type="password"
                        value={breePassword}
                        onChange={(e) => setBreePassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all"
                      />
                    </div>
                    {breeError && (
                      <div className="flex items-center gap-2 text-rose-400 text-sm">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {breeError}
                      </div>
                    )}
                    <button
                      onClick={handleBreeLogin}
                      disabled={breeLoading}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {breeLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          Sign In
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'better-auth' && (
                <motion.div
                  key="ba"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-8">
                    <Key className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">Better Auth</h2>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">
                    Paste a JWT from your Better Auth instance. Validates via JWKS when AUTH_PROVIDER=better-auth.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        JWT Token
                      </label>
                      <textarea
                        value={baToken}
                        onChange={(e) => setBaToken(e.target.value)}
                        placeholder="eyJhbGciOiJSUzI1NiIs..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all font-mono text-sm resize-none"
                      />
                    </div>
                    {baError && (
                      <div className="flex items-center gap-2 text-rose-400 text-sm">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {baError}
                      </div>
                    )}
                    <button
                      onClick={handleBaValidate}
                      disabled={baLoading || !baToken.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {baLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Validate Token
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Token + claims */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Decoded Claims</h2>
                </div>
                {currentToken && (
                  <button
                    onClick={copyToken}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy token'}
                  </button>
                )}
              </div>
              <div className="p-6">
                {displayPayload ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Token valid</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-700/50 font-mono text-sm text-slate-300 overflow-x-auto">
                      {JSON.stringify(displayPayload, null, 2)}
                    </pre>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {displayPayload.org_id && (
                        <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                          org: {displayPayload.org_id}
                        </span>
                      )}
                      {displayPayload.org_role && (
                        <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                          role: {displayPayload.org_role}
                        </span>
                      )}
                      {displayPayload.token_balance !== undefined && (
                        <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium">
                          balance: {displayPayload.token_balance}
                        </span>
                      )}
                      {displayPayload.plan_tier && (
                        <span className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium">
                          {displayPayload.plan_tier}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
                      <ChevronRight className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-500">Sign in or validate a token to see decoded claims</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
