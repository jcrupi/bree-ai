/**
 * Knowledge.ai Multi-Tenant Branding Configuration
 * 
 * This file defines branding for different instances of Knowledge.ai platform.
 * Each instance (KAT.ai, Keen.ai, etc.) has its own branding configuration.
 */

export interface BrandConfig {
  /** Unique identifier for the brand */
  name: string;
  
  /** Display name shown in UI */
  displayName: string;
  
  /** Path to logo image */
  logo: string;
  
  /** Tagline/subtitle */
  tagline: string;
  
  /** Color scheme */
  colors: {
    primary: string;
    accent: string;
    background?: string;
  };
  
  /** Ragster collection configuration */
  collection: {
    orgId: string;
    collectionId: string;
  };
  
  /** Path to custom instructions file (optional) */
  instructionsPath?: string;
  
  /** Show "Powered by Knowledge.ai" footer */
  poweredBy?: boolean;
  
  /** Custom AI name for responses */
  aiName?: string;
}

/**
 * Brand configurations for all instances
 */
export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'bree-ai': {
    name: 'bree-ai',
    displayName: 'Knowledge.ai',
    logo: '/logos/bree-ai.png',
    tagline: 'Intelligent Document Intelligence',
    colors: {
      primary: '#6366f1',  // Indigo
      accent: '#8b5cf6',   // Purple
    },
    collection: {
      orgId: 'knowledge.ai',
      collectionId: 'bree-ai-demo'
    },
    aiName: 'Knowledge.ai',
    poweredBy: false
  },
  
  'kat-ai': {
    name: 'kat-ai',
    displayName: 'KAT.ai',
    logo: '/KATv3.png',  // Keep existing logo path for backward compatibility
    tagline: 'Contract Document Intelligence',
    colors: {
      primary: '#8b5cf6',  // Purple
      accent: '#ec4899',   // Pink
    },
    collection: {
      orgId: 'kat.ai',
      collectionId: import.meta.env.VITE_RAGSTER_DEFAULT_COLLECTION_ID || 'KatAI Collection V1'
    },
    instructionsPath: '/instructions.md',
    aiName: 'KAT.ai',
    poweredBy: true
  },
  
  'habitaware-ai': {
    name: 'habitaware-ai',
    displayName: 'HabitAware.ai',
    logo: '/logos/habitaware-ai.png',
    tagline: 'Empowering Habit Awareness',
    colors: {
      primary: '#D448AA',  // HabitAware Pink
      accent: '#00A99D',   // HabitAware Teal
    },
    collection: {
      orgId: 'habitaware.ai',
      collectionId: 'habitaware-collection'
    },
    instructionsPath: '/instructions/habitaware-ai.md',
    aiName: 'HabitAware Assistant',
    poweredBy: true
  },
  
  'genius-talent': {
    name: 'genius-talent',
    displayName: 'Genius Talent',
    logo: '/logos/genius-talent.png',
    tagline: 'Better Hiring for Recruiters',
    colors: {
      primary: '#f97316',  // Orange
      accent: '#fb923c',   // Light Orange
    },
    collection: {
      orgId: 'genius-talent',
      collectionId: 'genius-talent-v1'
    },
    aiName: 'Genius AI',
    poweredBy: true
  },

  'the-vineyard': {
    name: 'the-vineyard',
    displayName: 'The Vineyard',
    logo: '/logos/the-vineyard.png',
    tagline: 'Agile Project Intelligence',
    colors: {
      primary: '#059669',  // Emerald Green
      accent: '#10b981',   // Light Green
    },
    collection: {
      orgId: 'the-vineyard',
      collectionId: 'the-vineyard-v1'
    },
    aiName: 'Vineyard AI',
    poweredBy: true
  }
};

/**
 * Get the current brand configuration based on environment variable
 * Defaults to 'kat-ai' for backward compatibility
 */
const BRAND_ID = import.meta.env.VITE_BRAND_ID || 'kat-ai';

/**
 * Current active brand configuration
 */
export const currentBrand: BrandConfig = BRAND_CONFIGS[BRAND_ID] || BRAND_CONFIGS['kat-ai'];

/**
 * Helper function to get brand-specific value with fallback
 */
export function getBrandValue<T>(brandValue: T, fallback: T): T {
  return brandValue !== undefined ? brandValue : fallback;
}

/**
 * Get the default collection ID for the current brand
 */
export function getDefaultCollectionId(): string {
  return import.meta.env.VITE_RAGSTER_DEFAULT_COLLECTION_ID || currentBrand.collection.collectionId;
}

/**
 * Get the default org ID for the current brand
 */
export function getDefaultOrgId(): string {
  return import.meta.env.VITE_RAGSTER_DEFAULT_ORG_ID || currentBrand.collection.orgId;
}
