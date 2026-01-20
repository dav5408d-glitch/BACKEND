import { AIConnector, AIResponse } from './baseConnector';
import axios from 'axios';

class GooglePaLMConnector implements AIConnector {
  name = 'google_palm';
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    // Don't load API key here - load it dynamically in generateResponse
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
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
            maxOutputTokens: 2048,
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

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Google PaLM';
      const tokensUsed = response.data?.usageMetadata?.totalTokenCount || 400;
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
        model: 'gemini-pro'
      };
    } catch (error: any) {
      console.error('Google PaLM API Error:', error.response?.data || error.message);
      return {
        content: `Google PaLM (Fallback): ${prompt.substring(0, 100)}...`,
        tokensUsed: 400,
        costUSD: 0.03,
        model: 'gemini-pro'
      };
    }
  }

  async send(message: string): Promise<string> {
    const response = await this.generateResponse(message);
    return response.content;
  }

  private calculateCost(tokensUsed: number): number {
    return Math.max(tokensUsed * 0.0000075, 0.001);
  }
}

export const googlePaLMConnector = new GooglePaLMConnector();
