import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class DeepSeekConnector implements AIConnector {
  name = 'deepseek';
  private baseURL = 'https://api.deepseek.com/chat/completions';
  private model = 'deepseek-chat';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
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
          timeout: 60000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || 'No response from DeepSeek';
      const tokensUsed = response.data?.usage?.total_tokens || 300;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: this.model
      };
    } catch (error: any) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      return {
        content: `DeepSeek (Fallback): ${prompt.substring(0, 100)}...`,
        tokensUsed: 300,
        costUSD: 0.005,
        model: this.model
      };
    }
  }

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    return Math.max(tokensUsed * 0.000001, 0.001);
  }
}

export const deepseekConnector = new DeepSeekConnector();
