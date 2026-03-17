/**
 * Dashboard Page
 * Overview with analytics and metrics
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, Users, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const { data: contacts } = useQuery({
    queryKey: ['core-contacts'],
    queryFn: () => api.getCoreContacts(),
  });

  const { data: deals } = useQuery({
    queryKey: ['core-deals'],
    queryFn: () => api.getCoreDeals(),
  });

  const { data: features } = useQuery({
    queryKey: ['features'],
    queryFn: () => api.getFeatures(),
  });

  const stats = [
    {
      name: 'Organizations',
      value: orgs?.organizations?.length || 0,
      icon: Building2,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'Contacts',
      value: contacts?.contacts?.length || 0,
      icon: Users,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      name: 'Deals',
      value: deals?.deals?.length || 0,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+23%',
    },
    {
      name: 'AI Features',
      value: features?.features?.length || 0,
      icon: Sparkles,
      color: 'bg-orange-500',
      change: '+45%',
    },
  ];

  // Mock chart data
  const chartData = [
    { month: 'Jan', contacts: 12, deals: 8 },
    { month: 'Feb', contacts: 19, deals: 12 },
    { month: 'Mar', contacts: 15, deals: 15 },
    { month: 'Apr', contacts: 25, deals: 18 },
    { month: 'May', contacts: 22, deals: 22 },
    { month: 'Jun', contacts: 30, deals: 25 },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600 mt-1">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activity Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="contacts" fill="#10b981" />
              <Bar dataKey="deals" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {deals?.deals?.slice(0, 5).map((deal: any) => (
              <div key={deal.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{deal.title}</div>
                  <div className="text-sm text-gray-500">
                    {deal.amount ? `$${deal.amount.toLocaleString()}` : 'No amount'}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {deal.stage}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-bree-500 to-bree-600 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
            <Building2 className="w-6 h-6 mb-2" />
            <div className="font-medium">Create Organization</div>
            <div className="text-sm opacity-90">Provision new tenant</div>
          </button>
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
            <Users className="w-6 h-6 mb-2" />
            <div className="font-medium">Add Contact</div>
            <div className="text-sm opacity-90">Import or create new</div>
          </button>
          <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-left transition-colors">
            <Sparkles className="w-6 h-6 mb-2" />
            <div className="font-medium">Generate Feature</div>
            <div className="text-sm opacity-90">AI-powered creation</div>
          </button>
        </div>
      </div>
    </div>
  );
}
