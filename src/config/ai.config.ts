export const AIConfig = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    enabled: true
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    enabled: true
  },
  
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    enabled: true
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    enabled: true
  }
};

export function validateAIConfig() {
  const errors: string[] = [];
  
  if (!AIConfig.deepseek.apiKey && AIConfig.deepseek.enabled) {
    errors.push('DEEPSEEK_API_KEY manquante');
  }
  
  if (!AIConfig.claude.apiKey && AIConfig.claude.enabled) {
    errors.push('CLAUDE_API_KEY manquante');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️  Clés API manquantes:', errors);
    console.warn('Le système utilisera des réponses simulées.');
  }
  
  return errors.length === 0;
}