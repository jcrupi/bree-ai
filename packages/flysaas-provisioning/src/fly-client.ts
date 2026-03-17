/**
 * Fly.io GraphQL API Client
 * Programmatic interface to Fly.io for machine provisioning
 */

import type { FlyMachine } from '@bree-ai/flysaas-types';

export interface FlyAppCreateInput {
  name: string;
  organizationSlug: string;
  region?: string;
}

export interface FlyAppDeployInput {
  appName: string;
  image: string;
  region?: string;
  env?: Record<string, string>;
}

export class FlyClient {
  private apiToken: string;
  private graphqlEndpoint = 'https://api.fly.io/graphql';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Create a new Fly.io app
   */
  async createApp(input: FlyAppCreateInput): Promise<{ id: string; name: string }> {
    const mutation = `
      mutation CreateApp($name: String!, $orgSlug: String!) {
        createApp(input: { name: $name, organizationSlug: $orgSlug }) {
          app {
            id
            name
          }
        }
      }
    `;

    const response = await this.graphqlRequest(mutation, {
      name: input.name,
      orgSlug: input.organizationSlug
    });

    return response.data.createApp.app;
  }

  /**
   * Deploy app using flyctl CLI (MVP implementation)
   * In production, this would use Fly Machines API directly
   */
  async deployApp(input: FlyAppDeployInput): Promise<boolean> {
    try {
      // Build environment variables
      const envArgs = Object.entries(input.env || {})
        .flatMap(([key, value]) => ['--env', `${key}=${value}`]);

      // Use flyctl to deploy
      const proc = Bun.spawn([
        'flyctl', 'deploy',
        '--app', input.appName,
        '--image', input.image,
        '--remote-only',
        '--now',
        ...envArgs
      ], {
        env: { ...process.env, FLY_API_TOKEN: this.apiToken }
      });

      const exitCode = await proc.exited;
      return exitCode === 0;
    } catch (error) {
      console.error('Deployment failed:', error);
      return false;
    }
  }

  /**
   * Check app health status
   */
  async checkHealth(appName: string): Promise<'passing' | 'failing' | 'unknown'> {
    const query = `
      query GetAppStatus($appName: String!) {
        app(name: $appName) {
          healthChecks {
            status
          }
        }
      }
    `;

    try {
      const response = await this.graphqlRequest(query, { appName });
      const healthChecks = response.data.app?.healthChecks || [];

      if (healthChecks.length === 0) return 'unknown';
      return healthChecks.every((hc: any) => hc.status === 'passing') ? 'passing' : 'failing';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get app machines
   */
  async getMachines(appName: string): Promise<FlyMachine[]> {
    const query = `
      query GetMachines($appName: String!) {
        app(name: $appName) {
          machines {
            nodes {
              id
              name
              state
              region
              createdAt
            }
          }
        }
      }
    `;

    const response = await this.graphqlRequest(query, { appName });
    const machines = response.data.app?.machines?.nodes || [];

    return machines.map((m: any) => ({
      id: m.id,
      app_name: appName,
      state: m.state,
      region: m.region,
      created_at: m.createdAt
    }));
  }

  /**
   * Execute GraphQL request
   */
  private async graphqlRequest(query: string, variables: Record<string, any>): Promise<any> {
    const response = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Fly.io API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result;
  }
}
