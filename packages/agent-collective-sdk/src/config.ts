/**
 * AgentX Configuration Registry
 * Centralized ports and configuration for the collective ecosystem
 */
export const AGENTX_CONFIG = {
  PORTS: {
    COLLECTIVE: 9000,
    ANTIMATTER: 7198,
    RAGSTER: 8898,
    NATS: 4222,
    KATAI_UI: 8769,
    VOODOO: 7199,
    AICTO: 8899,
    RIPCODE: 8897
  },
  BASE_URLS: {
    COLLECTIVE: `http://localhost:9000`,
    ANTIMATTER: `http://localhost:7198`,
    RAGSTER: `http://localhost:8898`,
    KATAI_UI: `http://localhost:8769`
  },
  STORAGE: {
    BASE_DIR: ".agentx"
  }
} as const;

export type AgentXConfigRegistry = typeof AGENTX_CONFIG;
