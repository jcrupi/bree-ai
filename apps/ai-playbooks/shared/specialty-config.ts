/**
 * Central specialty configuration.
 * Each specialty has a full Playbook + Algos covering its domain.
 * Flows are named slices of analysis within a specialty (e.g. specific
 * assessment types, coding scenarios, or targeted rule subsets).
 *
 * Used by playbook-loader (server) and playbookx CLI.
 */

export type FlowConfig = {
  id: string;
  name: string;
  description?: string;
};

export type SpecialtyConfig = {
  id: string;
  name: string;
  app: string;
  baseName: string;
  rulesEngine: boolean;
  flows: FlowConfig[];
};

export const SPECIALTY_CONFIG: SpecialtyConfig[] = [
  {
    id: "1040-simple",
    name: "1040 (Simple)",
    app: "playbook-ai",
    baseName: "1040-simple",
    rulesEngine: false,
    flows: [
      { id: "income", name: "Income Analysis" },
      { id: "deductions", name: "Deductions Review" },
      { id: "credits", name: "Credits & Adjustments" },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA",
    app: "playbook-ai",
    baseName: "hipaa",
    rulesEngine: false,
    flows: [
      { id: "phi-handling", name: "PHI Handling" },
      { id: "breach-assessment", name: "Breach Risk Assessment" },
      { id: "access-controls", name: "Access Controls" },
    ],
  },
];

export type SpecialtyId = (typeof SPECIALTY_CONFIG)[number]["id"];
