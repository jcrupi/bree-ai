/**
 * Mock Data Store for Relativity Workspace APIs
 * BREE Stack: Bun + React + Elysia + Eden
 */

// ── Observables (theObserver — server-persisted, app-scoped) ─────────────────
export interface Observable {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
  app: 'billy-relativity';   // always scoped to this app
  source: 'observer';
  metadata?: { name?: string; email?: string; };
}

export interface Workspace {
  artifactID: number;
  name: string;
  matterArtifactID: number;
  matterName: string;
  clientArtifactID: number;
  clientName: string;
  statusArtifactID: number;
  statusName: string;
  resourcePoolArtifactID: number;
  resourcePoolName: string;
  sqlServerArtifactID: number;
  enableDataGrid: boolean;
  downloadHandlerUrl: string;
  created: string;
  lastModified: string;
  keywords?: string;
  notes?: string;
}

export interface ResourcePool {
  artifactID: number;
  name: string;
  type: string;
  available: boolean;
  capacity: number;
  used: number;
  utilizationPercent: number;
}

export interface Matter {
  artifactID: number;
  name: string;
  matterNumber: string;   // Required format: E-######## (8 digits). May be invalid.
  clientArtifactID: number;
  status: string;
  created: string;
}

export interface Client {
  artifactID: number;
  name: string;
  industry: string;
  contactEmail: string;
}

export interface WorkspaceStatus {
  artifactID: number;
  name: string;
  description: string;
}

export interface SavedSearch {
  artifactID: number;
  name: string;
  workspaceID: number;
  owner: string;
  isPublic: boolean;
  criteria: string;
  created: string;
}

export interface AzureCredential {
  artifactID: number;
  name: string;
  accountName: string;
  resourcePoolID: number;
  created: string;
}

export interface User {
  artifactID: number;
  fullName: string;
  email: string;
  type: 'SystemUser' | 'LoginUser';
  enabled: boolean;
  clientArtifactID?: number;
}

export interface Group {
  artifactID: number;
  name: string;
  type: 'SystemGroup' | 'ClientDomainAdmin' | 'ReviewerGroup';
  clientArtifactID?: number;   // the client this admin group manages
}

export interface GroupMembership {
  groupArtifactID: number;
  userArtifactID: number;
}

export interface EmailLog {
  id: string;
  sentAt: string;
  to: string[];
  subject: string;
  body: string;
  groupName: string;
  clientName: string;
  invalidWorkspaces: string[];
}

// Compliance validation
export const MATTER_NUMBER_REGEX = /^E-\d{8}$/;
export function isValidMatterNumber(n: string): boolean {
  return MATTER_NUMBER_REGEX.test(n);
}

// ─────────────────────────────────────────────────────────────────────────────
class MockDataStore {
  private workspaces: Map<number, Workspace> = new Map();
  private resourcePools: Map<number, ResourcePool> = new Map();
  private matters: Map<number, Matter> = new Map();
  private clients: Map<number, Client> = new Map();
  private statuses: Map<number, WorkspaceStatus> = new Map();
  private savedSearches: Map<number, SavedSearch> = new Map();
  private azureCredentials: Map<number, AzureCredential> = new Map();
  private users: Map<number, User> = new Map();
  private groups: Map<number, Group> = new Map();
  private memberships: GroupMembership[] = [];
  private emailLogs: EmailLog[] = [];
  private nextWorkspaceId = 1000010;

  constructor() { this.initializeMockData(); }

