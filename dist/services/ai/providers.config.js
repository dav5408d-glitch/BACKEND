"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS = void 0;
const deepseek_connector_1 = require("./connectors/deepseek.connector");
const claude_connector_1 = require("./connectors/claude.connector");
const openai_connector_1 = require("./connectors/openai.connector");
const cohere_connector_1 = require("./connectors/cohere.connector");
const huggingface_connector_1 = require("./connectors/huggingface.connector");
const azureOpenAI_connector_1 = require("./connectors/azureOpenAI.connector");
const googlePaLM_connector_1 = require("./connectors/googlePaLM.connector");
const mistral_connector_1 = require("./connectors/mistral.connector");
const gemini_connector_1 = require("./connectors/gemini.connector");
const demo_connector_1 = require("./connectors/demo.connector");
const ensurePrice = (cost) => {
    // ensure at least 30% profit
    const price = Math.max(cost * 1.3, cost + 0.0001);
    // round to 5 decimals
    return Math.round(price * 100000) / 100000;
};
exports.PROVIDERS = [
    {
        key: 'deepseek',
        name: 'DeepSeek',
        connector: deepseek_connector_1.deepseekConnector,
        tier: 'low',
        quality: 5,
        costUSD: 0.005,
        priceUSD: ensurePrice(0.005)
    },
    {
        key: 'huggingface',
        name: 'HuggingFace',
        connector: huggingface_connector_1.huggingfaceConnector,
        tier: 'low',
        quality: 4,
        costUSD: 0.006,
        priceUSD: ensurePrice(0.006)
    },
    {
        key: 'cohere',
        name: 'Cohere',
        connector: cohere_connector_1.cohereConnector,
        tier: 'mid',
        quality: 6,
        costUSD: 0.008,
        priceUSD: ensurePrice(0.008)
    },
    {
        key: 'claude',
        name: 'Anthropic Claude',
        connector: claude_connector_1.claudeConnector,
        tier: 'mid',
        quality: 8,
        costUSD: 0.01,
        priceUSD: ensurePrice(0.01)
    },
    {
        key: 'mistral',
        name: 'Mistral',
        connector: mistral_connector_1.mistralConnector,
        tier: 'mid',
        quality: 7,
        costUSD: 0.015,
        priceUSD: ensurePrice(0.015)
    },
    {
        key: 'openai',
        name: 'OpenAI (GPT)',
        connector: openai_connector_1.openaiConnector,
        tier: 'low',
        quality: 9,
        costUSD: 0.02,
        priceUSD: ensurePrice(0.02)
    },
    {
        key: 'azure_openai',
        name: 'Azure OpenAI',
        connector: azureOpenAI_connector_1.azureOpenAIConnector,
        tier: 'high',
        quality: 9,
        costUSD: 0.018,
        priceUSD: ensurePrice(0.018)
    },
    {
        key: 'google_palm',
        name: 'Google PaLM',
        connector: googlePaLM_connector_1.googlePaLMConnector,
        tier: 'high',
        quality: 9,
        costUSD: 0.03,
        priceUSD: ensurePrice(0.03)
    },
    {
        key: 'gemini',
        name: 'Google Gemini',
        connector: gemini_connector_1.geminiConnector,
        tier: 'high',
        quality: 8.5,
        costUSD: 0.0025,
        priceUSD: ensurePrice(0.0025)
    },
    {
        key: 'demo',
        name: 'Demo Mode',
        connector: demo_connector_1.demoConnector,
        tier: 'low',
        quality: 3,
        costUSD: 0.0001,
        priceUSD: ensurePrice(0.0001)
    }
];
