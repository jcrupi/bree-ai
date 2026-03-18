import { Task, TaskStatus, ProductName } from '../types/task';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  state: {
    name: string;
  };
  labels: {
    nodes: Array<{ name: string }>;
  };
}

interface LinearApiConfig {
  apiKey: string;
  teamId?: string;
  projectId?: string;
}

function mapLinearStateToStatus(stateName: string): TaskStatus {
  const stateMap: Record<string, TaskStatus> = {
    'Backlog': 'pending',
    'Todo': 'pending',
    'In Progress': 'active',
    'In Review': 'active',
    'Done': 'complete',
    'Canceled': 'complete',
    'Investigating': 'investigating',
  };
  return stateMap[stateName] || 'pending';
}

function mapLabelToProduct(labels: Array<{ name: string }>): ProductName {
  const labelNames = labels.map((l) => l.name.toLowerCase());
  
  if (labelNames.some((l) => l.includes('wound'))) return 'Wound AI';
  if (labelNames.some((l) => l.includes('performance'))) return 'Performance AI';
  if (labelNames.some((l) => l.includes('extraction'))) return 'Extraction AI';
  
  return 'Extraction AI'; // Default
}

export class LinearApiService {
  private apiKey: string;
  private teamId?: string;
  private projectId?: string;

  constructor(config: LinearApiConfig) {
    this.apiKey = config.apiKey;
    this.teamId = config.teamId;
    this.projectId = config.projectId;
  }

  private async graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  async fetchIssues(filter?: { labelIds?: string[]; stateIds?: string[] }): Promise<Task[]> {
    const query = `
      query Issues($filter: IssueFilter) {
        issues(filter: $filter, first: 100) {
          nodes {
            id
            identifier
            title
            description
            url
            createdAt
            state {
              name
            }
            labels {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    const variables: Record<string, unknown> = {};
    if (filter) {
      variables.filter = {};
      if (filter.labelIds?.length) {
        (variables.filter as Record<string, unknown>).labels = { id: { in: filter.labelIds } };
      }
      if (filter.stateIds?.length) {
        (variables.filter as Record<string, unknown>).state = { id: { in: filter.stateIds } };
      }
    }

    const data = await this.graphqlRequest<{ issues: { nodes: LinearIssue[] } }>(query, variables);
    
    return data.issues.nodes.map((issue) => ({
      id: issue.id,
      taskId: issue.identifier,
      productName: mapLabelToProduct(issue.labels.nodes),
      description: issue.title,
      link: issue.url,
      createdDate: issue.createdAt.split('T')[0],
      status: mapLinearStateToStatus(issue.state.name),
      comments: [],
    }));
  }

  async updateIssueState(issueId: string, stateId: string): Promise<void> {
    const mutation = `
      mutation UpdateIssue($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
        }
      }
    `;

    await this.graphqlRequest(mutation, { id: issueId, stateId });
  }

  async createIssue(input: {
    title: string;
    description?: string;
    teamId: string;
    labelIds?: string[];
  }): Promise<LinearIssue> {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            url
            createdAt
            state {
              name
            }
            labels {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest<{ issueCreate: { issue: LinearIssue } }>(mutation, { input });
    return data.issueCreate.issue;
  }

  async addComment(issueId: string, body: string): Promise<void> {
    const mutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }
    `;

    await this.graphqlRequest(mutation, { issueId, body });
  }
}

// Factory function to create the service
export function createLinearApiService(): LinearApiService | null {
  const apiKey = import.meta.env.VITE_LINEAR_API_KEY;
  
  if (!apiKey) {
    console.warn('Linear API key not configured. Using mock data.');
    return null;
  }

  return new LinearApiService({
    apiKey,
    teamId: import.meta.env.VITE_LINEAR_TEAM_ID,
    projectId: import.meta.env.VITE_LINEAR_PROJECT_ID,
  });
}
