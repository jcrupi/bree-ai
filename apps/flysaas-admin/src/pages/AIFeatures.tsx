/**
 * AI Features Page
 * Generate and manage AI-powered features
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Sparkles, Loader2, Code2, ToggleLeft, ToggleRight } from 'lucide-react';

export function AIFeatures() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: () => api.getFeatures(),
  });

  const generateMutation = useMutation({
    mutationFn: (prompt: string) => api.generateFeature(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setShowGenerate(false);
      setPrompt('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.toggleFeature(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Features</h2>
          <p className="text-gray-600 mt-1">Generate custom features with AI</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-bree-500 to-bree-600 text-white px-4 py-2 rounded-lg hover:from-bree-600 hover:to-bree-700 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Generate Feature
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Features</div>
          <div className="text-3xl font-bold text-gray-900">
            {data?.features?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Active Features</div>
          <div className="text-3xl font-bold text-gray-900">
            {data?.features?.filter((f: any) => f.enabled).length || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Lines of Code</div>
          <div className="text-3xl font-bold text-gray-900">
            {data?.features?.reduce((sum: number, f: any) => sum + (f.code?.split('\n').length || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate AI Feature
            </h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the feature you want to generate..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Example: "Add lead scoring to deals based on contact activity"
                </p>
              </div>

              {generateMutation.error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {(generateMutation.error as Error).message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerate(false);
                    setPrompt('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-bree-500 to-bree-600 text-white px-4 py-2 rounded-lg hover:from-bree-600 hover:to-bree-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {generateMutation.isPending ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Code Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedFeature.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Generated {new Date(selectedFeature.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono">
                <code>{selectedFeature.code}</code>
              </pre>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setSelectedFeature(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-bree-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data?.features?.map((feature: any) => (
            <div
              key={feature.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-bree-100 to-bree-200 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-bree-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(feature.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleMutation.mutate({ id: feature.id, enabled: !feature.enabled })
                  }
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                    feature.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {feature.enabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Inactive
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Code2 className="w-4 h-4" />
                  {feature.code?.split('\n').length || 0} lines
                </div>
              </div>

              <button
                onClick={() => setSelectedFeature(feature)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Code2 className="w-4 h-4" />
                View Code
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!data?.features || data.features.length === 0) && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features yet</h3>
          <p className="text-gray-600 mb-4">Generate your first AI-powered feature</p>
          <button
            onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-bree-500 to-bree-600 text-white px-4 py-2 rounded-lg hover:from-bree-600 hover:to-bree-700 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate Feature
          </button>
        </div>
      )}
    </div>
  );
}
