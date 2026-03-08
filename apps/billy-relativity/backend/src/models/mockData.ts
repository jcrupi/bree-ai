/**
 * Mock Data Generator for Relativity Workspace APIs
 */

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
}

export interface Matter {
  artifactID: number;
  name: string;
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

// Mock Data Storage
class MockDataStore {
  private workspaces: Map<number, Workspace> = new Map();
  private resourcePools: Map<number, ResourcePool> = new Map();
  private matters: Map<number, Matter> = new Map();
  private clients: Map<number, Client> = new Map();
  private statuses: Map<number, WorkspaceStatus> = new Map();
  private savedSearches: Map<number, SavedSearch> = new Map();
  private nextWorkspaceId = 1000000;
  private nextSearchId = 2000000;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize Clients
    this.clients.set(1003663, {
      artifactID: 1003663,
      name: 'Acme Corporation',
      industry: 'Technology',
      contactEmail: 'legal@acme.com'
    });
    this.clients.set(1003664, {
      artifactID: 1003664,
      name: 'Global Industries Inc',
      industry: 'Manufacturing',
      contactEmail: 'legal@globalind.com'
    });
    this.clients.set(1003665, {
      artifactID: 1003665,
      name: 'TechStart Ventures',
      industry: 'Venture Capital',
      contactEmail: 'legal@techstart.com'
    });

    // Initialize Matters
    this.matters.set(1003697, {
      artifactID: 1003697,
      name: 'Patent Litigation 2026',
      clientArtifactID: 1003663,
      status: 'Active',
      created: '2026-01-15T10:00:00Z'
    });
    this.matters.set(1003698, {
      artifactID: 1003698,
      name: 'Contract Dispute - Phase II',
      clientArtifactID: 1003664,
      status: 'Active',
      created: '2026-02-01T14:30:00Z'
    });
    this.matters.set(1003699, {
      artifactID: 1003699,
      name: 'Regulatory Investigation',
      clientArtifactID: 1003665,
      status: 'Active',
      created: '2026-01-20T09:15:00Z'
    });

    // Initialize Statuses
    this.statuses.set(1234567, {
      artifactID: 1234567,
      name: 'Active',
      description: 'Workspace is active and available'
    });
    this.statuses.set(1234568, {
      artifactID: 1234568,
      name: 'Inactive',
      description: 'Workspace is inactive'
    });
    this.statuses.set(1234569, {
      artifactID: 1234569,
      name: 'Archived',
      description: 'Workspace has been archived'
    });

    // Initialize Resource Pools
    this.resourcePools.set(1003680, {
      artifactID: 1003680,
      name: 'Production Pool - East',
      type: 'Primary',
      available: true,
      capacity: 1000,
      used: 450
    });
    this.resourcePools.set(1003681, {
      artifactID: 1003681,
      name: 'Production Pool - West',
      type: 'Primary',
      available: true,
      capacity: 1000,
      used: 320
    });
    this.resourcePools.set(1003682, {
      artifactID: 1003682,
      name: 'Development Pool',
      type: 'Development',
      available: true,
      capacity: 500,
      used: 120
    });
    this.resourcePools.set(1003683, {
      artifactID: 1003683,
      name: 'Archive Pool',
      type: 'Archive',
      available: true,
      capacity: 2000,
      used: 890
    });

