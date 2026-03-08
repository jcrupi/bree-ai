/**
 * Advanced View Component
 * Displays detailed REST call information including headers, body, and response
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, FileJson, Globe, Clock } from 'lucide-react';
import type { APICallDetails } from '../services/api';

interface AdvancedViewProps {
  details: APICallDetails | null;
}

export const AdvancedView: React.FC<AdvancedViewProps> = ({ details }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  if (!details) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Make an API call to see advanced details</p>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50';
    if (status >= 500) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
          <Code className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Advanced View</h3>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{details.duration}ms</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(details.status)}`}>
            {details.status}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('request')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'request'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Request</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'response'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileJson className="w-4 h-4" />
                <span>Response</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'request' && (
              <div className="space-y-6">
                {/* Method & Endpoint */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Endpoint
                  </h4>
                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                      {details.method}
                    </span>
                    <code className="text-sm text-gray-800 font-mono">{details.endpoint}</code>
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Headers</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono">{formatJSON(details.headers)}</pre>
                  </div>
                </div>

                {/* Request Body */}
                {details.body && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h4>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm font-mono">{formatJSON(details.body)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'response' && (
              <div className="space-y-6">
                {/* Response Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg ${getStatusColor(details.status)}`}>
                    <span className="font-bold text-lg">{details.status}</span>
                    <span className="ml-2 text-sm">
                      {details.status >= 200 && details.status < 300 && 'Success'}
                      {details.status >= 400 && details.status < 500 && 'Client Error'}
                      {details.status >= 500 && 'Server Error'}
                    </span>
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Time</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <Clock className="w-4 h-4" />
                    <span>{details.duration}ms</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{new Date(details.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Response Body */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Data</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-sm font-mono">{formatJSON(details.response)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
