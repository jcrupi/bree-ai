/**
 * Organizations Page
 * Manage tenant organizations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Building2, Loader2, ExternalLink } from 'lucide-react';

export function Organizations() {
  const [showCreate, setShowCreate] = useState(false);
  const [orgSlug, setOrgSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [region, setRegion] = useState('iad');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createOrganization(orgSlug, orgName, region),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowCreate(false);
      setOrgSlug('');
      setOrgName('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
          <p className="text-gray-600 mt-1">Manage tenant organizations and provisioning</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Organization
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="my-company"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Company Inc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                >
                  <option value="iad">US East (IAD)</option>
                  <option value="lax">US West (LAX)</option>
                  <option value="lhr">Europe (LHR)</option>
                  <option value="syd">Asia Pacific (SYD)</option>
                </select>
              </div>

              {createMutation.error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {(createMutation.error as Error).message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-bree-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.organizations?.map((org: any) => (
            <div
              key={org.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-bree-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-bree-600" />
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    org.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : org.status === 'provisioning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {org.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{org.name}</h3>
              <p className="text-sm text-gray-600 mb-4">/{org.slug}</p>

              <div className="space-y-2 text-sm">
                {org.fly_app_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">App:</span>
                    <span className="font-mono text-xs">{org.fly_app_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">{org.role}</span>
                </div>
              </div>

              {org.fly_app_name && (
                <a
                  href={`https://${org.fly_app_name}.fly.dev`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-sm text-bree-600 hover:text-bree-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View App
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!data?.organizations || data.organizations.length === 0) && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first organization</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Organization
          </button>
        </div>
      )}
    </div>
  );
}
