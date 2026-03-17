/**
 * Provisioning Orchestration
 * High-level orchestration of org provisioning workflow
 */

import { FlyClient } from './fly-client';
import type { ProvisioningRequest, Organization } from '@bree-ai/flysaas-types';

export interface ProvisioningResult {
  success: boolean;
  organization?: Organization;
  error?: string;
}

export class ProvisioningService {
  private flyClient: FlyClient;

  constructor(flyApiToken: string) {
    this.flyClient = new FlyClient(flyApiToken);
  }

  /**
   * Provision a new organization with Fly.io infrastructure
   */
  async provisionOrg(request: ProvisioningRequest): Promise<ProvisioningResult> {
    try {
      const appName = `flysaas-${request.org_slug}`;
      const region = request.region || 'iad'; // Default to IAD (Ashburn)

      // Step 1: Create Fly app
      console.log(`Creating Fly app: ${appName}`);
      const app = await this.flyClient.createApp({
        name: appName,
        organizationSlug: 'personal', // Use user's default org
        region
      });

      console.log(`Fly app created: ${app.id}`);

      // Step 2: Deploy client template
      console.log(`Deploying client template to ${appName}...`);
      const deployed = await this.flyClient.deployApp({
        appName,
        image: 'registry.fly.io/flysaas-client-template:latest',
        region,
        env: {
          ORG_ID: request.org_slug,
          SUPERORG_JWKS_URL: process.env.SUPERORG_JWKS_URL || 'https://flysaas-superorg.fly.dev/auth/jwks'
        }
      });

      if (!deployed) {
        throw new Error('Deployment failed');
      }

      // Step 3: Wait for healthy status
      console.log('Waiting for deployment to be healthy...');
      await this.waitForHealth(appName, 30); // 30 attempts = ~60 seconds

      // Step 4: Get machine info
      const machines = await this.flyClient.getMachines(appName);
      const machineId = machines[0]?.id;

      // Return organization data
      const organization: Organization = {
        id: crypto.randomUUID(),
        slug: request.org_slug,
        name: request.org_name,
        fly_app_name: appName,
        fly_machine_id: machineId,
        status: 'active',
        created_at: new Date()
      };

      return {
        success: true,
        organization
      };

    } catch (error) {
      console.error('Provisioning error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Wait for app to become healthy
   */
  private async waitForHealth(appName: string, maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const health = await this.flyClient.checkHealth(appName);

      if (health === 'passing') {
        console.log('✅ App is healthy');
        return;
      }

      console.log(`Health check ${i + 1}/${maxAttempts}: ${health}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    throw new Error('Deployment health check timeout');
  }

  /**
   * Deprovision an organization (cleanup)
   */
  async deprovisionOrg(orgSlug: string): Promise<boolean> {
    try {
      const appName = `flysaas-${orgSlug}`;

      // Use flyctl to destroy app
      const proc = Bun.spawn([
        'flyctl', 'apps', 'destroy', appName, '--yes'
      ], {
        env: { ...process.env, FLY_API_TOKEN: this.flyClient['apiToken'] }
      });

      const exitCode = await proc.exited;
      return exitCode === 0;
    } catch (error) {
      console.error('Deprovisioning error:', error);
      return false;
    }
  }
}
