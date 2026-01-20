import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class HuggingFaceConnector implements AIConnector {
  name = 'huggingface';
  private baseURL = 'https://router.huggingface.co/openai/v1/chat/completions';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    try {
      const apiKey = process.env.HUGGINGFACE_API_KEY || '';
      
      if (!apiKey) {
        console.warn('HUGGINGFACE_API_KEY not configured, using mock response');
        return {
          content: `HuggingFace (Mock) response: ${prompt}`,
          tokensUsed: 180,
          costUSD: 0.006,
          model: 'mistral-7b-instruct'
        };
      }

      const response = await axios.post(
        this.baseURL,
        {
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

      const content = response.data?.choices?.[0]?.message?.content || 'No response from HuggingFace';
      const tokensUsed = response.data?.usage?.total_tokens || 180;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: 'mistral-7b-instruct'
      };
    } catch (error: any) {
      console.error('HuggingFace API Error:', error.response?.data || error.message);
      return {
        content: `HuggingFace (Fallback): ${prompt.substring(0, 100)}...`,
        tokensUsed: 180,
        costUSD: 0.006,
        model: 'mistral-7b-instruct'
      };
    }
  }

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    return Math.max(tokensUsed * 0.0000015, 0.001);
  }
}

export const huggingfaceConnector = new HuggingFaceConnector();
