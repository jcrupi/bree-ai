/**
 * Observer Admin Panel
 * View and manage user observations
 */

import { useState, useEffect } from 'react';
import {
  Bug,
  Zap,
  Lightbulb,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';

interface Observation {
  id: string;
  type: 'bug' | 'enhancement' | 'feature';
  description: string;
  url: string | null;
  status: 'new' | 'reviewing' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_name: string;
  user_email: string;
  assigned_to_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  new: number;
  reviewing: number;
  planned: number;
  in_progress: number;
  completed: number;
  rejected: number;
  bugs: number;
  enhancements: number;
  features: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export function ObserverAdmin() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Load observations
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const obsResponse = await fetch(`/api/observations?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (obsResponse.ok) {
        const obsData = await obsResponse.json();
        setObservations(obsData.observations);
      }

      // Load stats
      const statsResponse = await fetch('/api/observations/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to load observations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'enhancement': return <Zap className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-700 border-red-200';
      case 'enhancement': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'feature': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'reviewing': return <Eye className="w-4 h-4" />;
      case 'planned': return <Calendar className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'planned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-gray-400 text-white'
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading observations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Observer Admin</h1>
          <p className="text-slate-600 mt-1">Manage user feedback and feature requests</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Observations</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Bugs</p>
                <p className="text-3xl font-bold mt-2">{stats.bugs}</p>
              </div>
              <Bug className="w-12 h-12 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Enhancements</p>
                <p className="text-3xl font-bold mt-2">{stats.enhancements}</p>
              </div>
              <Zap className="w-12 h-12 text-amber-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Features</p>
                <p className="text-3xl font-bold mt-2">{stats.features}</p>
              </div>
              <Lightbulb className="w-12 h-12 text-emerald-200" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2 flex-1">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="bug">Bugs</option>
              <option value="enhancement">Enhancements</option>
              <option value="feature">Features</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Observations List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No observations found
                  </td>
                </tr>
              ) : (
                observations.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedObservation(obs)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTypeColor(obs.type)}`}>
                        {getTypeIcon(obs.type)}
                        <span className="text-sm font-medium capitalize">{obs.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900 line-clamp-2">{obs.description}</p>
                      {obs.url && (
                        <p className="text-xs text-slate-500 mt-1">Page: {obs.url}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(obs.status)}`}>
                        {getStatusIcon(obs.status)}
                        <span className="text-sm font-medium capitalize">{obs.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(obs.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{obs.user_name}</div>
                      <div className="text-xs text-slate-500">{obs.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(obs.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedObservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedObservation(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTypeColor(selectedObservation.type)}`}>
                    {getTypeIcon(selectedObservation.type)}
                    <span className="text-sm font-medium capitalize">{selectedObservation.type}</span>
                  </div>
                  {getPriorityBadge(selectedObservation.priority)}
                </div>
                <button
                  onClick={() => setSelectedObservation(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                <p className="text-slate-900">{selectedObservation.description}</p>
              </div>

              {selectedObservation.url && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Page URL</h3>
                  <p className="text-sm text-slate-600">{selectedObservation.url}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Status</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedObservation.status)}`}>
                    {getStatusIcon(selectedObservation.status)}
                    <span className="text-sm font-medium capitalize">{selectedObservation.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Submitted By</h3>
                  <p className="text-sm text-slate-900">{selectedObservation.user_name}</p>
                  <p className="text-xs text-slate-500">{selectedObservation.user_email}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Created</h3>
                <p className="text-sm text-slate-900">
                  {new Date(selectedObservation.created_at).toLocaleString()}
                </p>
              </div>

              {selectedObservation.notes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Notes</h3>
                  <p className="text-sm text-slate-900">{selectedObservation.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
