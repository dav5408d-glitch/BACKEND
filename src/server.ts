import dotenv from 'dotenv';

// Load environment variables FIRST, before anything else
dotenv.config();

import app from './app';
import { logAvailableProviders, validateProvidersConfig } from './services/providersAvailability.service';

const PORT = process.env.PORT || 3002;

// Validate and log available providers
if (!validateProvidersConfig()) {
  process.exit(1);
}

logAvailableProviders();

app.listen(PORT, () => {
  console.log(`SYNAPSE AI backend running on http://localhost:${PORT}`);
});
