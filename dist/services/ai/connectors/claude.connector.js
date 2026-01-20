"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class ClaudeConnector {
    constructor() {
        this.name = 'claude';
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-5-sonnet-20241022';
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            // Load API key dynamically each time
            const apiKey = process.env.CLAUDE_API_KEY || '';
            // Si pas de clé API, retourner une réponse mock
            if (!apiKey) {
                console.warn('CLAUDE_API_KEY not configured, using mock response');
                return {
                    content: `Claude (Mock) response: ${prompt}`,
                    tokensUsed: 200,
                    costUSD: 0.01,
                    model: this.model
                };
            }
            const response = await axios_1.default.post(this.baseURL, {
                model: this.model,
                max_tokens: 2048,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000,
            });
            const content = response.data?.content?.[0]?.text || 'No response from Claude';
            const tokensUsed = (response.data?.usage?.input_tokens || 0) + (response.data?.usage?.output_tokens || 0);
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: this.model
            };
        }
        catch (error) {
            console.error('Claude API Error:', error.response?.data || error.message);
            // Fallback to mock response on error
            return {
                content: `Claude (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 200,
                costUSD: 0.01,
                model: this.model
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        // Claude 3.5 Sonnet pricing: $3 per million input tokens, $15 per million output tokens
        // Simplified estimate: $0.01 per request average
        return Math.max(tokensUsed * 0.00001, 0.001);
    }
    async checkHealth() {
        try {
            const apiKey = process.env.CLAUDE_API_KEY || '';
            if (!apiKey) {
                return false;
            }
            const response = await axios_1.default.post(this.baseURL, {
                model: this.model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 60000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.claudeConnector = new ClaudeConnector();