  private initializeMockData() {
    // ── Clients ──────────────────────────────────────────────────────────
    this.clients.set(1003663, { artifactID: 1003663, name: 'Acme Corporation',      industry: 'Technology',      contactEmail: 'legal@acme.com' });
    this.clients.set(1003664, { artifactID: 1003664, name: 'Global Industries Inc', industry: 'Manufacturing',   contactEmail: 'legal@globalind.com' });
    this.clients.set(1003665, { artifactID: 1003665, name: 'TechStart Ventures',    industry: 'Venture Capital', contactEmail: 'legal@techstart.com' });

    // ── Matters (some valid E-########, some NOT) ─────────────────────────
    this.matters.set(1003697, { artifactID: 1003697, name: 'Patent Litigation 2026',    matterNumber: 'E-20260115', clientArtifactID: 1003663, status: 'Active', created: '2026-01-15T10:00:00Z' });   // ✅
    this.matters.set(1003700, { artifactID: 1003700, name: 'IP Assignment Review',      matterNumber: 'BARE',       clientArtifactID: 1003663, status: 'Active', created: '2026-02-20T11:00:00Z' });   // ❌
    this.matters.set(1003698, { artifactID: 1003698, name: 'Contract Dispute Phase II', matterNumber: 'MAT-9921',   clientArtifactID: 1003664, status: 'Active', created: '2026-02-01T14:30:00Z' });   // ❌
    this.matters.set(1003701, { artifactID: 1003701, name: 'Employment Settlement',     matterNumber: 'E-20251201', clientArtifactID: 1003664, status: 'Closed', created: '2025-12-01T08:00:00Z' });   // ✅
    this.matters.set(1003699, { artifactID: 1003699, name: 'Regulatory Investigation',  matterNumber: 'E-20260120', clientArtifactID: 1003665, status: 'Active', created: '2026-01-20T09:15:00Z' });   // ✅
    this.matters.set(1003702, { artifactID: 1003702, name: 'SEC Subpoena Response',     matterNumber: '',           clientArtifactID: 1003665, status: 'Active', created: '2026-03-01T12:00:00Z' });   // ❌ missing

    // ── Statuses ─────────────────────────────────────────────────────────
    this.statuses.set(1234567, { artifactID: 1234567, name: 'Active',   description: 'Workspace is active and available' });
    this.statuses.set(1234568, { artifactID: 1234568, name: 'Inactive', description: 'Workspace is inactive' });
    this.statuses.set(1234569, { artifactID: 1234569, name: 'Archived', description: 'Workspace has been archived' });

    // ── Resource Pools ────────────────────────────────────────────────────
    ([
      { artifactID: 1003680, name: 'Production Pool - East', type: 'Primary',     available: true,  capacity: 1000, used: 450, utilizationPercent: 45 },
      { artifactID: 1003681, name: 'Production Pool - West', type: 'Primary',     available: true,  capacity: 1000, used: 320, utilizationPercent: 32 },
      { artifactID: 1003682, name: 'Development Pool',       type: 'Development', available: true,  capacity: 500,  used: 120, utilizationPercent: 24 },
      { artifactID: 1003683, name: 'Archive Pool',           type: 'Archive',     available: true,  capacity: 2000, used: 890, utilizationPercent: 44.5 },
    ] as ResourcePool[]).forEach(p => this.resourcePools.set(p.artifactID, p));

    // ── Azure Credentials ─────────────────────────────────────────────────
    this.azureCredentials.set(5001, { artifactID: 5001, name: 'Azure East Storage', accountName: 'relativityeastus', resourcePoolID: 1003680, created: '2025-12-01T10:00:00Z' });
    this.azureCredentials.set(5002, { artifactID: 5002, name: 'Azure West Storage', accountName: 'relativitywestus', resourcePoolID: 1003681, created: '2025-12-01T10:00:00Z' });

    // ── Workspaces ────────────────────────────────────────────────────────
    ([
      // Acme — 1003697 valid, 1003700 invalid
      { artifactID: 1234001, name: 'Acme Patent Discovery - Phase 1',    matterArtifactID: 1003697, matterName: 'Patent Litigation 2026',    clientArtifactID: 1003663, clientName: 'Acme Corporation',      statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003680, resourcePoolName: 'Production Pool - East', sqlServerArtifactID: 1003742, enableDataGrid: true,  downloadHandlerUrl: 'https://relativity.acme.com/download',     created: '2026-01-16T10:30:00Z', lastModified: '2026-03-05T15:22:00Z', keywords: 'patent, litigation',         notes: 'Primary discovery workspace' },
      { artifactID: 1234002, name: 'Acme Patent Discovery - Phase 2',    matterArtifactID: 1003697, matterName: 'Patent Litigation 2026',    clientArtifactID: 1003663, clientName: 'Acme Corporation',      statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003680, resourcePoolName: 'Production Pool - East', sqlServerArtifactID: 1003742, enableDataGrid: true,  downloadHandlerUrl: 'https://relativity.acme.com/download',     created: '2026-02-10T11:00:00Z', lastModified: '2026-03-06T09:15:00Z', keywords: 'patent, expert reports',     notes: 'Expert witness materials' },
      { artifactID: 1234006, name: 'Acme IP Assignment Workspace',        matterArtifactID: 1003700, matterName: 'IP Assignment Review',      clientArtifactID: 1003663, clientName: 'Acme Corporation',      statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003681, resourcePoolName: 'Production Pool - West', sqlServerArtifactID: 1003743, enableDataGrid: true,  downloadHandlerUrl: 'https://relativity.acme.com/download',     created: '2026-02-22T09:00:00Z', lastModified: '2026-03-07T14:00:00Z', keywords: 'IP, assignment',             notes: 'INVALID matter number — needs correction' },
      { artifactID: 1234005, name: 'Acme Archived Workspace - 2025',     matterArtifactID: 1003697, matterName: 'Patent Litigation 2026',    clientArtifactID: 1003663, clientName: 'Acme Corporation',      statusArtifactID: 1234569, statusName: 'Archived', resourcePoolArtifactID: 1003683, resourcePoolName: 'Archive Pool',           sqlServerArtifactID: 1003742, enableDataGrid: false, downloadHandlerUrl: 'https://archive.acme.com/download',        created: '2025-06-10T09:00:00Z', lastModified: '2025-12-31T23:59:00Z', keywords: 'archive, historical',        notes: 'Historical archive' },
      // Global — 1003698 invalid, 1003701 valid
      { artifactID: 1234003, name: 'Global Contract Review',              matterArtifactID: 1003698, matterName: 'Contract Dispute Phase II', clientArtifactID: 1003664, clientName: 'Global Industries Inc', statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003681, resourcePoolName: 'Production Pool - West', sqlServerArtifactID: 1003743, enableDataGrid: true,  downloadHandlerUrl: 'https://relativity.global.com/download',   created: '2026-02-02T08:45:00Z', lastModified: '2026-03-07T10:30:00Z', keywords: 'contract, breach',           notes: 'INVALID matter number — MAT-9921' },
      { artifactID: 1234007, name: 'Global Employment Settlement Review', matterArtifactID: 1003701, matterName: 'Employment Settlement',     clientArtifactID: 1003664, clientName: 'Global Industries Inc', statusArtifactID: 1234569, statusName: 'Archived', resourcePoolArtifactID: 1003683, resourcePoolName: 'Archive Pool',           sqlServerArtifactID: 1003743, enableDataGrid: false, downloadHandlerUrl: 'https://archive.global.com/download',      created: '2025-12-05T10:00:00Z', lastModified: '2026-01-31T23:59:00Z', keywords: 'employment, settlement',     notes: 'Closed matter archive' },
      // TechStart — 1003699 valid, 1003702 missing matterNumber
      { artifactID: 1234004, name: 'TechStart Regulatory Investigation',  matterArtifactID: 1003699, matterName: 'Regulatory Investigation',  clientArtifactID: 1003665, clientName: 'TechStart Ventures',    statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003682, resourcePoolName: 'Development Pool',       sqlServerArtifactID: 1003744, enableDataGrid: false, downloadHandlerUrl: 'https://relativity.techstart.com/download', created: '2026-01-22T13:20:00Z', lastModified: '2026-03-01T16:45:00Z', keywords: 'regulatory, SEC',            notes: 'SEC investigation review' },
      { artifactID: 1234008, name: 'TechStart SEC Subpoena Review',       matterArtifactID: 1003702, matterName: 'SEC Subpoena Response',     clientArtifactID: 1003665, clientName: 'TechStart Ventures',    statusArtifactID: 1234567, statusName: 'Active',   resourcePoolArtifactID: 1003682, resourcePoolName: 'Development Pool',       sqlServerArtifactID: 1003744, enableDataGrid: true,  downloadHandlerUrl: 'https://relativity.techstart.com/download', created: '2026-03-02T10:00:00Z', lastModified: '2026-03-08T09:00:00Z', keywords: 'SEC, subpoena',              notes: 'MISSING matter number — requires fix' },
    ] as Workspace[]).forEach(ws => this.workspaces.set(ws.artifactID, ws));

    // ── Users ─────────────────────────────────────────────────────────────
    ([
      { artifactID: 9001, fullName: 'Sarah Quinn',   email: 'squinn@relativity.com',  type: 'SystemUser', enabled: true },
      { artifactID: 9002, fullName: 'Marcus Reed',   email: 'mreed@relativity.com',   type: 'SystemUser', enabled: true },
      // Acme domain admins
      { artifactID: 9003, fullName: 'Diana Park',    email: 'dpark@acme.com',          type: 'LoginUser',  enabled: true, clientArtifactID: 1003663 },
      { artifactID: 9004, fullName: 'Carlos Mendez', email: 'cmendez@acme.com',        type: 'LoginUser',  enabled: true, clientArtifactID: 1003663 },
      // Global domain admins
      { artifactID: 9005, fullName: 'Priya Sharma',  email: 'psharma@globalind.com',   type: 'LoginUser',  enabled: true, clientArtifactID: 1003664 },
      { artifactID: 9006, fullName: 'Tom Bradley',   email: 'tbradley@globalind.com',  type: 'LoginUser',  enabled: true, clientArtifactID: 1003664 },
      // TechStart domain admins
      { artifactID: 9007, fullName: 'Aisha Johnson', email: 'ajohnson@techstart.com',  type: 'LoginUser',  enabled: true, clientArtifactID: 1003665 },
      // Reviewers
      { artifactID: 9008, fullName: 'John Smith',    email: 'john.smith@acme.com',     type: 'LoginUser',  enabled: true, clientArtifactID: 1003663 },
      { artifactID: 9009, fullName: 'Jane Doe',      email: 'jane.doe@acme.com',       type: 'LoginUser',  enabled: true, clientArtifactID: 1003663 },
      { artifactID: 9010, fullName: 'Linda Torres',  email: 'ltorres@globalind.com',   type: 'LoginUser',  enabled: true, clientArtifactID: 1003664 },
    ] as User[]).forEach(u => this.users.set(u.artifactID, u));

    // ── Groups ────────────────────────────────────────────────────────────
    ([
      { artifactID: 7001, name: 'Everyone',                                      type: 'SystemGroup' },
      { artifactID: 7002, name: 'System Administrators',                          type: 'SystemGroup' },
      { artifactID: 7003, name: 'Client Domain Admin for Acme Corporation',       type: 'ClientDomainAdmin', clientArtifactID: 1003663 },
      { artifactID: 7004, name: 'Client Domain Admin for Global Industries Inc',  type: 'ClientDomainAdmin', clientArtifactID: 1003664 },
      { artifactID: 7005, name: 'Client Domain Admin for TechStart Ventures',     type: 'ClientDomainAdmin', clientArtifactID: 1003665 },
      { artifactID: 7006, name: 'Acme Reviewers',                                 type: 'ReviewerGroup', clientArtifactID: 1003663 },
      { artifactID: 7007, name: 'Global Reviewers',                               type: 'ReviewerGroup', clientArtifactID: 1003664 },
    ] as Group[]).forEach(g => this.groups.set(g.artifactID, g));

    // ── Group Memberships ─────────────────────────────────────────────────
    this.memberships = [
      { groupArtifactID: 7001, userArtifactID: 9001 },
      { groupArtifactID: 7001, userArtifactID: 9002 },
      { groupArtifactID: 7002, userArtifactID: 9001 },
      { groupArtifactID: 7002, userArtifactID: 9002 },
      // Acme domain admins in their group
      { groupArtifactID: 7003, userArtifactID: 9003 },
      { groupArtifactID: 7003, userArtifactID: 9004 },
      // Global domain admins
      { groupArtifactID: 7004, userArtifactID: 9005 },
      { groupArtifactID: 7004, userArtifactID: 9006 },
      // TechStart domain admin
      { groupArtifactID: 7005, userArtifactID: 9007 },
      // Reviewers
      { groupArtifactID: 7006, userArtifactID: 9008 },
      { groupArtifactID: 7006, userArtifactID: 9009 },
      { groupArtifactID: 7007, userArtifactID: 9010 },
    ];

    // ── Saved Searches ────────────────────────────────────────────────────
    ([
      { artifactID: 2000001, name: 'Hot Documents',    workspaceID: 1234001, owner: 'john.smith@acme.com', isPublic: true,  criteria: 'Responsive:Yes AND Hot:Yes', created: '2026-01-20T10:00:00Z' },
      { artifactID: 2000002, name: 'Privileged Comms', workspaceID: 1234001, owner: 'jane.doe@acme.com',   isPublic: false, criteria: 'Privilege:Attorney-Client',  created: '2026-01-25T14:30:00Z' },
      { artifactID: 2000003, name: 'Email From CEO',   workspaceID: 1234001, owner: 'john.smith@acme.com', isPublic: true,  criteria: 'From:ceo@acme.com',         created: '2026-02-01T09:15:00Z' },
    ] as SavedSearch[]).forEach(s => this.savedSearches.set(s.artifactID, s));
  }

