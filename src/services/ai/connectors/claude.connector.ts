import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class ClaudeConnector implements AIConnector {
  name = 'claude';
  private baseURL = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-5-sonnet-20241022';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
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

      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000,
        }
      );

      const content = response.data?.content?.[0]?.text || 'No response from Claude';
      const tokensUsed = (response.data?.usage?.input_tokens || 0) + (response.data?.usage?.output_tokens || 0);
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: this.model
      };
    } catch (error: any) {
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

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    // Claude 3.5 Sonnet pricing: $3 per million input tokens, $15 per million output tokens
    // Simplified estimate: $0.01 per request average
    return Math.max(tokensUsed * 0.00001, 0.001);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const apiKey = process.env.CLAUDE_API_KEY || '';
      
      if (!apiKey) {
        return false;
      }

      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000,
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const claudeConnector = new ClaudeConnector();