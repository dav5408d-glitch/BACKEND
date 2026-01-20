"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRouter = void 0;
const intentAnalyzer_service_1 = require("./intentAnalyzer.service");
const promptOptimizer_service_1 = require("./promptOptimizer.service");
class AIRouter {
    constructor() {
        this.intentAnalyzer = new intentAnalyzer_service_1.IntentAnalyzer();
        this.promptOptimizer = new promptOptimizer_service_1.PromptOptimizer();
    }
    async processMessage(message, conversationHistory = [], userPlan = 'FREE', hasImage = false) {
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
    selectBestAI(intent, userPlan, hasImage) {
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
                if (userPlan === 'ELITE')
                    return { aiName: 'Claude', providerKey: 'claude' };
                if (userPlan === 'PRO')
                    return { aiName: 'OpenAI', providerKey: 'openai' };
                return { aiName: 'DeepSeek', providerKey: 'deepseek' };
            case 'creative':
                if (userPlan === 'ELITE')
                    return { aiName: 'GPT-4', providerKey: 'openai' };
                if (userPlan === 'PRO')
                    return { aiName: 'Claude', providerKey: 'claude' };
                return { aiName: 'Cohere', providerKey: 'cohere' };
            case 'analysis':
                if (userPlan === 'ELITE')
                    return { aiName: 'Claude', providerKey: 'claude' };
                if (userPlan === 'PRO')
                    return { aiName: 'DeepSeek', providerKey: 'deepseek' };
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
    getAvailableAIsForPlan(userPlan) {
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
exports.AIRouter = AIRouter;