  // ── Workspace CRUD ────────────────────────────────────────────────────
  getAllWorkspaces() { return Array.from(this.workspaces.values()); }
  getWorkspaces() { return Array.from(this.workspaces.values()); }
  getWorkspace(id: number) { return this.workspaces.get(id); }

  createWorkspaceFromTemplate(templateId: number, overrides: { name: string; matterArtifactID?: number; clientArtifactID?: number; resourcePoolArtifactID?: number; enableDataGrid?: boolean; keywords?: string; notes?: string }): { workspace: Workspace; templateName: string } | null {
    const template = this.workspaces.get(templateId);
    if (!template) return null;
    const matterID = overrides.matterArtifactID ?? template.matterArtifactID;
    const clientID = overrides.clientArtifactID ?? template.clientArtifactID;
    const poolID   = overrides.resourcePoolArtifactID ?? template.resourcePoolArtifactID;
    const matter = this.matters.get(matterID);
    const client = this.clients.get(clientID);
    const pool   = this.resourcePools.get(poolID);
    const artifactID = this.nextWorkspaceId++;
    const workspace: Workspace = {
      ...template, artifactID, name: overrides.name,
      matterArtifactID: matterID, matterName: matter?.name ?? template.matterName,
      clientArtifactID: clientID, clientName: client?.name ?? template.clientName,
      resourcePoolArtifactID: poolID, resourcePoolName: pool?.name ?? template.resourcePoolName,
      enableDataGrid: overrides.enableDataGrid ?? template.enableDataGrid,
      keywords: overrides.keywords ?? template.keywords ?? '',
      notes: overrides.notes ?? `Created from template: ${template.name}`,
      downloadHandlerUrl: `https://rel.example.com/dl/${artifactID}`,
      created: new Date().toISOString(), lastModified: new Date().toISOString(),
    };
    this.workspaces.set(artifactID, workspace);
    return { workspace, templateName: template.name };
  }

