"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureOpenAIConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class AzureOpenAIConnector {
    constructor() {
        this.name = 'azure_openai';
        this.deploymentName = 'gpt-4-deployment';
        // Don't load credentials here - load them dynamically in generateResponse
    }
    async generateResponse(prompt) {
        try {
            const apiKey = process.env.AZURE_OPENAI_API_KEY || '';
            const baseURL = process.env.AZURE_OPENAI_ENDPOINT || 'https://your-resource.openai.azure.com';
            if (!apiKey || baseURL === 'https://your-resource.openai.azure.com') {
                console.warn('AZURE_OPENAI credentials not configured, using mock response');
                return {
                    content: `Azure OpenAI (Mock) response: ${prompt}`,
                    tokensUsed: 320,
                    costUSD: 0.018,
                    model: 'gpt-4-deployment'
                };
            }
            const url = `${baseURL}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
            const response = await axios_1.default.post(url, {
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
                    'api-key': apiKey
                },
                timeout: 30000,
            });
            const content = response.data?.choices?.[0]?.message?.content || 'No response from Azure OpenAI';
            const tokensUsed = response.data?.usage?.total_tokens || 320;
            const costUSD = this.calculateCost(tokensUsed);
            return {
                content,
                tokensUsed,
                costUSD,
                model: this.deploymentName
            };
        }
        catch (error) {
            console.error('Azure OpenAI API Error:', error.response?.data || error.message);
            return {
                content: `Azure OpenAI (Fallback): ${prompt.substring(0, 100)}...`,
                tokensUsed: 320,
                costUSD: 0.018,
                model: this.deploymentName
            };
        }
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
    calculateCost(tokensUsed) {
        return Math.max(tokensUsed * 0.000005, 0.001);
    }
}
exports.azureOpenAIConnector = new AzureOpenAIConnector();
