import { IntentAnalyzer } from './intentAnalyzer.service';
import { PromptOptimizer } from './promptOptimizer.service';

export interface AIResponse {
  content: string;
  aiUsed: string;
  tokensUsed: number;
  costUSD: number;
  providerKey: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  hasImage?: boolean;
}

export class AIRouter {
  private intentAnalyzer: IntentAnalyzer;
  private promptOptimizer: PromptOptimizer;

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.promptOptimizer = new PromptOptimizer();
  }

  async processMessage(
    message: string,
    conversationHistory: Message[] = [],
    userPlan: string = 'FREE',
    hasImage: boolean = false
  ): Promise<{ aiToUse: string; optimizedPrompt: string; providerKey: string }> {
    
    console.log('Routeur IA - Analyse du message...');
    console.log('Plan utilisateur:', userPlan);

    // 1. Analyser l'intention
    const intent = await this.intentAnalyzer.analyze(message);
    console.log('Intent détecté:', intent.domain, '-', intent.complexity);

    // 2. Optimiser le prompt
    const optResult = this.promptOptimizer.optimize(message, intent);
    const optimizedPrompt = optResult.optimized || message;
    console.log('Prompt optimisé');

    // 3. Sélectionner la meilleure IA
    const { aiName, providerKey } = this.selectBestAI(intent, userPlan, hasImage);
    console.log('IA sélectionnée:', aiName);

    return {
      aiToUse: aiName,
      optimizedPrompt,
      providerKey
    };
  }

  private selectBestAI(
    intent: any,
    userPlan: string,
    hasImage: boolean
  ): { aiName: string; providerKey: string } {
    
    // Get available AIs for plan
    const availableAIs = this.getAvailableAIsForPlan(userPlan);

    // 1. For images: GPT-4 Vision (requires PRO+)
    if (hasImage) {
      if (availableAIs.some(ai => ai.includes('vision'))) {
        return { aiName: 'GPT-4 Vision', providerKey: 'openai-vision' };
      }
      // Fallback
      return { aiName: 'DeepSeek', providerKey: 'deepseek' };
    }

    // 2. By intent and plan
    switch (intent.domain) {
      case 'code':
        if (userPlan === 'ELITE') return { aiName: 'Claude', providerKey: 'claude' };
        if (userPlan === 'PRO') return { aiName: 'OpenAI', providerKey: 'openai' };
        return { aiName: 'DeepSeek', providerKey: 'deepseek' };
      
      case 'creative':
        if (userPlan === 'ELITE') return { aiName: 'GPT-4', providerKey: 'openai' };
        if (userPlan === 'PRO') return { aiName: 'Claude', providerKey: 'claude' };
        return { aiName: 'Cohere', providerKey: 'cohere' };
      
      case 'analysis':
        if (userPlan === 'ELITE') return { aiName: 'Claude', providerKey: 'claude' };
        if (userPlan === 'PRO') return { aiName: 'DeepSeek', providerKey: 'deepseek' };
        return { aiName: 'Cohere', providerKey: 'cohere' };
    }

    // 3. Cost optimization by plan
    if (userPlan === 'BAS') {
      return { aiName: 'DeepSeek', providerKey: 'deepseek' };
    }

    if (userPlan === 'PRO') {
      return { aiName: 'OpenAI', providerKey: 'openai' };
    }

    // ELITE: best quality
    return { aiName: 'Claude', providerKey: 'claude' };
  }

  private getAvailableAIsForPlan(userPlan: string): string[] {
    switch (userPlan) {
      case 'ELITE':
        return ['claude', 'openai', 'openai-vision', 'deepseek', 'cohere', 'huggingface', 'mistral', 'google-palm'];
      case 'PRO':
        return ['openai', 'claude', 'deepseek', 'cohere', 'openai-vision'];
      case 'FREE':
      default:
        return [];
    }
  }
}