  createWorkspace(data: Partial<Workspace>): Workspace {
    const artifactID = this.nextWorkspaceId++;
    const matter = this.matters.get(data.matterArtifactID!);
    const client = this.clients.get(data.clientArtifactID!);
    const status = this.statuses.get(data.statusArtifactID || 1234567);
    const pool = this.resourcePools.get(data.resourcePoolArtifactID!);
    const workspace: Workspace = {
      artifactID, name: data.name || 'New Workspace',
      matterArtifactID: data.matterArtifactID!, matterName: matter?.name || 'Unknown',
      clientArtifactID: data.clientArtifactID!, clientName: client?.name || 'Unknown',
      statusArtifactID: data.statusArtifactID || 1234567, statusName: status?.name || 'Active',
      resourcePoolArtifactID: data.resourcePoolArtifactID!, resourcePoolName: pool?.name || 'Unknown',
      sqlServerArtifactID: data.sqlServerArtifactID || 1003742,
      enableDataGrid: data.enableDataGrid ?? true,
      downloadHandlerUrl: data.downloadHandlerUrl || `https://rel.example.com/dl/${artifactID}`,
      created: new Date().toISOString(), lastModified: new Date().toISOString(),
      keywords: data.keywords || '', notes: data.notes || ''
    };
    this.workspaces.set(artifactID, workspace);
    return workspace;
  }

