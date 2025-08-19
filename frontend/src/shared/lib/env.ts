import { z } from 'zod';

// Environment schema with validation
const envSchema = z.object({
  // Public environment variables (exposed to client)
  VITE_APP_NAME: z.string().default('HandMat'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:5000'),
  VITE_DEBUG_MODE: z.coerce.boolean().default(false),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Feature flags
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  VITE_ENABLE_TELEMETRY: z.coerce.boolean().default(false),
  
  // Development
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MODE: z.string().default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function parseEnv(): Env {
  try {
    return envSchema.parse({
      // Vite environment variables
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
      VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_TELEMETRY: import.meta.env.VITE_ENABLE_TELEMETRY,
      
      // Build environment
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => issue.path.join('.')).join(', ');
      throw new Error(
        `❌ Invalid environment configuration:\n${error.issues
          .map(issue => `  • ${issue.path.join('.')}: ${issue.message}`)
          .join('\n')}\n\nMissing or invalid: ${missingVars}\n\nPlease check your .env file and ensure all required variables are set correctly.`
      );
    }
    throw error;
  }
}

// Export validated environment
export const env = parseEnv();

// Helper to check if we're in development
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Debug logger (only in development)
export const debugLog = (...args: unknown[]) => {
  if (env.VITE_DEBUG_MODE && isDev) {
    console.log('[DEBUG]', ...args);
  }
};

// API URL helper
export const getApiUrl = (path: string = '') => {
  const baseUrl = env.VITE_API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};