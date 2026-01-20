"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepseekConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class DeepSeekConnector {
    constructor() {
        this.name = 'deepseek';
        this.baseURL = 'https://api.deepseek.com/chat/completions';
        this.model = 'deepseek-chat';
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            // Load API key dynamically each time
            const apiKey = process.env.DEEPSEEK_API_KEY || '';
            if (!apiKey) {
                console.warn('DEEPSEEK_API_KEY not configured, using mock response');
                return {
                    content: `DeepSeek (Mock) response: ${prompt}`,
                    tokensUsed: 300,
                    costUSD: 0.005,
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
            const content = response.data?.choices?.[0]?.message?.content || 'No response from DeepSeek';
            const tokensUsed = response.data?.usage?.total_tokens || 300;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: this.model
            };
        }
        catch (error) {
            console.error('DeepSeek API Error:', error.response?.data || error.message);
            return {
                content: `DeepSeek (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 300,
                costUSD: 0.005,
                model: this.model
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        return Math.max(tokensUsed * 0.000001, 0.001);
    }
}
exports.deepseekConnector = new DeepSeekConnector();
