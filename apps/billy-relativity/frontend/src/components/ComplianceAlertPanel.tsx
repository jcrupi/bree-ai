/**
 * Compliance Alert Panel — Story 2
 * Send email alerts to Client Domain Admin groups for invalid matter numbers
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Mail, CheckCircle, Send, RefreshCw, ChevronDown, ChevronRight, Users } from 'lucide-react';

interface ClientDomain {
  client: { artifactID: number; name: string; industry: string; contactEmail: string; };
  adminGroup: { artifactID: number; name: string; } | null;
  admins: { artifactID: number; fullName: string; email: string; }[];
  matters: { matter: { name: string; matterNumber: string; }; matterNumberValid: boolean; workspaces: { name: string; artifactID: number }[] }[];
  invalidMatterCount: number;
}

interface EmailLog {
  id: string;
  sentAt: string;
  to: string[];
  subject: string;
  body: string;
  groupName: string;
  clientName: string;
  invalidWorkspaces: string[];
}

const API = (path: string, init?: RequestInit) => fetch(path, init).then(r => r.json());

function LogCard({ log, open, onToggle }: { log: EmailLog; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-emerald-200 overflow-hidden mb-3 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-emerald-600" />}
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <div>
            <span className="text-sm font-bold text-gray-800">{log.clientName}</span>
            <span className="ml-2 text-xs text-gray-500">{new Date(log.sentAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
          <Mail className="w-3.5 h-3.5" />
          {log.to.length} recipient{log.to.length !== 1 ? 's' : ''}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sent To</div>
            <div className="flex flex-wrap gap-2">
              {log.to.map(email => (
                <span key={email} className="bg-violet-50 border border-violet-200 text-violet-700 text-xs px-3 py-1 rounded-full font-mono">{email}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject</div>
            <div className="text-sm text-gray-800 font-medium">{log.subject}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Flagged Workspaces</div>
            <ul className="space-y-1">
              {log.invalidWorkspaces.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Body</div>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg border border-gray-200 p-3 whitespace-pre-wrap font-mono leading-relaxed">{log.body}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ComplianceAlertPanel() {
  const [domains, setDomains] = useState<ClientDomain[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [sending, setSending] = useState<number | 'all' | null>(null);
  const [loading, setLoading] = useState(true);
  const [openLogs, setOpenLogs] = useState<Set<string>>(new Set());

  const toggleLog = (id: string) => setOpenLogs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const loadData = async () => {
    setLoading(true);
    const [dv, el] = await Promise.all([
      API('/api/clients/domain-view'),
      API('/api/email/logs'),
    ]);
    setDomains(dv.data ?? []);
    setLogs(el.data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const sendAlert = async (clientId: number | 'all') => {
    setSending(clientId);
    try {
      if (clientId === 'all') {
        await API('/api/email/compliance-alert-all', { method: 'POST' });
      } else {
        await API(`/api/email/compliance-alert/${clientId}`, { method: 'POST' });
      }
      // Reload logs
      const el = await API('/api/email/logs');
      setLogs(el.data ?? []);
    } finally {
      setSending(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
    </div>
  );

  const invalidClients = domains.filter(d => d.invalidMatterCount > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Matter Number Compliance</h2>
              <p className="text-sm text-gray-600 mt-1">
                Required format: <code className="bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-indigo-700 font-bold">E-########</code> (E dash 8 digits)
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {invalidClients.length > 0
                  ? `${invalidClients.length} client domain${invalidClients.length !== 1 ? 's' : ''} have workspaces with non-compliant matter numbers. Their Client Domain Admin groups will be notified.`
                  : '✅ All matter numbers are compliant!'}
              </p>
            </div>
          </div>
          {invalidClients.length > 0 && (
            <button
              onClick={() => sendAlert('all')}
              disabled={sending !== null}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {sending === 'all' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Alert All ({invalidClients.length})
            </button>
          )}
        </div>
      </div>

      {/* Per-client compliance table */}
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-4">Client Domain Status</h3>
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
            <div>Client / Admin Group</div>
            <div>Invalid Matters</div>
            <div>Admins</div>
            <div>Action</div>
          </div>

          {domains.map(d => {
            const invalid = d.matters.filter(m => !m.matterNumberValid);
            const ok = invalid.length === 0;
            return (
              <div key={d.client.artifactID} className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-0 ${ok ? '' : 'bg-red-50/40'}`}>
                <div>
                  <div className="font-semibold text-gray-900">{d.client.name}</div>
                  {d.adminGroup && (
                    <div className="flex items-center gap-1 text-xs text-violet-600 mt-0.5">
                      <Users className="w-3 h-3" />
                      {d.adminGroup.name}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  {ok ? (
                    <span className="text-emerald-500 font-bold text-sm">✓ All valid</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> {invalid.length}
                    </span>
                  )}
                </div>
                <div className="text-center text-sm text-gray-600">
                  {d.admins.length > 0
                    ? <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-violet-400" />{d.admins.length}</span>
                    : <span className="text-gray-400 text-xs">None</span>}
                </div>
                <div>
                  {!ok && (
                    <button
                      onClick={() => sendAlert(d.client.artifactID)}
                      disabled={sending !== null}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {sending === d.client.artifactID ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send Alert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">Email Logs ({logs.length})</h3>
          <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No alerts sent yet. Click "Send Alert" above.</p>
          </div>
        ) : (
          logs.map(log => <LogCard key={log.id} log={log} open={openLogs.has(log.id)} onToggle={() => toggleLog(log.id)} />)
        )}
      </div>
    </div>
  );
}
