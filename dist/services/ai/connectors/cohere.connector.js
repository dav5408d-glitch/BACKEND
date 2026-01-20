"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cohereConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class CohereConnector {
    constructor() {
        this.name = 'cohere';
        this.baseURL = 'https://api.cohere.ai/v1/chat';
        this.model = 'command-r-plus';
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            const apiKey = process.env.COHERE_API_KEY || '';
            if (!apiKey) {
                console.warn('COHERE_API_KEY not configured, using mock response');
                return {
                    content: `Cohere (Mock) response: ${prompt}`,
                    tokensUsed: 220,
                    costUSD: 0.008,
                    model: this.model
                };
            }
            const response = await axios_1.default.post(this.baseURL, {
                model: this.model,
                message: prompt,
                max_tokens: 2048,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 30000,
            });
            const content = response.data?.text || 'No response from Cohere';
            const tokensUsed = response.data?.token_count?.output_tokens || 220;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: this.model
            };
        }
        catch (error) {
            console.error('Cohere API Error:', error.response?.data || error.message);
            return {
                content: `Cohere (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 220,
                costUSD: 0.008,
                model: this.model
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        return Math.max(tokensUsed * 0.000002, 0.001);
    }
}
exports.cohereConnector = new CohereConnector();
