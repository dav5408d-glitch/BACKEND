"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mistralConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class MistralConnector {
    constructor() {
        this.name = 'mistral';
        this.baseURL = 'https://api.mistral.ai/v1/chat/completions';
        this.model = 'mistral-small-latest'; // Modèle plus rapide
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            const apiKey = process.env.MISTRAL_API_KEY || '';
            console.log('🔍 Mistral - API Key check:', apiKey ? `Configured (length: ${apiKey.length})` : 'NOT configured');
            console.log('🔍 Mistral - API Key value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'EMPTY');
            if (!apiKey) {
                console.warn('MISTRAL_API_KEY not configured, using mock response');
                return {
                    content: `Mistral (Mock) response: ${prompt}`,
                    tokensUsed: 260,
                    costUSD: 0.015,
                    model: this.model
                };
            }
            const response = await axios_1.default.post(this.baseURL, {
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2048,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000,
            });
            const content = response.data?.choices?.[0]?.message?.content || 'No response from Mistral';
            const tokensUsed = response.data?.usage?.total_tokens || 260;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: this.model
            };
        }
        catch (error) {
            console.error('🔴 Mistral API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            return {
                content: `Mistral (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 260,
                costUSD: 0.015,
                model: this.model
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        return Math.max(tokensUsed * 0.0000025, 0.001);
    }
}
exports.mistralConnector = new MistralConnector();
