/**
 * Central specialty configuration — Playbook Catalogs.
 * Used by playbook-loader (server) and playbookx CLI.
 *
 * Catalogs group specialties by platform origin:
 *  - Bree AI:   1040-simple, hipaa (agentx migrated to playbooks-ai/agentx/apps/bree-ai)
 *  - Grelin AI: wound-ai, behavioral-health-ai, pain-ai, derm-ai,
 *               dme-ai, enm-ai, urgent-ai (agentx lives in playbooks-ai/agentx/apps/)
 */

// ─── Catalogs ─────────────────────────────────────────────────────────────────

export const CATALOG_CONFIG = [
  {
    id: "bree-ai",
    name: "Bree AI",
    icon: "◈",
    description: "Tax & compliance specialties",
  },
  {
    id: "grelin-ai",
    name: "Grelin AI",
    icon: "⚕",
    description: "Medical specialty playbooks",
  },
] as const;

export type CatalogId = (typeof CATALOG_CONFIG)[number]["id"];

// ─── Specialties ──────────────────────────────────────────────────────────────

export type FlowConfig = {
  id: string;
  name: string;
  description?: string;
};

export type SpecialtyConfig = {
  id: string;
  name: string;
  icon: string;
  app: string;
  baseName: string;
  rulesEngine: boolean;
  catalogId: CatalogId;
  appRoot: string;
  flows?: FlowConfig[];
};

export const SPECIALTY_CONFIG: SpecialtyConfig[] = [
  // ── Bree AI ────────────────────────────────────────────────────────────────
  {
    id: "1040-simple",
    name: "1040 (Simple)",
    icon: "📄",
    app: "playbooks-ai",
    baseName: "1040-simple",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "hipaa",
    name: "HIPAA",
    icon: "🛡️",
    app: "playbooks-ai",
    baseName: "hipaa",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "disability",
    name: "Disability",
    icon: "♿",
    app: "playbooks-ai",
    baseName: "disability",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "ediscovery-compliance",
    name: "eDiscovery Compliance",
    icon: "⚖️",
    app: "playbooks-ai",
    baseName: "ediscovery-compliance",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "aml-kyc",
    name: "AML / KYC",
    icon: "🦹",
    app: "playbooks-ai",
    baseName: "aml-kyc",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "gdpr-breach",
    name: "GDPR Breach",
    icon: "🔒",
    app: "playbooks-ai",
    baseName: "gdpr-breach",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "fmla",
    name: "FMLA",
    icon: "🏥",
    app: "playbooks-ai",
    baseName: "fmla",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "1040-full",
    name: "1040 Full (2025)",
    icon: "📅",
    app: "playbooks-ai",
    baseName: "1040-full",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/bree-ai",
  },
  {
    id: "security-ai",
    name: "Security (OWASP)",
    icon: "🛡️",
    app: "playbooks-ai",
    baseName: "security-ai",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/security-ai",
  },
  {
    id: "math-ai",
    name: "Math AI",
    icon: "🔢",
    app: "playbooks-ai",
    baseName: "math-ai",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/math-ai",
  },
  {
    id: "drumming-rudiments",
    name: "Drumming Rudiments",
    icon: "🥁",
    app: "playbooks-ai",
    baseName: "drumming-rudiments",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/drumming-rudiments",
  },
  {
    id: "pen-testing",
    name: "Pen-Testing",
    icon: "🔓",
    app: "playbooks-ai",
    baseName: "pen-testing",
    rulesEngine: false,
    catalogId: "bree-ai",
    appRoot: "playbooks-ai/agentx/apps/pen-testing",
  },

  // ── Grelin AI ──────────────────────────────────────────────────────────────
  {
    id: "wound-ai",
    name: "Wound Care",
    icon: "🩹",
    app: "playbooks-ai",
    baseName: "wound-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/wound-ai",
  },
  {
    id: "enm-ai",
    name: "E&M Coding",
    icon: "🏥",
    app: "playbooks-ai",
    baseName: "enm-ai",
    rulesEngine: true,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/enm-ai",
    flows: [
      { id: "mdm-level", name: "MDM Level Selection" },
      { id: "snf-support", name: "SNF Support (99309)" },
    ],
  },
  {
    id: "pain-ai",
    name: "Pain Management",
    icon: "💊",
    app: "playbooks-ai",
    baseName: "pain-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/pain-ai",
  },
  {
    id: "derm-ai",
    name: "Dermatology",
    icon: "🔬",
    app: "playbooks-ai",
    baseName: "derm-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/derm-ai",
  },
  {
    id: "behavioral-health-ai",
    name: "Behavioral Health",
    icon: "🧠",
    app: "playbooks-ai",
    baseName: "behavioral-health-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/behavioral-health-ai",
  },
  {
    id: "dme-ai",
    name: "DME",
    icon: "🦽",
    app: "playbooks-ai",
    baseName: "dme-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/dme-ai",
  },
  {
    id: "urgent-ai",
    name: "Urgent Care",
    icon: "🚑",
    app: "playbooks-ai",
    baseName: "urgent-ai",
    rulesEngine: false,
    catalogId: "grelin-ai",
    appRoot: "playbooks-ai/agentx/apps/urgent-ai",
  },
];

export type SpecialtyId = (typeof SPECIALTY_CONFIG)[number]["id"];
