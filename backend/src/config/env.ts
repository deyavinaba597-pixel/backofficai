import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Determine which AI provider to use
// AI_PROVIDER=ollama  → local Ollama (dev, free, unlimited)
// AI_PROVIDER=groq    → Groq cloud (production, free tier, 1000 req/day)
const aiProvider = (process.env.AI_PROVIDER || 'ollama') as 'ollama' | 'groq';

export const config = {
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  aiProvider,

  // Ollama — local dev (free, unlimited, no key needed)
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:14b',

  // Groq — production deployment (free tier, needs API key from console.groq.com)
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Resend — email notifications (optional, graceful degradation if not set)
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@backofficai.com',
};

export type Config = typeof config;
