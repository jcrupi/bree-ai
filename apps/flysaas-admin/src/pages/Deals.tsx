/**
 * Deals Page
 * Manage deals/opportunities (Core CRM + Client Org)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, DollarSign, Loader2, Trash2 } from 'lucide-react';

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export function Deals() {
  const [showCreate, setShowCreate] = useState(false);
  const [source, setSource] = useState<'core' | 'client'>('core');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('lead');
  const [probability, setProbability] = useState('');

  const queryClient = useQueryClient();

  const { data: coreDeals, isLoading: coreLoading } = useQuery({
    queryKey: ['core-deals'],
    queryFn: () => api.getCoreDeals(),
  });

  const { data: clientDeals, isLoading: clientLoading } = useQuery({
    queryKey: ['client-deals'],
    queryFn: () => api.getClientDeals(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      source === 'core' ? api.createCoreDeal(data) : api.createClientDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${source}-deals`] });
      setShowCreate(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCoreDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core-deals'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setStage('lead');
    setProbability('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      amount: amount ? parseFloat(amount) : undefined,
      stage,
      probability: probability ? parseInt(probability) : undefined,
    });
  };

  const deals = source === 'core' ? coreDeals : clientDeals;
  const isLoading = source === 'core' ? coreLoading : clientLoading;

  const totalValue = deals?.deals?.reduce((sum: number, deal: any) => sum + (deal.amount || 0), 0) || 0;
  const avgProbability = deals?.deals?.length
    ? Math.round(deals.deals.reduce((sum: number, deal: any) => sum + (deal.probability || 0), 0) / deals.deals.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deals</h2>
          <p className="text-gray-600 mt-1">Track sales pipeline and opportunities</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </button>
      </div>

      {/* Source Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSource('core')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            source === 'core'
              ? 'bg-bree-100 text-bree-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Core CRM ({coreDeals?.deals?.length || 0})
        </button>
        <button
          onClick={() => setSource('client')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            source === 'client'
              ? 'bg-bree-100 text-bree-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Client Org ({clientDeals?.deals?.length || 0})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-3xl font-bold text-gray-900">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Active Deals</div>
          <div className="text-3xl font-bold text-gray-900">
            {deals?.deals?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Probability</div>
          <div className="text-3xl font-bold text-gray-900">{avgProbability}%</div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Deal</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probability (%)
                </label>
                <input
                  type="number"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  placeholder="70"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-bree-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Probability
                </th>
                {source === 'core' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals?.deals?.map((deal: any) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{deal.title}</div>
                        {deal.contact_name && (
                          <div className="text-sm text-gray-500">{deal.contact_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {deal.amount ? `$${deal.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        STAGE_COLORS[deal.stage] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {deal.probability ? `${deal.probability}%` : '-'}
                  </td>
                  {source === 'core' && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(deal.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (!deals?.deals || deals.deals.length === 0) && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
          <p className="text-gray-600">Create your first deal to start tracking</p>
        </div>
      )}
    </div>
  );
}