    // Initialize Sample Workspaces
    const sampleWorkspaces: Workspace[] = [
      {
        artifactID: 1234001,
        name: 'Acme Patent Discovery - Phase 1',
        matterArtifactID: 1003697,
        matterName: 'Patent Litigation 2026',
        clientArtifactID: 1003663,
        clientName: 'Acme Corporation',
        statusArtifactID: 1234567,
        statusName: 'Active',
        resourcePoolArtifactID: 1003680,
        resourcePoolName: 'Production Pool - East',
        sqlServerArtifactID: 1003742,
        enableDataGrid: true,
        downloadHandlerUrl: 'https://relativity.acme.com/download',
        created: '2026-01-16T10:30:00Z',
        lastModified: '2026-03-05T15:22:00Z',
        keywords: 'patent, litigation, technology',
        notes: 'Primary discovery workspace for patent case'
      },
      {
        artifactID: 1234002,
        name: 'Acme Patent Discovery - Phase 2',
        matterArtifactID: 1003697,
        matterName: 'Patent Litigation 2026',
        clientArtifactID: 1003663,
        clientName: 'Acme Corporation',
        statusArtifactID: 1234567,
        statusName: 'Active',
        resourcePoolArtifactID: 1003680,
        resourcePoolName: 'Production Pool - East',
        sqlServerArtifactID: 1003742,
        enableDataGrid: true,
        downloadHandlerUrl: 'https://relativity.acme.com/download',
        created: '2026-02-10T11:00:00Z',
        lastModified: '2026-03-06T09:15:00Z',
        keywords: 'patent, litigation, expert reports',
        notes: 'Expert witness materials workspace'
      },
      {
        artifactID: 1234003,
        name: 'Global Contract Review',
        matterArtifactID: 1003698,
        matterName: 'Contract Dispute - Phase II',
        clientArtifactID: 1003664,
        clientName: 'Global Industries Inc',
        statusArtifactID: 1234567,
        statusName: 'Active',
        resourcePoolArtifactID: 1003681,
        resourcePoolName: 'Production Pool - West',
        sqlServerArtifactID: 1003743,
        enableDataGrid: true,
        downloadHandlerUrl: 'https://relativity.global.com/download',
        created: '2026-02-02T08:45:00Z',
        lastModified: '2026-03-07T10:30:00Z',
        keywords: 'contract, breach, commercial',
        notes: 'Contract dispute document repository'
      },
      {
        artifactID: 1234004,
        name: 'TechStart Regulatory Investigation',
        matterArtifactID: 1003699,
        matterName: 'Regulatory Investigation',
        clientArtifactID: 1003665,
        clientName: 'TechStart Ventures',
        statusArtifactID: 1234567,
        statusName: 'Active',
        resourcePoolArtifactID: 1003682,
        resourcePoolName: 'Development Pool',
        sqlServerArtifactID: 1003744,
        enableDataGrid: false,
        downloadHandlerUrl: 'https://relativity.techstart.com/download',
        created: '2026-01-22T13:20:00Z',
        lastModified: '2026-03-01T16:45:00Z',
        keywords: 'regulatory, compliance, SEC',
        notes: 'SEC investigation document review'
      },
      {
        artifactID: 1234005,
        name: 'Acme Archived Workspace - 2025',
        matterArtifactID: 1003697,
        matterName: 'Patent Litigation 2026',
        clientArtifactID: 1003663,
        clientName: 'Acme Corporation',
        statusArtifactID: 1234569,
        statusName: 'Archived',
        resourcePoolArtifactID: 1003683,
        resourcePoolName: 'Archive Pool',
        sqlServerArtifactID: 1003742,
        enableDataGrid: false,
        downloadHandlerUrl: 'https://archive.relativity.acme.com/download',
        created: '2025-06-10T09:00:00Z',
        lastModified: '2025-12-31T23:59:00Z',
        keywords: 'archive, historical',
        notes: 'Archived workspace from previous phase'
      }
    ];

    sampleWorkspaces.forEach(ws => this.workspaces.set(ws.artifactID, ws));

