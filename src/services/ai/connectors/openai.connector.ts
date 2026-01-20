import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class OpenAIConnector implements AIConnector {
  name = 'openai';
  private baseURL = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-4o-mini';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    try {
      // Load API key dynamically each time
      const apiKey = process.env.OPENAI_API_KEY || '';
      
      // Si pas de clé API, retourner une réponse mock
      if (!apiKey) {
        console.warn('OPENAI_API_KEY not configured, using mock response');
        return {
          content: `OpenAI (Mock) response: ${prompt}`,
          tokensUsed: 350,
          costUSD: 0.02,
          model: this.model
        };
      }

      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 30000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || 'No response from OpenAI';
      const tokensUsed = response.data?.usage?.total_tokens || 350;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: this.model
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      
      // Fallback to mock response on error
      return {
        content: `OpenAI (Fallback): ${prompt.substring(0, 100)}...`,
        tokensUsed: 350,
        costUSD: 0.02,
        model: this.model
      };
    }
  }

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    // Simplified estimate: $0.02 per request average
    return Math.max(tokensUsed * 0.00002, 0.001);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENAI_API_KEY || '';
      
      if (!apiKey) {
        return false;
      }

      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000,
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const openaiConnector = new OpenAIConnector();
