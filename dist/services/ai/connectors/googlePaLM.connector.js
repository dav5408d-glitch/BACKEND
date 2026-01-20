"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googlePaLMConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class GooglePaLMConnector {
    constructor() {
        this.name = 'google_palm';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        // Don't load API key here - load it dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            const apiKey = process.env.GOOGLE_PALM_API_KEY || '';
            if (!apiKey) {
                console.warn('GOOGLE_PALM_API_KEY not configured, using mock response');
                return {
                    content: `Google PaLM (Mock) response: ${prompt}`,
                    tokensUsed: 400,
                    costUSD: 0.03,
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
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                    topP: 0.9,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Google PaLM';
            const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 400;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: 'gemini-pro'
            };
        }
        catch (error) {
            console.error('Google PaLM API Error:', error.response?.data || error.message);
            return {
                content: `Google PaLM (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 400,
                costUSD: 0.03,
                model: 'gemini-pro'
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        return Math.max(tokensUsed * 0.0000075, 0.001);
    }
}
exports.googlePaLMConnector = new GooglePaLMConnector();
