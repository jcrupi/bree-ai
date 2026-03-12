/**
 * API Explorer Component
 * Main interface for testing Relativity Workspace APIs
 */

import React, { useState } from 'react';
import { Play, Loader, Database, Folder, Users, Tag, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Copy, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';

import { api, captureAPICall, type APICallDetails } from '../services/api';
import { DataTable } from './DataTable';
import { AdvancedView } from './AdvancedView';
import { useAppMode } from '../context/AppModeContext';

interface APIQuestion {
  id: string;
  category: string;
  question: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  icon: React.ComponentType<any>;
  needsInput?: boolean;
  inputFields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    options?: Array<{ value: any; label: string }>;
  }>;
}

const apiQuestions: APIQuestion[] = [
  {
    id: 'get-all-workspaces',
    category: 'Workspace Queries',
    question: 'What workspaces exist in the system?',
    method: 'GET',
    endpoint: '/api/workspace',
    icon: Database
  },
  {
    id: 'get-workspace-by-id',
    category: 'Workspace Queries',
    question: 'Get details for a specific workspace',
    method: 'GET',
    endpoint: '/api/workspace/{id}',
    icon: Search,
    needsInput: true,
    inputFields: [
      { name: 'id', label: 'Workspace ID', type: 'number', required: true }
    ]
  },
  {
    id: 'create-workspace',
    category: 'Workspace Management',
    question: 'Create a new workspace',
    method: 'POST',
    endpoint: '/api/workspace',
    icon: Plus,
    needsInput: true,
    inputFields: [
      { name: 'name', label: 'Workspace Name', type: 'text', required: true },
      { name: 'matterArtifactID', label: 'Matter ID', type: 'number', required: true },
      { name: 'clientArtifactID', label: 'Client ID', type: 'number', required: true },
      { name: 'resourcePoolArtifactID', label: 'Resource Pool ID', type: 'number', required: true },
      { name: 'enableDataGrid', label: 'Enable Data Grid', type: 'checkbox' },
      { name: 'keywords', label: 'Keywords', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    id: 'update-workspace',
    category: 'Workspace Management',
    question: 'Update an existing workspace',
    method: 'PUT',
    endpoint: '/api/workspace/{id}',
    icon: Edit,
    needsInput: true,
    inputFields: [
      { name: 'id', label: 'Workspace ID', type: 'number', required: true },
      { name: 'name', label: 'New Name', type: 'text' },
      { name: 'keywords', label: 'Keywords', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    id: 'delete-workspace',
    category: 'Workspace Management',
    question: 'Delete a workspace',
    method: 'DELETE',
    endpoint: '/api/workspace/{id}',
    icon: Trash2,
    needsInput: true,
    inputFields: [
      { name: 'id', label: 'Workspace ID to Delete', type: 'number', required: true }
    ]
  },
  {
    id: 'get-saved-searches',
    category: 'Workspace Queries',
    question: 'What saved searches exist for a workspace?',
    method: 'POST',
    endpoint: '/api/workspace/{id}/query-eligible-saved-searches',
    icon: Search,
    needsInput: true,
    inputFields: [
      { name: 'id', label: 'Workspace ID', type: 'number', required: true }
    ]
  },
  {
    id: 'get-resource-pools',
    category: 'Resource Management',
    question: 'What resource pools are available?',
    method: 'GET',
    endpoint: '/api/workspace/eligible-resource-pools',
    icon: Folder
  },
  {
    id: 'get-azure-credentials',
    category: 'Resource Management',
    question: 'Get Azure credentials for a resource pool',
    method: 'GET',
    endpoint: '/api/workspace/eligible-resource-pools/{poolId}/eligible-azure-credentials',
    icon: Database,
    needsInput: true,
    inputFields: [
      { name: 'poolId', label: 'Resource Pool ID', type: 'number', required: true }
    ]
  },
  {
    id: 'get-matters',
    category: 'Lookup Data',
    question: 'What matters are available?',
    method: 'GET',
    endpoint: '/api/matters',
    icon: Folder
  },
  {
    id: 'get-clients',
    category: 'Lookup Data',
    question: 'What clients exist?',
    method: 'GET',
    endpoint: '/api/clients',
    icon: Users
  },
  {
    id: 'get-statuses',
    category: 'Lookup Data',
    question: 'What workspace statuses are available?',
    method: 'GET',
    endpoint: '/api/statuses',
    icon: Tag
  },
  {
    id: 'create-from-template',
    category: 'Workspace Management',
    question: 'Create a new workspace from an existing template',
    method: 'POST',
    endpoint: '/api/workspace/from-template/{templateId}',
    icon: Copy,
    needsInput: true,
    inputFields: [
      { name: 'templateId', label: 'Template Workspace ID', type: 'number', required: true },
      { name: 'name', label: 'New Workspace Name', type: 'text', required: true },
      { name: 'matterArtifactID', label: 'Override Matter ID (optional)', type: 'number' },
      { name: 'clientArtifactID', label: 'Override Client ID (optional)', type: 'number' },
      { name: 'resourcePoolArtifactID', label: 'Override Resource Pool ID (optional)', type: 'number' },
      { name: 'enableDataGrid', label: 'Override Enable Data Grid', type: 'checkbox' },
      { name: 'keywords', label: 'Override Keywords', type: 'text' },
      { name: 'notes', label: 'Override Notes', type: 'textarea' }
    ]
  },

  // ── Client Manager ───────────────────────────────────────────────────────
  {
    id: 'cm-list-clients',
    category: 'Client Manager',
    question: 'List all clients',
    method: 'GET',
    endpoint: '/api/clients',
    icon: Users,
  },
  {
    id: 'cm-get-client',
    category: 'Client Manager',
    question: 'Get a single client by ID',
    method: 'GET',
    endpoint: '/api/clients/{id}',
    icon: Search,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Client ID', type: 'number', required: true }],
  },
  {
    id: 'cm-create-client',
    category: 'Client Manager',
    question: 'Create a new client',
    method: 'POST',
    endpoint: '/api/clients',
    icon: Plus,
    needsInput: true,
    inputFields: [
      { name: 'name',         label: 'Client Name',    type: 'text',   required: true },
      { name: 'industry',     label: 'Industry',       type: 'text' },
      { name: 'contactEmail', label: 'Contact Email',  type: 'text',   required: true },
    ],
  },
  {
    id: 'cm-update-client',
    category: 'Client Manager',
    question: 'Update an existing client (PATCH)',
    method: 'PATCH',
    endpoint: '/api/clients/{id}',
    icon: Edit,
    needsInput: true,
    inputFields: [
      { name: 'id',           label: 'Client ID',      type: 'number', required: true },
      { name: 'name',         label: 'New Name',       type: 'text' },
      { name: 'industry',     label: 'Industry',       type: 'text' },
      { name: 'contactEmail', label: 'Contact Email',  type: 'text' },
    ],
  },
  {
    id: 'cm-delete-client',
    category: 'Client Manager',
    question: 'Delete a client (blocked if has workspaces/matters)',
    method: 'DELETE',
    endpoint: '/api/clients/{id}',
    icon: Trash2,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Client ID to Delete', type: 'number', required: true }],
  },
  {
    id: 'cm-client-matters',
    category: 'Client Manager',
    question: 'List all matters for a client',
    method: 'GET',
    endpoint: '/api/clients/{id}/matters',
    icon: Folder,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Client ID', type: 'number', required: true }],
  },
  {
    id: 'cm-client-workspaces',
    category: 'Client Manager',
    question: 'List all workspaces for a client',
    method: 'GET',
    endpoint: '/api/clients/{id}/workspaces',
    icon: Database,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Client ID', type: 'number', required: true }],
  },

  // ── ARM (Archive / Restore / Move) ───────────────────────────────────────
  {
    id: 'arm-archive-locations',
    category: 'ARM',
    question: 'List all ARM archive storage locations',
    method: 'GET',
    endpoint: '/api/arm/archive-locations',
    icon: Database,
  },
  {
    id: 'arm-list-jobs',
    category: 'ARM',
    question: 'List all ARM jobs (archive & restore)',
    method: 'GET',
    endpoint: '/api/arm/jobs',
    icon: Activity,
    needsInput: true,
    inputFields: [
      { name: 'type',   label: 'Filter by type (Archive | Restore)', type: 'text', required: false },
      { name: 'status', label: 'Filter by status (Pending | Processing | Complete | Error | Cancelled)', type: 'text', required: false },
    ],
  },
  {
    id: 'arm-get-job',
    category: 'ARM',
    question: 'Get an ARM job by ID',
    method: 'GET',
    endpoint: '/api/arm/jobs/{id}',
    icon: Activity,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Job ID', type: 'number', required: true }],
  },
  {
    id: 'arm-create-archive',
    category: 'ARM',
    question: 'Create an archive job for a workspace',
    method: 'POST',
    endpoint: '/api/arm/archive-jobs',
    icon: Database,
    needsInput: true,
    inputFields: [
      // ── Required ──────────────────────────────────────────────────────────
      { name: 'SourceWorkspaceID', label: 'Source Workspace ID ★', type: 'number' as const, required: true },
      // ── Archive destination ────────────────────────────────────────────────
      { name: 'ArchivePath', label: 'Archive Path (UNC)', type: 'text' as const, required: false },
      { name: 'UseDefaultArchiveDirectory', label: 'Use Default Archive Directory', type: 'checkbox' as const, required: false },
      // ── Job metadata ───────────────────────────────────────────────────────
      { name: 'JobName', label: 'Job Name', type: 'text' as const, required: false },
      { name: 'JobPriority', label: 'Job Priority', type: 'select' as const, required: false,
        options: [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }] },
      { name: 'ScheduledStartTime', label: 'Scheduled Start (ISO 8601)', type: 'text' as const, required: false },
      // ── Extended workspace data ────────────────────────────────────────────
      { name: 'IncludeExtendedWorkspaceData', label: 'Include Extended Workspace Data (apps, scripts, event handlers)', type: 'checkbox' as const, required: false },
      { name: 'ApplicationErrorExportBehavior', label: 'App Export Error Behavior', type: 'select' as const, required: false,
        options: [{ value: 'SkipApplication', label: 'Skip Application' }, { value: 'StopJob', label: 'Stop Job' }] },
      // ── MigratorOptions ────────────────────────────────────────────────────
      { name: 'MigratorOptions.IncludeDatabaseBackup',      label: 'MigratorOptions → Include Database Backup (.bak)',  type: 'checkbox' as const, required: false },
      { name: 'MigratorOptions.IncludeDtSearch',            label: 'MigratorOptions → Include dtSearch Indexes',       type: 'checkbox' as const, required: false },
      { name: 'MigratorOptions.IncludeConceptualAnalytics', label: 'MigratorOptions → Include Conceptual Analytics',   type: 'checkbox' as const, required: false },
      { name: 'MigratorOptions.IncludeStructuredAnalytics', label: 'MigratorOptions → Include Structured Analytics',   type: 'checkbox' as const, required: false },
      { name: 'MigratorOptions.IncludeDataGrid',            label: 'MigratorOptions → Include Data Grid Data',         type: 'checkbox' as const, required: false },
      // ── FileOptions ────────────────────────────────────────────────────────
      { name: 'FileOptions.IncludeRepositoryFiles', label: 'FileOptions → Include Repository Files',          type: 'checkbox' as const, required: false },
      { name: 'FileOptions.IncludeLinkedFiles',     label: 'FileOptions → Include Linked Files',               type: 'checkbox' as const, required: false },
      { name: 'FileOptions.MissingFileBehavior',    label: 'FileOptions → Missing File Behavior',              type: 'select' as const, required: false,
        options: [{ value: 'SkipFile', label: 'Skip File' }, { value: 'StopJob', label: 'Stop Job' }] },
      { name: 'FileOptions.PerformValidation',      label: 'FileOptions → Perform Post-Transfer Validation',   type: 'checkbox' as const, required: false },
      // ── NotificationOptions ────────────────────────────────────────────────
      { name: 'NotificationOptions.NotifyJobCreator',   label: 'NotificationOptions → Notify Job Creator',   type: 'checkbox' as const, required: false },
      { name: 'NotificationOptions.NotifyJobExecutor',  label: 'NotificationOptions → Notify Job Executor',  type: 'checkbox' as const, required: false },
      { name: 'NotificationOptions.UiJobActionsLocked', label: 'NotificationOptions → Lock UI Job Actions',  type: 'checkbox' as const, required: false },
    ],
  },
  {
    id: 'arm-create-restore',
    category: 'ARM',
    question: 'Create a restore job from an archive',
    method: 'POST',
    endpoint: '/api/arm/restore-jobs',
    icon: Database,
    needsInput: true,
    inputFields: [
      // ── Required ──────────────────────────────────────────────────────────
      { name: 'ArchivePath',    label: 'Archive Path (UNC) ★',       type: 'text'   as const, required: true },
      { name: 'MatterID',       label: 'Target Matter ID ★',          type: 'number' as const, required: true },
      { name: 'ResourcePoolID', label: 'Target Resource Pool ID ★',   type: 'number' as const, required: true },
      // ── Target environment ─────────────────────────────────────────────────
      { name: 'DatabaseServerID',            label: 'Target Database Server ID',                          type: 'number' as const, required: false },
      { name: 'CacheLocationID',             label: 'Target Cache Location ID',                           type: 'number' as const, required: false },
      { name: 'FileRepositoryID',            label: 'Target File Repository ID',                          type: 'number' as const, required: false },
      { name: 'StructuredAnalyticsServerID', label: 'Structured Analytics Server ID (if SA in archive)', type: 'number' as const, required: false },
      { name: 'ConceptualAnalyticsServerID', label: 'Conceptual Analytics Server ID (if CA in archive)', type: 'number' as const, required: false },
      { name: 'DtSearchLocationID',          label: 'dtSearch Location ID (if dtSearch in archive)',      type: 'number' as const, required: false },
      // ── Bakless restore ────────────────────────────────────────────────────
      { name: 'ExistingTargetDatabase', label: 'Existing Target Database (bakless — EDDSxxxxxxx format)', type: 'text' as const, required: false },
      // ── Job metadata ───────────────────────────────────────────────────────
      { name: 'JobName',            label: 'Job Name',                  type: 'text'   as const, required: false },
      { name: 'JobPriority',        label: 'Job Priority',              type: 'select' as const, required: false,
        options: [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }] },
      { name: 'ScheduledStartTime', label: 'Scheduled Start (ISO 8601)', type: 'text' as const, required: false },
      // ── Notifications ──────────────────────────────────────────────────────
      { name: 'NotificationOptions.NotifyJobCreator',  label: 'NotificationOptions → Notify Job Creator',  type: 'checkbox' as const, required: false },
      { name: 'NotificationOptions.NotifyJobExecutor', label: 'NotificationOptions → Notify Job Executor', type: 'checkbox' as const, required: false },
    ],
  },
  {
    id: 'arm-cancel-job',
    category: 'ARM',
    question: 'Cancel an ARM job',
    method: 'DELETE',
    endpoint: '/api/arm/jobs/{id}',
    icon: AlertTriangle,
    needsInput: true,
    inputFields: [{ name: 'id', label: 'Job ID to cancel', type: 'number', required: true }],
  },
];


// Quick reference data for workspace IDs
const workspaceQuickRef = [
  { id: 1234001, name: 'Acme Patent - Phase 1', client: 'Acme Corp' },
  { id: 1234002, name: 'Acme Patent - Phase 2', client: 'Acme Corp' },
  { id: 1234003, name: 'Global Contract Review', client: 'Global Industries' },
  { id: 1234004, name: 'TechStart Regulatory', client: 'TechStart Ventures' },
  { id: 1234005, name: 'Acme Archived 2025', client: 'Acme Corp (Archived)' }
];

const resourcePoolQuickRef = [
  { id: 1003680, name: 'Production Pool - East' },
  { id: 1003681, name: 'Production Pool - West' },
  { id: 1003682, name: 'Development Pool' },
  { id: 1003683, name: 'Archive Pool' }
];

const clientQuickRef = [
  { id: 1003663, name: 'Acme Corporation',      industry: 'Technology' },
  { id: 1003664, name: 'Global Industries Inc',  industry: 'Manufacturing' },
  { id: 1003665, name: 'TechStart Ventures',     industry: 'Venture Capital' },
];

export const APIExplorer: React.FC = () => {
  const { isLive, auth } = useAppMode();
  const [selectedQuestion, setSelectedQuestion] = useState<APIQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [apiDetails, setApiDetails] = useState<APICallDetails | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categories = Array.from(new Set(apiQuestions.map(q => q.category)));

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const executeAPI = async (question: APIQuestion) => {
    setLoading(true);
    setError(null);
    setResponseData(null);
    setApiDetails(null);

    try {
      let endpoint = question.endpoint;
      let body = null;

      // Replace path parameters
      if (question.needsInput) {
        Object.keys(formData).forEach(key => {
          endpoint = endpoint.replace(`{${key}}`, formData[key]);
        });

        // For POST/PUT, create body from non-path params
        if (question.method === 'POST' || question.method === 'PUT') {
          body = { ...formData };
          // Remove path params from body
          question.endpoint.match(/\{(\w+)\}/g)?.forEach(match => {
            const param = match.replace(/[{}]/g, '');
            delete body[param];
          });
        }
      }

      let result: any;

      // Make API call based on question ID
      switch (question.id) {
        case 'get-all-workspaces':
          if (isLive && auth?.accessToken) {
            // LIVE: hit the real Relativity workspace API with Bearer token, proxied via backend
            // In Relativity, Workspace is ObjectType 8. We query the admin workspace (-1).
            const wsUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 8 },
                condition: "",
                fields: [{ name: "Name" }]
              },
              start: 1,
              length: 100
            };

            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: wsUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data:    liveData,
              success: liveRes.ok,
              _live:   true,
              _url:    wsUrl,
              details: {
                method: 'GET',
                url: wsUrl,
                status: liveRes.status,
                headers: { 'Proxy': 'Local Backend' },
              }
            };
          } else {
            // MOCK: use local backend
            result = await captureAPICall(
              async () => await api.api.workspace.get(),
              'GET',
              endpoint
            );
          }
          break;

        case 'get-workspace-by-id':
          if (isLive && auth?.accessToken) {
            const wsUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 8 },
                condition: `'ArtifactID' == ${formData.id}`,
                fields: [{ name: "Name" }, { name: "ArtifactID" }]
              },
              start: 1,
              length: 1
            };
            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: wsUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data:    liveData,
              success: liveRes.ok,
              _live:   true,
              _url:    wsUrl,
              details: {
                method: 'POST',
                url: wsUrl,
                status: liveRes.status,
                headers: { 'Proxy': 'Local Backend' },
                payload: reqBody
              }
            };
          } else {
            result = await captureAPICall(
              async () => await api.api.workspace[formData.id].get(),
              'GET',
              endpoint
            );
          }
          break;

        case 'create-workspace':
          result = await captureAPICall(
            async () => await api.api.workspace.post(body),
            'POST',
            endpoint,
            body
          );
          break;

        case 'update-workspace':
          result = await captureAPICall(
            async () => await api.api.workspace[formData.id].put(body),
            'PUT',
            endpoint,
            body
          );
          break;

        case 'delete-workspace':
          result = await captureAPICall(
            async () => await api.api.workspace[formData.id].delete(),
            'DELETE',
            endpoint
          );
          break;

        case 'get-saved-searches':
          result = await captureAPICall(
            async () => await api.api.workspace[formData.id]['query-eligible-saved-searches'].post(),
            'POST',
            endpoint
          );
          break;

        case 'get-resource-pools':
          result = await captureAPICall(
            async () => await api.api.workspace['eligible-resource-pools'].get(),
            'GET',
            endpoint
          );
          break;

        case 'get-azure-credentials':
          result = await captureAPICall(
            async () => await api.api.workspace['eligible-resource-pools'][formData.poolId]['eligible-azure-credentials'].get(),
            'GET',
            endpoint
          );
          break;

        case 'get-matters':
          if (isLive && auth?.accessToken) {
            const mUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 6 }, // Matter = 6
                condition: "",
                fields: [{ name: "Name" }]
              },
              start: 1,
              length: 100
            };
            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: mUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data: liveData,
              success: liveRes.ok,
              _live: true,
              _url: mUrl,
              details: { method: 'POST', url: mUrl, status: liveRes.status, headers: { 'Proxy': 'Local Backend' }, payload: reqBody }
            };
          } else {
            result = await captureAPICall(
              async () => await api.api.matters.get(),
              'GET',
              endpoint
            );
          }
          break;

        case 'get-clients':
          if (isLive && auth?.accessToken) {
            const clUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 5 }, // Client = 5
                condition: "",
                fields: [{ name: "Name" }]
              },
              start: 1,
              length: 100
            };
            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: clUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data: liveData,
              success: liveRes.ok,
              _live: true,
              _url: clUrl,
              details: { method: 'POST', url: clUrl, status: liveRes.status, headers: { 'Proxy': 'Local Backend' }, payload: reqBody }
            };
          } else {
            result = await captureAPICall(
              async () => await api.api.clients.get(),
              'GET',
              endpoint
            );
          }
          break;

        case 'get-statuses':
          result = await captureAPICall(
            async () => await api.api.statuses.get(),
            'GET',
            endpoint
          );
          break;

        case 'create-from-template': {
          const { templateId: _tid, ...templateBody } = formData;
          // Strip undefined optional overrides so the backend doesn't see empty strings
          const cleanBody: Record<string, any> = { name: templateBody.name };
          if (templateBody.matterArtifactID) cleanBody.matterArtifactID = Number(templateBody.matterArtifactID);
          if (templateBody.clientArtifactID) cleanBody.clientArtifactID = Number(templateBody.clientArtifactID);
          if (templateBody.resourcePoolArtifactID) cleanBody.resourcePoolArtifactID = Number(templateBody.resourcePoolArtifactID);
          if (templateBody.enableDataGrid !== undefined) cleanBody.enableDataGrid = !!templateBody.enableDataGrid;
          if (templateBody.keywords) cleanBody.keywords = templateBody.keywords;
          if (templateBody.notes) cleanBody.notes = templateBody.notes;
          result = await captureAPICall(
            async () => await (api.api.workspace['from-template'][formData.templateId] as any).post(cleanBody),
            'POST',
            `/api/workspace/from-template/${formData.templateId}`,
            cleanBody
          );
          break;
        }

        case 'cm-list-clients':
          if (isLive && auth?.accessToken) {
            const clUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 5 }, // Client = 5
                condition: "",
                fields: [{ name: "Name" }]
              },
              start: 1,
              length: 100
            };
            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: clUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data: liveData,
              success: liveRes.ok,
              _live: true,
              _url: clUrl,
              details: { method: 'POST', url: clUrl, status: liveRes.status, headers: { 'Proxy': 'Local Backend' }, payload: reqBody }
            };
          } else {
            result = await captureAPICall(
              async () => await api.api.clients.get(),
              'GET', endpoint
            );
          }
          break;

        case 'cm-get-client':
          if (isLive && auth?.accessToken) {
            const clUrl = `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`;
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const reqBody = {
              request: {
                objectType: { artifactTypeID: 5 }, // Client = 5
                condition: `'ArtifactID' == ${formData.id}`,
                fields: [{ name: "Name" }]
              },
              start: 1,
              length: 1
            };
            const liveRes = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: clUrl,
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.accessToken}`,
                  'Content-Type': 'application/json',
                  'X-CSRF-Header': '-'
                },
                reqBody
              })
            });
            const liveData = await liveRes.json();
            result = {
              data: liveData,
              success: liveRes.ok,
              _live: true,
              _url: clUrl,
              details: { method: 'POST', url: clUrl, status: liveRes.status, headers: { 'Proxy': 'Local Backend' }, payload: reqBody }
            };
          } else {
            result = await captureAPICall(
              async () => await (api.api.clients as any)[formData.id].get(),
              'GET', endpoint
            );
          }
          break;

        case 'cm-create-client':
          result = await captureAPICall(
            async () => await (api.api.clients as any).post(body),
            'POST', endpoint, body
          );
          break;

        case 'cm-update-client': {
          const { id: _cid, ...patchBody } = formData;
          result = await captureAPICall(
            async () => {
              const res = await fetch(`/api/clients/${formData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patchBody),
              });
              return { data: await res.json(), status: res.status, headers: {} };
            },
            'PATCH', endpoint, patchBody
          );
          break;
        }

        case 'cm-delete-client':
          result = await captureAPICall(
            async () => await (api.api.clients as any)[formData.id].delete(),
            'DELETE', endpoint
          );
          break;

        case 'cm-client-matters':
          result = await captureAPICall(
            async () => await (api.api.clients as any)[formData.id].matters.get(),
            'GET', endpoint
          );
          break;

        case 'cm-client-workspaces':
          result = await captureAPICall(
            async () => await (api.api.clients as any)[formData.id].workspaces.get(),
            'GET', endpoint
          );
          break;

        // ── ARM ─────────────────────────────────────────────────────────
        case 'arm-archive-locations':
          result = await captureAPICall(
            async () => { const r = await fetch('/api/arm/archive-locations'); return r.json(); },
            'GET', '/api/arm/archive-locations'
          );
          break;

        case 'arm-list-jobs': {
          const qs = new URLSearchParams();
          if (formData.type)   qs.set('type',   formData.type);
          if (formData.status) qs.set('status', formData.status);
          const url = `/api/arm/jobs${qs.toString() ? '?' + qs.toString() : ''}`;
          result = await captureAPICall(
            async () => { const r = await fetch(url); return r.json(); },
            'GET', url
          );
          break;
        }

        case 'arm-get-job':
          result = await captureAPICall(
            async () => { const r = await fetch(`/api/arm/jobs/${formData.id}`); return r.json(); },
            'GET', `/api/arm/jobs/${formData.id}`
          );
          break;

        case 'arm-create-archive': {
          const fd = formData;
          result = await captureAPICall(
            async () => {
              const payload: any = { SourceWorkspaceID: Number(fd.SourceWorkspaceID) };
              if (fd.ArchivePath)                      payload.ArchivePath = fd.ArchivePath;
              if (fd.UseDefaultArchiveDirectory)       payload.UseDefaultArchiveDirectory = fd.UseDefaultArchiveDirectory;
              if (fd.JobName)                          payload.JobName = fd.JobName;
              if (fd.JobPriority)                      payload.JobPriority = fd.JobPriority;
              if (fd.ScheduledStartTime)               payload.ScheduledStartTime = fd.ScheduledStartTime;
              if (fd.IncludeExtendedWorkspaceData)     payload.IncludeExtendedWorkspaceData = fd.IncludeExtendedWorkspaceData;
              if (fd.ApplicationErrorExportBehavior)   payload.ApplicationErrorExportBehavior = fd.ApplicationErrorExportBehavior;

              // Only include nested objects if user touched at least one field
              // Checkboxes deliver native booleans; selects deliver strings
              const mo: any = {};
              if (fd['MigratorOptions.IncludeDatabaseBackup']      !== undefined) mo.IncludeDatabaseBackup      = fd['MigratorOptions.IncludeDatabaseBackup'];
              if (fd['MigratorOptions.IncludeDtSearch']            !== undefined) mo.IncludeDtSearch            = fd['MigratorOptions.IncludeDtSearch'];
              if (fd['MigratorOptions.IncludeConceptualAnalytics'] !== undefined) mo.IncludeConceptualAnalytics = fd['MigratorOptions.IncludeConceptualAnalytics'];
              if (fd['MigratorOptions.IncludeStructuredAnalytics'] !== undefined) mo.IncludeStructuredAnalytics = fd['MigratorOptions.IncludeStructuredAnalytics'];
              if (fd['MigratorOptions.IncludeDataGrid']            !== undefined) mo.IncludeDataGrid            = fd['MigratorOptions.IncludeDataGrid'];
              if (Object.keys(mo).length) payload.MigratorOptions = mo;

              const fo: any = {};
              if (fd['FileOptions.IncludeRepositoryFiles'] !== undefined) fo.IncludeRepositoryFiles = fd['FileOptions.IncludeRepositoryFiles'];
              if (fd['FileOptions.IncludeLinkedFiles']     !== undefined) fo.IncludeLinkedFiles     = fd['FileOptions.IncludeLinkedFiles'];
              if (fd['FileOptions.MissingFileBehavior'])                  fo.MissingFileBehavior    = fd['FileOptions.MissingFileBehavior'];
              if (fd['FileOptions.PerformValidation']      !== undefined) fo.PerformValidation      = fd['FileOptions.PerformValidation'];
              if (Object.keys(fo).length) payload.FileOptions = fo;

              const no: any = {};
              if (fd['NotificationOptions.NotifyJobCreator']   !== undefined) no.NotifyJobCreator   = fd['NotificationOptions.NotifyJobCreator'];
              if (fd['NotificationOptions.NotifyJobExecutor']  !== undefined) no.NotifyJobExecutor  = fd['NotificationOptions.NotifyJobExecutor'];
              if (fd['NotificationOptions.UiJobActionsLocked'] !== undefined) no.UiJobActionsLocked = fd['NotificationOptions.UiJobActionsLocked'];
              if (Object.keys(no).length) payload.NotificationOptions = no;

              const r = await fetch('/api/arm/archive-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              return r.json();
            },
            'POST', '/api/arm/archive-jobs'
          );
          break;
        }

        case 'arm-create-restore': {
          const fd2 = formData;
          const num = (v: any) => v ? Number(v) : undefined;
          result = await captureAPICall(
            async () => {
              const payload: any = {
                ArchivePath:    fd2.ArchivePath,
                MatterID:       Number(fd2.MatterID),
                ResourcePoolID: Number(fd2.ResourcePoolID),
              };
              if (num(fd2.DatabaseServerID))            payload.DatabaseServerID            = num(fd2.DatabaseServerID);
              if (num(fd2.CacheLocationID))             payload.CacheLocationID             = num(fd2.CacheLocationID);
              if (num(fd2.FileRepositoryID))            payload.FileRepositoryID            = num(fd2.FileRepositoryID);
              if (num(fd2.StructuredAnalyticsServerID)) payload.StructuredAnalyticsServerID = num(fd2.StructuredAnalyticsServerID);
              if (num(fd2.ConceptualAnalyticsServerID)) payload.ConceptualAnalyticsServerID = num(fd2.ConceptualAnalyticsServerID);
              if (num(fd2.DtSearchLocationID))          payload.DtSearchLocationID          = num(fd2.DtSearchLocationID);
              if (fd2.ExistingTargetDatabase)           payload.ExistingTargetDatabase      = fd2.ExistingTargetDatabase;
              if (fd2.JobName)                          payload.JobName                     = fd2.JobName;
              if (fd2.JobPriority)                      payload.JobPriority                 = fd2.JobPriority;
              if (fd2.ScheduledStartTime)               payload.ScheduledStartTime          = fd2.ScheduledStartTime;

              const no2: any = {};
              if (fd2['NotificationOptions.NotifyJobCreator']  !== undefined) no2.NotifyJobCreator  = fd2['NotificationOptions.NotifyJobCreator'];
              if (fd2['NotificationOptions.NotifyJobExecutor'] !== undefined) no2.NotifyJobExecutor = fd2['NotificationOptions.NotifyJobExecutor'];
              if (Object.keys(no2).length) payload.NotificationOptions = no2;

              const r = await fetch('/api/arm/restore-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              return r.json();
            },
            'POST', '/api/arm/restore-jobs'
          );
          break;
        }


        case 'arm-cancel-job':
          result = await captureAPICall(
            async () => {
              const r = await fetch(`/api/arm/jobs/${formData.id}`, { method: 'DELETE' });
              return r.json();
            },
            'DELETE', `/api/arm/jobs/${formData.id}`
          );
          break;

        default:
          throw new Error('Unknown API question');
      }

      setResponseData(result.data);
      setApiDetails(result.details);
    } catch (err: any) {
      setError(err.message || 'Failed to execute API call');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    if (!selectedQuestion) return;

    // Validate required fields
    if (selectedQuestion.needsInput && selectedQuestion.inputFields) {
      const missingFields = selectedQuestion.inputFields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.label);

      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    executeAPI(selectedQuestion);
  };

  const needsWorkspaceId = selectedQuestion?.id === 'get-workspace-by-id' ||
                           selectedQuestion?.id === 'update-workspace' ||
                           selectedQuestion?.id === 'delete-workspace' ||
                           selectedQuestion?.id === 'get-saved-searches';

  const needsTemplateId = selectedQuestion?.id === 'create-from-template';
  const needsResourcePoolId = selectedQuestion?.id === 'get-azure-credentials';
  const needsClientId = ['cm-get-client','cm-update-client','cm-delete-client','cm-client-matters','cm-client-workspaces'].includes(selectedQuestion?.id ?? '');

  return (
    <div className="max-w-7xl mx-auto">
      {/* API Questions Grid */}
      <div className="grid grid-cols-1 gap-6" style={{
        gridTemplateColumns: sidebarCollapsed ? '64px 1fr' : 'minmax(320px, 1fr) 2fr'
      }}>
        {/* Questions Panel */}
        <div className="relative">
          <div className={`bg-white rounded-lg shadow-lg sticky top-6 transition-all duration-300 ${
            sidebarCollapsed ? 'p-2' : 'p-6'
          }`}>
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-6 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-10"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {!sidebarCollapsed && (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">API Questions</h2>

            {categories.map(category => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {apiQuestions
                    .filter(q => q.category === category)
                    .map(question => {
                      const Icon = question.icon;
                      return (
                        <button
                          key={question.id}
                          onClick={() => {
                            setSelectedQuestion(question);
                            setFormData({});
                            setResponseData(null);
                            setApiDetails(null);
                            setError(null);
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedQuestion?.id === question.id
                              ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${
                              selectedQuestion?.id === question.id ? 'text-indigo-600' : 'text-gray-500'
                            }`} />
                            <div>
                              <p className={`text-sm font-medium ${
                                selectedQuestion?.id === question.id ? 'text-indigo-900' : 'text-gray-700'
                              }`}>
                                {question.question}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.method} {question.endpoint}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
              </>
            )}

            {/* Collapsed View - Show icons only */}
            {sidebarCollapsed && (
              <div className="space-y-3">
                {apiQuestions.map(question => {
                  const Icon = question.icon;
                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        setSelectedQuestion(question);
                        setFormData({});
                        setResponseData(null);
                        setApiDetails(null);
                        setError(null);
                      }}
                      className={`w-full p-3 rounded-lg transition-all ${
                        selectedQuestion?.id === question.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={question.question}
                    >
                      <Icon className="w-5 h-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedQuestion ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedQuestion.question}</h2>
                    <div className="flex items-center space-x-2 mt-2">
                {/* method badge — support PATCH */}
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  selectedQuestion.method === 'GET'    ? 'bg-green-100 text-green-800' :
                  selectedQuestion.method === 'POST'   ? 'bg-blue-100 text-blue-800' :
                  selectedQuestion.method === 'PATCH'  ? 'bg-amber-100 text-amber-800' :
                  selectedQuestion.method === 'PUT'    ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedQuestion.method}
                </span>
                      <code className="text-sm text-gray-600">{selectedQuestion.endpoint}</code>
                    </div>
                  </div>
                </div>

                {/* Quick Reference for Workspace IDs */}
                {needsWorkspaceId && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                    <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      Available Workspace IDs (Click to Copy)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {workspaceQuickRef.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            copyToClipboard(ws.id);
                            handleInputChange('id', ws.id);
                          }}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-indigo-600 font-mono">{ws.id}</span>
                              {copiedId === ws.id && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{ws.name}</p>
                            <p className="text-xs text-gray-400">{ws.client}</p>
                          </div>
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Ref — Client IDs */}
                {needsClientId && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200">
                    <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Client IDs (Click to fill)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {clientQuickRef.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { copyToClipboard(c.id); handleInputChange('id', c.id); }}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-emerald-700 font-mono">{c.id}</span>
                              {copiedId === c.id && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.industry}</p>
                          </div>
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reference for Resource Pool IDs */}
                {needsResourcePoolId && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                    <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                      <Folder className="w-4 h-4 mr-2" />
                      Available Resource Pool IDs (Click to Copy)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {resourcePoolQuickRef.map(pool => (
                        <button
                          key={pool.id}
                          onClick={() => {
                            copyToClipboard(pool.id);
                            handleInputChange('poolId', pool.id);
                          }}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-blue-600 font-mono">{pool.id}</span>
                              {copiedId === pool.id && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{pool.name}</p>
                          </div>
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reference for Template Workspace IDs */}
                {needsTemplateId && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg border-2 border-violet-300">
                    <h3 className="text-sm font-bold text-violet-900 mb-1 flex items-center">
                      <Copy className="w-4 h-4 mr-2" />
                      Pick a Template Workspace (Click to select)
                    </h3>
                    <p className="text-xs text-violet-600 mb-3">The new workspace will inherit all settings from the selected template. You can override any field below.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {workspaceQuickRef.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            copyToClipboard(ws.id);
                            handleInputChange('templateId', ws.id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${
                            formData.templateId === ws.id
                              ? 'bg-violet-600 border-violet-600 shadow-lg'
                              : 'bg-white border-violet-200 hover:border-violet-400 hover:shadow-md'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold font-mono ${
                                formData.templateId === ws.id ? 'text-white' : 'text-violet-600'
                              }`}>{ws.id}</span>
                              {copiedId === ws.id && formData.templateId !== ws.id && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {formData.templateId === ws.id && (
                                <CheckCircle2 className="w-4 h-4 text-violet-200" />
                              )}
                            </div>
                            <p className={`text-xs mt-0.5 ${
                              formData.templateId === ws.id ? 'text-violet-200' : 'text-gray-600'
                            }`}>{ws.name}</p>
                            <p className={`text-xs ${
                              formData.templateId === ws.id ? 'text-violet-300' : 'text-gray-400'
                            }`}>{ws.client}</p>
                          </div>
                          <Copy className={`w-4 h-4 ml-2 ${
                            formData.templateId === ws.id ? 'text-violet-200' : 'text-gray-400 group-hover:text-violet-600'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Form */}
                {selectedQuestion.needsInput && selectedQuestion.inputFields && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Input Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedQuestion.inputFields.map(field => (
                        <div
                          key={field.name}
                          className={
                            field.type === 'textarea' || field.type === 'checkbox'
                              ? 'md:col-span-2'
                              : ''
                          }
                        >
                          {field.type === 'checkbox' ? (
                            // Styled toggle card for booleans
                            <label className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors group">
                              <span className="text-sm text-gray-700 group-hover:text-indigo-700">{field.label}</span>
                              <input
                                type="checkbox"
                                checked={formData[field.name] === true}
                                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ml-3 shrink-0"
                              />
                            </label>
                          ) : (
                            <>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  rows={3}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  value={formData[field.name] ?? ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value || undefined)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                                >
                                  <option value="">— Select —</option>
                                  {field.options?.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type}
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, field.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    field.name === 'id' || field.name === 'poolId' || field.name === 'templateId' ? 'font-mono text-lg font-bold text-indigo-700' : ''
                                  }`}
                                  placeholder={field.name === 'id' || field.name === 'poolId' || field.name === 'templateId' ? 'Click a workspace above or type here' : ''}
                                />
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Execute Button */}
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Execute API Call</span>
                    </>
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Response Display */}
                {responseData && (
                  <>
                    {responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0 ? (
                      <DataTable data={responseData.data} title="Response Data" />
                    ) : responseData.data && typeof responseData.data === 'object' ? (
                      <DataTable data={[responseData.data]} title="Response Data" />
                    ) : (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <pre className="text-sm text-green-800 whitespace-pre-wrap">
                          {JSON.stringify(responseData, null, 2)}
                        </pre>
                      </div>
                    )}

                    <AdvancedView details={apiDetails} />
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select an API Question</h3>
                <p className="text-gray-500">Choose a question from the left panel to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
