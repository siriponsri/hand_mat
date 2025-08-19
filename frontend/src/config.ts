// Re-export from new location for compatibility
export * from './shared/config/app';

// Import individual configs for aggregate
import { 
  DETECT, 
  MIRROR, 
  CAPTURE, 
  TARGET, 
  EXPORT, 
  FEED, 
  DATASET, 
  STORAGE_KEYS 
} from './shared/config/app';

// Aggregate CONFIG for convenient single import
export const CONFIG = {
  DETECT,
  MIRROR,
  CAPTURE,
  TARGET,
  EXPORT,
  FEED,
  DATASET,
  STORAGE_KEYS,
} as const;

export type AppConfig = typeof CONFIG;