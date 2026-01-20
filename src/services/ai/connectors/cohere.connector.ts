import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class CohereConnector implements AIConnector {
  name = 'cohere';
  private baseURL = 'https://api.cohere.ai/v1/chat';
  private model = 'command-r-plus';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
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

      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          message: prompt,
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

      const content = response.data?.text || 'No response from Cohere';
      const tokensUsed = response.data?.token_count?.output_tokens || 220;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: this.model
      };
    } catch (error: any) {
      console.error('Cohere API Error:', error.response?.data || error.message);
      return {
        content: `Cohere (Fallback): ${prompt.substring(0, 100)}...`,
        tokensUsed: 220,
        costUSD: 0.008,
        model: this.model
      };
    }
  }

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    return Math.max(tokensUsed * 0.000002, 0.001);
  }
}

export const cohereConnector = new CohereConnector();