  updateWorkspace(id: number, updates: Partial<Workspace>) {
    const ws = this.workspaces.get(id);
    if (!ws) return null;
    const updated = { ...ws, ...updates, lastModified: new Date().toISOString() };
    this.workspaces.set(id, updated);
    return updated;
  }

  deleteWorkspace(id: number) { return this.workspaces.delete(id); }

  // ── Lookups ───────────────────────────────────────────────────────────
  getResourcePools() { return Array.from(this.resourcePools.values()); }
  getEligibleResourcePools() { return this.getResourcePools().filter(p => p.available); }
  getAzureCredentials(poolID: number) { return Array.from(this.azureCredentials.values()).filter(c => c.resourcePoolID === poolID); }
  getMatters() { return Array.from(this.matters.values()); }
  getMatter(id: number) { return this.matters.get(id); }
  createMatter(data: { name: string; clientArtifactID: number; matterNumber?: string; status?: string }): Matter | null {
    const client = this.clients.get(data.clientArtifactID);
    if (!client) return null;
    const nextId = Math.max(...Array.from(this.matters.keys())) + 1;
    const matter: Matter = { artifactID: nextId, name: data.name, matterNumber: data.matterNumber ?? '', clientArtifactID: data.clientArtifactID, status: data.status ?? 'Active', created: new Date().toISOString() };
    this.matters.set(nextId, matter);
    return matter;
  }
  getClients() { return Array.from(this.clients.values()); }
  getClient(id: number) { return this.clients.get(id); }

