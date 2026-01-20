# Adding AI Providers to Synapse AI

This document explains how to add a new AI provider (API) to the backend router so the system can select it based on user plan and intent.

Overview
- The backend selects providers using `backend/src/services/ai/providers.config.ts` and `backend/src/services/router.service.ts`.
- Each provider must expose an `AIConnector` interface defined in `backend/src/services/ai/connectors/baseConnector.ts`.
- The router chooses providers by looking at the user's plan (BAS / PRO / ELITE) and the analyzed intent complexity (low / high).
- Pricing must ensure at least 30% profit margin. `providers.config.ts` computes `priceUSD` from `costUSD` using a 1.3 multiplier.

Steps to add a new provider

1. Add a connector implementation

Create a new file in `backend/src/services/ai/connectors/` named `yourProvider.connector.ts`.
Implement the `AIConnector` interface and export a connector instance. Example skeleton:

```ts
import { AIConnector, AIResponse } from './baseConnector';

class YourProviderConnector implements AIConnector {
  name = 'your_provider_key';

  async generateResponse(prompt: string): Promise<AIResponse> {
    // call the provider API here
    // return at minimum: { content, tokensUsed, costUSD, model }
    return {
      content: `YourProvider response: ${prompt}`,
      tokensUsed: 150,
      costUSD: 0.005,
      model: 'your-model-name'
    };
  }

  async send(message: string): Promise<string> {
    const r = await this.generateResponse(message);
    return r.content;
  }
}

export const yourProviderConnector = new YourProviderConnector();
```

Notes:
- In production, implement real HTTP requests, auth headers, error handling, retries and rate limiting.
- Log tokens and cost estimations for billing.

2. Add provider entry to providers.config.ts

Open `backend/src/services/ai/providers.config.ts` and import your connector at the top:

```ts
import { yourProviderConnector } from './connectors/yourProvider.connector';
```

Then add a `ProviderConfig` object to `PROVIDERS` with the following fields:
- `key`: unique key for internal use (e.g. `your_provider`)
- `name`: display name
- `connector`: instance you exported
- `tier`: `low` | `mid` | `high` — used for plan gating (BAS -> low, PRO -> low+mid, ELITE -> all)
- `quality`: integer 1..10 (higher = better for intent routing)
- `costUSD`: estimated average cost per request (used to compute pricing)

Example:

```ts
{
  key: 'your_provider',
  name: 'YourProvider',
  connector: yourProviderConnector,
  tier: 'mid',
  quality: 7,
  costUSD: 0.009,
  priceUSD: ensurePrice(0.009) // keep 30%+ margin
}
```

3. Ensure profit margin

`providers.config.ts` uses `ensurePrice(cost)` to compute `priceUSD = max(cost * 1.3, cost + tiny)`. If you want a larger margin, increase the multiplier or manually set `priceUSD`.

4. Update router behavior (optional)

The router selects providers using `intent.complexity`:
- `high` complexity → picks allowed provider with highest `quality`.
- `low` complexity → picks allowed provider with lowest `priceUSD`.

If you want to change selection logic (for example add latency or regional constraints), modify `backend/src/services/router.service.ts`.

5. Testing

- Start backend:

```bash
cd backend
npm run dev
```

- Call chat endpoint with a valid JWT token (login/register endpoints exist):

```bash
curl -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'
# use returned token in Authorization header for /api/chat
curl -X POST http://localhost:3002/api/chat -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"message":"Hello"}'
```

The response JSON will include `aiUsed`, `providerKey`, `costUSD` and `chargedUSD` fields.

6. Frontend integration

- The router runs on the backend; the frontend simply calls `/api/chat`.
- If you want client-side routing/selection, implement similar logic in `frontend` and call connectors directly (requires embedding keys, not recommended).

Security and production concerns
- Never embed API keys in the frontend.
- Validate and sanitize prompts server-side.
- Add rate limits and quota tracking per user plan.
- Persist provider usage and costs if you plan to bill users based on usage.
- Implement webhooks from payment provider to update plan server-side.

If you want, I can:
- Add real HTTP implementations for one provider (e.g., OpenAI) using environment variables for keys.
- Add quota tracking and per-request cost accounting into the database.

---

Change log
- Added skeleton connector pattern and `providers.config.ts`.
- Router selects provider by plan and intent complexity and returns cost and charged price.