    // Initialize Saved Searches
    const sampleSearches: SavedSearch[] = [
      {
        artifactID: 2000001,
        name: 'Hot Documents',
        workspaceID: 1234001,
        owner: 'john.smith@acme.com',
        isPublic: true,
        criteria: 'Responsive:Yes AND Hot:Yes',
        created: '2026-01-20T10:00:00Z'
      },
      {
        artifactID: 2000002,
        name: 'Privileged Communications',
        workspaceID: 1234001,
        owner: 'jane.doe@acme.com',
        isPublic: false,
        criteria: 'Privilege:Attorney-Client',
        created: '2026-01-25T14:30:00Z'
      },
      {
        artifactID: 2000003,
        name: 'Email From CEO',
        workspaceID: 1234001,
        owner: 'john.smith@acme.com',
        isPublic: true,
        criteria: 'From:ceo@acme.com',
        created: '2026-02-01T09:15:00Z'
      },
      {
        artifactID: 2000004,
        name: 'Contract Documents',
        workspaceID: 1234003,
        owner: 'legal@globalind.com',
        isPublic: true,
        criteria: 'Document Type:Contract',
        created: '2026-02-05T11:00:00Z'
      }
    ];

    sampleSearches.forEach(search => this.savedSearches.set(search.artifactID, search));
  }

  // Workspace Operations
  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  getWorkspaceById(id: number): Workspace | undefined {
    return this.workspaces.get(id);
  }

  createWorkspace(data: Partial<Workspace>): Workspace {
    const artifactID = this.nextWorkspaceId++;
    const matter = this.matters.get(data.matterArtifactID!);
    const client = this.clients.get(data.clientArtifactID!);
    const status = this.statuses.get(data.statusArtifactID || 1234567);
    const resourcePool = this.resourcePools.get(data.resourcePoolArtifactID!);

    const workspace: Workspace = {
      artifactID,
      name: data.name || 'New Workspace',
      matterArtifactID: data.matterArtifactID!,
      matterName: matter?.name || 'Unknown Matter',
      clientArtifactID: data.clientArtifactID!,
      clientName: client?.name || 'Unknown Client',
      statusArtifactID: data.statusArtifactID || 1234567,
      statusName: status?.name || 'Active',
      resourcePoolArtifactID: data.resourcePoolArtifactID!,
      resourcePoolName: resourcePool?.name || 'Unknown Pool',
      sqlServerArtifactID: data.sqlServerArtifactID || 1003742,
      enableDataGrid: data.enableDataGrid ?? true,
      downloadHandlerUrl: data.downloadHandlerUrl || `https://relativity.example.com/download/${artifactID}`,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      keywords: data.keywords || '',
      notes: data.notes || ''
    };

    this.workspaces.set(artifactID, workspace);
    return workspace;
  }

  updateWorkspace(id: number, updates: Partial<Workspace>): Workspace | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) return null;

    const updated = {
      ...workspace,
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.workspaces.set(id, updated);
    return updated;
  }

  deleteWorkspace(id: number): boolean {
    return this.workspaces.delete(id);
  }

  // Resource Pool Operations
  getAllResourcePools(): ResourcePool[] {
    return Array.from(this.resourcePools.values());
  }

  getEligibleResourcePools(): ResourcePool[] {
    return this.getAllResourcePools().filter(pool => pool.available);
  }

  // Matter Operations
  getAllMatters(): Matter[] {
    return Array.from(this.matters.values());
  }

  // Client Operations
  getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  // Status Operations
  getAllStatuses(): WorkspaceStatus[] {
    return Array.from(this.statuses.values());
  }

  // Saved Search Operations
  getSavedSearchesByWorkspace(workspaceID: number): SavedSearch[] {
    return Array.from(this.savedSearches.values())
      .filter(search => search.workspaceID === workspaceID);
  }

  createSavedSearch(data: Partial<SavedSearch>): SavedSearch {
    const artifactID = this.nextSearchId++;
    const search: SavedSearch = {
      artifactID,
      name: data.name || 'New Search',
      workspaceID: data.workspaceID!,
      owner: data.owner || 'unknown@example.com',
      isPublic: data.isPublic ?? true,
      criteria: data.criteria || '',
      created: new Date().toISOString()
    };

    this.savedSearches.set(artifactID, search);
    return search;
  }
}

// Export singleton instance
export const mockDataStore = new MockDataStore();
