/**
 * Settings Page
 * User profile and system configuration
 */

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, Key, Bell, Globe, Sparkles } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'notifications' | 'system'>('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'System', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-bree-600 text-bree-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bree-500 focus:border-transparent"
                />
              </div>
              <button className="bg-bree-600 text-white px-6 py-2 rounded-lg hover:bg-bree-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
              <button className="bg-bree-600 text-white px-4 py-2 rounded-lg hover:bg-bree-700 transition-colors text-sm">
                Generate New Key
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              API keys allow you to access the FlySaaS API programmatically.
            </p>

            <div className="space-y-3">
              {/* Example API Key */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Production Key</div>
                      <div className="text-sm text-gray-500">Created 2 weeks ago</div>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-700 text-sm">Revoke</button>
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm text-gray-700">
                  sk_live_••••••••••••••••••••••••1234
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Development Key</div>
                      <div className="text-sm text-gray-500">Created 1 month ago</div>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-700 text-sm">Revoke</button>
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm text-gray-700">
                  sk_test_••••••••••••••••••••••••5678
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive email updates about your account
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-bree-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bree-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">New Organization Alerts</div>
                  <div className="text-sm text-gray-600">
                    Get notified when new organizations are created
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-bree-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bree-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">AI Feature Generation</div>
                  <div className="text-sm text-gray-600">
                    Notifications for AI feature generation completion
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-bree-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bree-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-gray-900">Weekly Reports</div>
                  <div className="text-sm text-gray-600">
                    Receive weekly summary reports
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-bree-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bree-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Version</span>
                <span className="text-sm text-gray-900">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Environment</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                  Development
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">SuperOrg API</span>
                <span className="text-sm text-gray-900 font-mono">
                  {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700">BREE AI Engine</span>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-bree-600" />
                  <span className="text-sm text-gray-900">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-bree-50 to-bree-100 rounded-xl border border-bree-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-bree-600" />
              <h3 className="text-lg font-semibold text-gray-900">About FlySaaS</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              FlySaaS is an AI-Native Multi-Tenant SaaS platform that automatically provisions
              isolated tenant environments with custom AI-generated features. Built with Bun,
              ElysiaJS, and powered by BREE AI.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/flysaas/flysaas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-bree-600 hover:text-bree-700 font-medium"
              >
                Documentation →
              </a>
              <a
                href="https://github.com/flysaas/flysaas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-bree-600 hover:text-bree-700 font-medium"
              >
                GitHub →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
