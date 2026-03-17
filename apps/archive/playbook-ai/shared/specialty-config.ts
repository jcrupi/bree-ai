/**
 * Central specialty configuration — Playbook Catalogs.
 * Used by playbook-loader (server) and playbookx CLI.
 *
 * Catalogs group specialties by platform origin:
 *  - Bree AI:   1040-simple, hipaa (agentx lives in playbook-ai/)
 *  - Grelin AI: wound-ai, behavioral-health-ai, pain-ai, derm-ai,
 *               dme-ai, enm-ai, urgent-ai (agentx lives in ai-playbooks/)
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

export const SPECIALTY_CONFIG = [
  // ── Bree AI ────────────────────────────────────────────────────────────────
  {
    id: "1040-simple",
    name: "1040 (Simple)",
    icon: "📄",
    app: "playbook-ai",
    baseName: "1040-simple",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    // appRoot is relative to apps/; loader appends /playbook → apps/playbook-ai/agentx/playbook/
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "hipaa",
    name: "HIPAA",
    icon: "🛡️",
    app: "playbook-ai",
    baseName: "hipaa",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "disability",
    name: "Disability",
    icon: "♿",
    app: "playbook-ai",
    baseName: "disability",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "ediscovery-compliance",
    name: "eDiscovery Compliance",
    icon: "⚖️",
    app: "playbook-ai",
    baseName: "ediscovery-compliance",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "aml-kyc",
    name: "AML / KYC",
    icon: "🦹",
    app: "playbook-ai",
    baseName: "aml-kyc",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "gdpr-breach",
    name: "GDPR Breach",
    icon: "🔒",
    app: "playbook-ai",
    baseName: "gdpr-breach",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "fmla",
    name: "FMLA",
    icon: "🏥",
    app: "playbook-ai",
    baseName: "fmla",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },
  {
    id: "1040-full",
    name: "1040 Full (2025)",
    icon: "📅",
    app: "playbook-ai",
    baseName: "1040-full",
    rulesEngine: false,
    catalogId: "bree-ai" as CatalogId,
    appRoot: "playbook-ai/agentx",
  },

  // ── Grelin AI ──────────────────────────────────────────────────────────────
  {
    id: "wound-ai",
    name: "Wound Care",
    icon: "🩹",
    app: "wound-ai",
    baseName: "wound-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    // agentx lives in ai-playbooks/agentx/apps/wound-ai/playbook/
    appRoot: "ai-playbooks/agentx/apps/wound-ai",
  },
  {
    id: "behavioral-health-ai",
    name: "Behavioral Health",
    icon: "🧠",
    app: "behavioral-health-ai",
    baseName: "behavioral-health-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/behavioral-health-ai",
  },
  {
    id: "pain-ai",
    name: "Pain Management",
    icon: "💊",
    app: "pain-ai",
    baseName: "pain-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/pain-ai",
  },
  {
    id: "derm-ai",
    name: "Dermatology",
    icon: "🔬",
    app: "derm-ai",
    baseName: "derm-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/derm-ai",
  },
  {
    id: "dme-ai",
    name: "DME",
    icon: "🦽",
    app: "dme-ai",
    baseName: "dme-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/dme-ai",
  },
  {
    id: "enm-ai",
    name: "E&M Coding",
    icon: "🏥",
    app: "enm-ai",
    baseName: "enm-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/enm-ai",
  },
  {
    id: "urgent-ai",
    name: "Urgent Care",
    icon: "🚑",
    app: "urgent-ai",
    baseName: "urgent-ai",
    rulesEngine: false,
    catalogId: "grelin-ai" as CatalogId,
    appRoot: "ai-playbooks/agentx/apps/urgent-ai",
  },
] as const;

export type SpecialtyId = (typeof SPECIALTY_CONFIG)[number]["id"];

