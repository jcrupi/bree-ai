/**
 * Central specialty configuration.
 * Used by playbook-loader (server) and playbookx CLI.
 */

export const SPECIALTY_CONFIG = [
  { id: "1040-simple", name: "1040 (Simple)", app: "playbook-ai", baseName: "1040-simple", rulesEngine: false },
  { id: "hipaa", name: "HIPAA", app: "playbook-ai", baseName: "hipaa", rulesEngine: false },
] as const;

export type SpecialtyId = (typeof SPECIALTY_CONFIG)[number]["id"];
