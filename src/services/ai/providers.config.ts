import { AIConnector } from './connectors/baseConnector';
import { deepseekConnector } from './connectors/deepseek.connector';
import { claudeConnector } from './connectors/claude.connector';
import { openaiConnector } from './connectors/openai.connector';
import { cohereConnector } from './connectors/cohere.connector';
import { huggingfaceConnector } from './connectors/huggingface.connector';
import { azureOpenAIConnector } from './connectors/azureOpenAI.connector';
import { googlePaLMConnector } from './connectors/googlePaLM.connector';
import { mistralConnector } from './connectors/mistral.connector';
import { geminiConnector } from './connectors/gemini.connector';
import { demoConnector } from './connectors/demo.connector';

export type Tier = 'low' | 'mid' | 'high';

export interface ProviderConfig {
  key: string;
  name: string;
  connector: AIConnector;
  tier: Tier;
  quality: number; // 1..10, higher == better
  costUSD: number; // estimated cost per request
  priceUSD: number; // price to charge per request (ensures >=30% profit)
}

const ensurePrice = (cost: number) => {
  // ensure at least 30% profit
  const price = Math.max(cost * 1.3, cost + 0.0001);
  // round to 5 decimals
  return Math.round(price * 100000) / 100000;
};

export const PROVIDERS: ProviderConfig[] = [
  {
    key: 'deepseek',
    name: 'DeepSeek',
    connector: deepseekConnector,
    tier: 'low',
    quality: 5,
    costUSD: 0.005,
    priceUSD: ensurePrice(0.005)
  },
  {
    key: 'huggingface',
    name: 'HuggingFace',
    connector: huggingfaceConnector,
    tier: 'low',
    quality: 4,
    costUSD: 0.006,
    priceUSD: ensurePrice(0.006)
  },
  {
    key: 'cohere',
    name: 'Cohere',
    connector: cohereConnector,
    tier: 'mid',
    quality: 6,
    costUSD: 0.008,
    priceUSD: ensurePrice(0.008)
  },
  {
    key: 'claude',
    name: 'Anthropic Claude',
    connector: claudeConnector,
    tier: 'mid',
    quality: 8,
    costUSD: 0.01,
    priceUSD: ensurePrice(0.01)
  },
  {
    key: 'mistral',
    name: 'Mistral',
    connector: mistralConnector,
    tier: 'mid',
    quality: 7,
    costUSD: 0.015,
    priceUSD: ensurePrice(0.015)
  },
  {
    key: 'openai',
    name: 'OpenAI (GPT)',
    connector: openaiConnector,
    tier: 'low',
    quality: 9,
    costUSD: 0.02,
    priceUSD: ensurePrice(0.02)
  },
  {
    key: 'azure_openai',
    name: 'Azure OpenAI',
    connector: azureOpenAIConnector,
    tier: 'high',
    quality: 9,
    costUSD: 0.018,
    priceUSD: ensurePrice(0.018)
  },
  {
    key: 'google_palm',
    name: 'Google PaLM',
    connector: googlePaLMConnector,
    tier: 'high',
    quality: 9,
    costUSD: 0.03,
    priceUSD: ensurePrice(0.03)
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    connector: geminiConnector,
    tier: 'high',
    quality: 8.5,
    costUSD: 0.0025,
    priceUSD: ensurePrice(0.0025)
  },
  {
    key: 'demo',
    name: 'Demo Mode',
    connector: demoConnector,
    tier: 'low',
    quality: 3,
    costUSD: 0.0001,
    priceUSD: ensurePrice(0.0001)
  }
];
