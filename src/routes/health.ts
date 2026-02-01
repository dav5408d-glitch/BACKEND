import { Router } from 'express';
import { checkOllamaHealth } from '../services/ollama.service';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const ollamaStatus = await checkOllamaHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        backend: true,
        ollama: ollamaStatus,
        model: process.env.OLLAMA_MODEL || 'mixtral',
        ollamaUrl: process.env.OLLAMA_HOST || 'http://localhost:11434'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
