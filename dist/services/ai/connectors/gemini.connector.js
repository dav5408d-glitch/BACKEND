"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class GeminiConnector {
    constructor() {
        this.name = 'gemini';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            // Load API key dynamically each time
            const apiKey = process.env.GEMINI_API_KEY || '';
            // Si pas de clé API, retourner une réponse mock
            if (!apiKey) {
                console.warn('GEMINI_API_KEY not configured, using mock response');
                return {
                    content: `Gemini (Mock) response: ${prompt}`,
                    tokensUsed: 420,
                    costUSD: 0.0025,
                    model: 'gemini-pro'
                };
            }
            const response = await axios_1.default.post(`${this.baseURL}?key=${apiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                    topP: 0.9,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
            const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 420;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: 'gemini-pro'
            };
        }
        catch (error) {
            console.error('Gemini API Error:', error.response?.data || error.message);
            // Fallback to mock response on error
            return {
                content: `Gemini (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 420,
                costUSD: 0.0025,
                model: 'gemini-pro'
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        // Gemini pricing: $0.00075 per 1K input tokens, $0.003 per 1K output tokens
        // Average estimate: $0.0025 per request
        const costPerThousandTokens = 0.0025;
        return (tokensUsed / 1000) * costPerThousandTokens;
    }
    async checkHealth() {
        try {
            const apiKey = process.env.GEMINI_API_KEY || '';
            if (!apiKey) {
                return false;
            }
            const response = await axios_1.default.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                timeout: 10000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.geminiConnector = new GeminiConnector();
