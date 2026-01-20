# How to Add New AI Providers to SYNAPSE AI

This guide explains how to integrate new AI providers (OpenAI, Claude, DeepSeek, etc.) into SYNAPSE AI.

## Overview

SYNAPSE AI uses a **connector-based architecture** for AI providers. Each provider has:
- A **connector** (handles API calls)
- A **configuration entry** (metadata: cost, tier, quality)
- **Router integration** (automatic selection by user plan)

## Step 1: Create a Connector

Create a new file in `backend/src/services/ai/connectors/`:

```bash
# Example: creating a new provider connector
# File: backend/src/services/ai/connectors/anthropic.connector.ts
```

### Connector Template

```typescript
// backend/src/services/ai/connectors/yourprovider.connector.ts

import axios from 'axios';

export interface AIConnectorResponse {
  content: string;
  tokensUsed: number;
  costUSD: number;
}

export class YourProviderConnector {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.YOURPROVIDER_API_KEY || '';
    this.baseURL = 'https://api.yourprovider.com/v1';
    
    if (!this.apiKey) {
      throw new Error('YOURPROVIDER_API_KEY is required');
    }
  }

  /**
   * Send request to your provider's API
   */
  async generateResponse(prompt: string): Promise<AIConnectorResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/completions`,
        {
          model: 'your-model-name',
          prompt: prompt,
          max_tokens: 2000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Parse response according to your provider's format
      const content = response.data.choices?.[0]?.text || 'No response';
      const tokensUsed = response.data.usage?.total_tokens || 0;
      
      // Calculate cost based on token usage
      const costUSD = this.calculateCost(tokensUsed);

      return {
        content,
        tokensUsed,
        costUSD,
      };
    } catch (error) {
      console.error('YourProvider API Error:', error);
      throw new Error('Failed to generate response from YourProvider');
    }
  }

  /**
   * Calculate cost based on your provider's pricing
   * Example: OpenAI GPT-4: $0.03 per 1K input tokens + $0.06 per 1K output tokens
   */
  private calculateCost(tokensUsed: number): number {
    // Adjust these values to match your provider's pricing
    const costPerThousandTokens = 0.02;
    return (tokensUsed / 1000) * costPerThousandTokens;
  }

  /**
   * Optional: Check API health/credentials
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseURL}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const yourProviderConnector = new YourProviderConnector();
```

## Step 2: Add Provider Configuration

Edit `backend/src/services/ai/providers.config.ts`:

```typescript
export const PROVIDERS = [
  // ... existing providers ...

  {
    key: 'yourprovider',
    name: 'Your Provider',
    connector: yourProviderConnector,
    tier: 'mid',                    // 'low' | 'mid' | 'high'
    quality: 7.5,                   // 0-10 scale
    costUSD: 0.0015,                // Cost per request
    priceUSD: 0.003,                // Price charged to user (must be ≥ 30% margin)
    description: 'Great for general tasks',
    capabilities: ['text', 'context-aware'],
    languages: ['en', 'fr', 'de'],
    maxTokens: 4096,
    responseTime: 'fast'            // 'fast' | 'medium' | 'slow'
  }
];
```

### Pricing Rules

- **costUSD**: Actual cost to call the provider's API
- **priceUSD**: Price charged to users (with 30% minimum margin for business profit)
- **Formula**: `priceUSD >= costUSD * 1.3`

Example:
```
Provider cost: $0.001 per request
Min price: $0.001 * 1.3 = $0.0013
Recommended price: $0.002 (100% margin)
```

## Step 3: Update the Router

The router automatically selects providers based on:
1. **User Plan** (FREE, BAS, PRO, ELITE)
2. **Intent Complexity** (low, medium, high)
3. **Cost Optimization** (cheaper for FREE/BAS, quality for PRO/ELITE)

Edit `backend/src/services/ai/router.service.ts` to add routing rules:

```typescript
private selectBestAI(intent: Intent, userPlan: string): { aiName: string; providerKey: string } {
  
  // Example: For code, prioritize Claude for ELITE users
  if (intent.domain === 'code' && userPlan === 'ELITE') {
    return { aiName: 'Claude', providerKey: 'claude' };
  }

  // Example: For creative writing, use GPT-4 for PRO+
  if (intent.domain === 'creative' && ['PRO', 'ELITE'].includes(userPlan)) {
    return { aiName: 'GPT-4', providerKey: 'openai' };
  }

  // Default: cheapest option for BAS/FREE
  return { aiName: 'DeepSeek', providerKey: 'deepseek' };
}
```

## Step 4: Set Environment Variables

Add your provider's API key to `.env`:

```bash
# .env
YOURPROVIDER_API_KEY=sk_xxxxxxxxxxxx
```

Never commit `.env` files. Use `.env.example` for templates:

```bash
# .env.example
YOURPROVIDER_API_KEY=your_api_key_here
OPENAI_API_KEY=sk_xxxxxxxxxxxx
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
```

## Step 5: Test the Integration

### Test the connector directly:

```typescript
// backend/src/services/ai/connectors/__tests__/yourprovider.test.ts

import { yourProviderConnector } from '../yourprovider.connector';

async function testConnector() {
  try {
    const response = await yourProviderConnector.generateResponse(
      'Hello, what is 2+2?'
    );
    console.log('Response:', response);
    console.log('Cost:', response.costUSD);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnector();
```

### Test the routing:

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Write Python code for a hello world"}'
```

## Step 6: Add to Chat Controller

Update `backend/src/controllers/chat.controller.ts` to use the new connector:

```typescript
const response = await routerService.processMessage(
  message,
  conversationHistory,
  userPlan,
  hasImage
);

// The router automatically calls the right connector
```

## Complete Example: Adding OpenAI GPT-4

### 1. Create Connector

```typescript
// backend/src/services/ai/connectors/openai.connector.ts
import axios from 'axios';

export class OpenAIConnector {
  private apiKey = process.env.OPENAI_API_KEY;
  private baseURL = 'https://api.openai.com/v1';

  async generateResponse(prompt: string): Promise<AIConnectorResponse> {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      costUSD: this.calculateCost(response.data.usage.total_tokens),
    };
  }

  private calculateCost(tokens: number): number {
    // GPT-4: $0.03 per 1K input, $0.06 per 1K output (approximate)
    return (tokens / 1000) * 0.045;
  }
}
```

### 2. Add to Providers Config

```typescript
{
  key: 'openai',
  name: 'OpenAI GPT-4',
  connector: new OpenAIConnector(),
  tier: 'high',
  quality: 9.0,
  costUSD: 0.002,
  priceUSD: 0.005,
  description: 'State-of-the-art reasoning and code',
}
```

### 3. Set Environment Variable

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### 4. Test

```bash
# User with ELITE plan can now access GPT-4
curl -X POST http://localhost:3002/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Write a React component"}'
```

## Troubleshooting

### "API Key is required" error
- Check `.env` file has the correct key name
- Restart backend after adding env var
- Verify API key is not empty/invalid

### "Failed to generate response" error
- Check API endpoint is correct
- Verify authentication headers
- Test API key directly with provider's CLI/API
- Check rate limits haven't been exceeded
- Ensure request format matches provider's specification

### Provider not selected by router
- Check provider is in `PROVIDERS` array
- Verify `tier` matches user plan tiers
- Check intent analyzer is working correctly
- Add debug logging in `selectBestAI` function

## Best Practices

1. **Always validate input**: Sanitize prompts before sending to APIs
2. **Handle rate limits**: Implement exponential backoff for retries
3. **Log costs**: Track token usage for billing/analytics
4. **Monitor performance**: Log response times and error rates
5. **Use connection pooling**: Reuse HTTP connections for efficiency
6. **Cache responses**: For identical prompts, return cached responses
7. **Set timeouts**: Prevent hanging requests (e.g., 30 seconds)
8. **Graceful fallbacks**: If primary provider fails, use backup

## Advanced: Custom Provider Tiers

You can create custom tiers for providers:

```typescript
const PROVIDER_TIERS = {
  'low-cost': { maxPrice: 0.001, minQuality: 4 },
  'balanced': { maxPrice: 0.005, minQuality: 6 },
  'premium': { maxPrice: 0.02, minQuality: 8 },
};

// Use in router selection
if (userPlan === 'BAS') {
  availableProviders = filterByTier(PROVIDER_TIERS.balanced);
}
```

## Testing New Providers

Always test before going to production:

```bash
# 1. Test connector in isolation
npm test backend/src/services/ai/connectors/yourprovider.test.ts

# 2. Test router selection
npm test backend/src/services/ai/router.service.test.ts

# 3. Test full chat flow
npm run dev & 
# Make request and check logs
curl -X POST http://localhost:3002/api/chat ...
```

---

**Need help?** Check existing connectors in `backend/src/services/ai/connectors/` for examples.