  createClient(data: { name: string; industry: string; contactEmail: string }): Client {
    const artifactID = Math.max(...Array.from(this.clients.keys()), 1003700) + 1;
    const client: Client = { artifactID, name: data.name.trim(), industry: data.industry.trim(), contactEmail: data.contactEmail.trim() };
    this.clients.set(artifactID, client);
    return client;
  }

  updateClient(id: number, data: Partial<{ name: string; industry: string; contactEmail: string }>): Client | null {
    const existing = this.clients.get(id);
    if (!existing) return null;
    const updated: Client = {
      ...existing,
      ...(data.name        !== undefined && { name: data.name.trim() }),
      ...(data.industry    !== undefined && { industry: data.industry.trim() }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail.trim() }),
    };
    this.clients.set(id, updated);
    return updated;
  }

  deleteClient(id: number): { deleted: boolean; reason?: string } {
    if (!this.clients.has(id)) return { deleted: false, reason: 'Client not found' };
    // Block if client has workspaces or matters
    const hasWorkspaces = Array.from(this.workspaces.values()).some(w => w.clientArtifactID === id);
    if (hasWorkspaces) return { deleted: false, reason: 'Client has active workspaces — decommission them first' };
    const hasMatters = Array.from(this.matters.values()).some(m => m.clientArtifactID === id);
    if (hasMatters) return { deleted: false, reason: 'Client has matters — close them first' };
    this.clients.delete(id);
    return { deleted: true };
  }

  getStatuses() { return Array.from(this.statuses.values()); }
  getSavedSearches(workspaceID: number) { return Array.from(this.savedSearches.values()).filter(s => s.workspaceID === workspaceID); }

  // ── Users & Groups ────────────────────────────────────────────────────
  getUsers() { return Array.from(this.users.values()); }
  getGroups() { return Array.from(this.groups.values()); }

  getGroupMembers(groupArtifactID: number): User[] {
    return this.memberships
      .filter(m => m.groupArtifactID === groupArtifactID)
      .map(m => this.users.get(m.userArtifactID))
      .filter(Boolean) as User[];
  }

  getUserGroups(userArtifactID: number): Group[] {
    return this.memberships
      .filter(m => m.userArtifactID === userArtifactID)
      .map(m => this.groups.get(m.groupArtifactID))
      .filter(Boolean) as Group[];
  }

  getClientDomainAdminGroup(clientArtifactID: number): Group | undefined {
    return Array.from(this.groups.values()).find(g => g.type === 'ClientDomainAdmin' && g.clientArtifactID === clientArtifactID);
  }

  // ── Story 1: Client Domain View ───────────────────────────────────────
  getClientDomainView() {
    return this.getClients().map(client => {
      const clientWorkspaces = Array.from(this.workspaces.values()).filter(ws => ws.clientArtifactID === client.artifactID);

      // Group workspaces by matter
      const matterMap = new Map<number, { matter: Matter; workspaces: Workspace[] }>();
      for (const ws of clientWorkspaces) {
        if (!matterMap.has(ws.matterArtifactID)) {
          const matter = this.matters.get(ws.matterArtifactID);
          if (matter) matterMap.set(ws.matterArtifactID, { matter, workspaces: [] });
        }
        matterMap.get(ws.matterArtifactID)?.workspaces.push(ws);
      }

      const adminGroup = this.getClientDomainAdminGroup(client.artifactID);
      const admins = adminGroup ? this.getGroupMembers(adminGroup.artifactID) : [];

      const mattersArr = Array.from(matterMap.values()).map(({ matter, workspaces }) => ({
        matter,
        matterNumberValid: isValidMatterNumber(matter.matterNumber),
        workspaces,
      }));

      return {
        client,
        adminGroup: adminGroup ?? null,
        admins,
        matters: mattersArr,
        totalWorkspaces: clientWorkspaces.length,
        invalidMatterCount: mattersArr.filter(m => !m.matterNumberValid).length,
      };
    });
  }

  // ── Story 2: Compliance email alert ──────────────────────────────────
  sendComplianceAlert(clientArtifactID: number): EmailLog | null {
    const client = this.clients.get(clientArtifactID);
    if (!client) return null;

    const adminGroup = this.getClientDomainAdminGroup(clientArtifactID);
    if (!adminGroup) return null;

    const admins = this.getGroupMembers(adminGroup.artifactID);
    if (!admins.length) return null;

    // Find workspaces with an invalid matter number for this client
    const invalidWorkspaces: string[] = [];
    for (const ws of Array.from(this.workspaces.values()).filter(w => w.clientArtifactID === clientArtifactID)) {
      const matter = this.matters.get(ws.matterArtifactID);
      if (matter && !isValidMatterNumber(matter.matterNumber)) {
        invalidWorkspaces.push(`${ws.name} — Matter "${matter.matterNumber || 'EMPTY'}" (${matter.name})`);
      }
    }

    if (!invalidWorkspaces.length) return null;

    const log: EmailLog = {
      id: `email-${Date.now()}-${clientArtifactID}`,
      sentAt: new Date().toISOString(),
      to: admins.map(u => u.email),
      subject: `⚠️ Matter Number Compliance Alert — ${client.name}`,
      body: [
        `Dear ${adminGroup.name},`,
        ``,
        `The following workspaces in your client domain have matter numbers that do NOT conform to the required format (E-########):`,
        ``,
        ...invalidWorkspaces.map(w => `  • ${w}`),
        ``,
        `Please update the matter numbers to the format E-######## (E followed by a dash and exactly 8 digits).`,
        ``,
        `This is an automated compliance notification from Relativity Administration.`,
      ].join('\n'),
      groupName: adminGroup.name,
      clientName: client.name,
      invalidWorkspaces,
    };

    this.emailLogs.unshift(log);
    return log;
  }

  getEmailLogs() { return this.emailLogs; }

  // ── theObserver — volume-persisted observable store ─────────────────
  private get obsFilePath(): string {
    const dir = process.env.DATA_DIR ?? '/tmp';
    return `${dir}/observations.json`;
  }

  private loadObservablesFromDisk(): Observable[] {
    try {
      const raw = require('fs').readFileSync(this.obsFilePath, 'utf8');
      return JSON.parse(raw) as Observable[];
    } catch {
      return [];
    }
  }

  private saveObservablesToDisk(obs: Observable[]) {
    try {
      const dir = process.env.DATA_DIR ?? '/tmp';
      require('fs').mkdirSync(dir, { recursive: true });
      require('fs').writeFileSync(this.obsFilePath, JSON.stringify(obs, null, 2), 'utf8');
    } catch (e) {
      console.error('[theObserver] Failed to persist observations:', e);
    }
  }

  getObservables(): Observable[] {
    const obs = this.loadObservablesFromDisk();
    return obs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addObservable(data: { text: string; category?: string; tags?: string[] }): Observable {
    const obs: Observable = {
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: data.text,
      category: data.category ?? 'general',
      tags: data.tags ?? [],
      createdAt: new Date().toISOString(),
      app: 'billy-relativity',
      source: 'observer',
    };
    const existing = this.loadObservablesFromDisk();
    const updated = [obs, ...existing];
    this.saveObservablesToDisk(updated);
    return obs;
  }
}

export const db = new MockDataStore();
