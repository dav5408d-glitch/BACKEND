import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class GeminiConnector implements AIConnector {
  name = 'gemini';
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
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

      const response = await axios.post(
        `${this.baseURL}?key=${apiKey}`,
        {
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
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
      const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 420;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: 'gemini-pro'
      };
    } catch (error: any) {
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

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    // Gemini pricing: $0.00075 per 1K input tokens, $0.003 per 1K output tokens
    // Average estimate: $0.0025 per request
    const costPerThousandTokens = 0.0025;
    return (tokensUsed / 1000) * costPerThousandTokens;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      
      if (!apiKey) {
        return false;
      }

      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          timeout: 10000,
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const geminiConnector = new GeminiConnector();
