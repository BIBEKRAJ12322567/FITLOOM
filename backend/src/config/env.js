require('dotenv').config();

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];

for (const key of required) {
  if (!process.env[key]) {
    // Fail fast at boot rather than mysteriously later when the first token is signed.
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 7),
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  isProduction: process.env.NODE_ENV === 'production',
  // Not in `required` — the app boots fine without an AI key, it's only
  // needed at the moment someone calls the workout-generator endpoint, where
  // aiClient.js throws a clear AppError if the chosen provider's key is unset.
  ai: {
    provider: process.env.AI_PROVIDER || 'openai', // 'openai' | 'gemini'
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
};
