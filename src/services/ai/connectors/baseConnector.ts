export interface AIResponse {
  content: string;
  tokensUsed: number;
  costUSD: number;
  model: string;
}

export interface AIConnector {
  name: string;
  generateResponse(prompt: string): Promise<AIResponse>;
}
