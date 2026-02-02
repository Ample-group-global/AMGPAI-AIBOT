export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Gemini API (優先使用)
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiApiUrl: process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  // Fallback: Claude API (備案)
  claudeApiKey: process.env.ANTHROPIC_API_KEY || "",
  claudeApiUrl: process.env.ANTHROPIC_API_URL || "https://api.anthropic.com",
  // Legacy: Forge/OpenAI API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || process.env.OPENAI_API_URL || "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || process.env.OPENAI_API_KEY || "",
};
