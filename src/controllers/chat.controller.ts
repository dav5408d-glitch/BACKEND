import { prisma } from '../config/database';
import { ollamaGenerate, ollamaChat } from '../services/ollama.service';

export async function chatController(req: any, res: any) {
  const { message, image, imageUrl, conversationId } = req.body;
  const userId = req.user?.userId;

  console.log('🔔 Chat request received');

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required and must be a string' });
  }

  if (message.length > 10000) {
    return res.status(400).json({ error: 'Message too long (max 10000 characters)' });
  }

  try {
    console.log('💬 Processing message with Ollama...');

    // Save user message if authenticated (TEMPORARILY DISABLED FOR TESTING)
    let currentConvId = conversationId;
    if (userId && userId !== 'beta-user') {
      console.log(`👤 Authenticated user: ${userId}`);
      if (!currentConvId) {
        currentConvId = `temp-${userId}-${Date.now()}`;
        console.log(`💬 Using temporary conversation ID: ${currentConvId}`);
      }
      // TODO: Fix database saving later
      console.log(`� Database saving temporarily disabled`);
    } else {
      // For guest users, use a temporary conversation ID
      currentConvId = `guest-${Date.now()}`;
      console.log(`👤 Guest user using temporary conversation ID: ${currentConvId}`);
    }

    // Use Ollama directly with history support
    const model = process.env.OLLAMA_MODEL || 'mistral';

    // Build conversation history for context
    let messages: any[] = [];
    
    // If we have conversation history from frontend, use it
    if (req.body.history && Array.isArray(req.body.history)) {
      messages = req.body.history.map((m: any) => ({
        role: m.role || 'user',
        content: m.content || ''
      }));
    } else if (currentConvId && userId) {
      // Load conversation from database if no history provided
      const conversationMessages = await prisma.message.findMany({
        where: { conversationId: currentConvId },
        orderBy: { createdAt: 'asc' },
        take: 20 // Limit to last 20 messages for context
      });
      
      messages = conversationMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });

    console.log(`📝 Context: ${messages.length} messages for model ${model}`);

    const response = await ollamaChat(messages, model);

    // Save AI message if authenticated (TEMPORARILY DISABLED FOR TESTING)
    if (userId && userId !== 'beta-user' && currentConvId && !currentConvId.startsWith('guest-')) {
      console.log(`📝 AI response saving temporarily disabled`);
    } else {
      console.log(`👤 Guest response not saved to database`);
    }

    console.log('✅ Response sent successfully');
    res.json({
      response: response,
      aiUsed: `Ollama (${model})`,
      providerKey: 'ollama',
      costUSD: 0,
      chargedUSD: 0,
      tokensUsed: 0,
      mode: 'LOCAL_LLM',
      conversationId: currentConvId
    });
  } catch (error: any) {
    console.error('❌ Error in chatController:', error.message);

    // Friendly error message
    const errorMsg = error.message.includes('ECONNREFUSED')
      ? "🤖 Ollama n'est pas démarré. Lancez 'ollama serve' dans un terminal."
      : `❌ Erreur: ${error.message}`;

    res.status(200).json({
      response: errorMsg,
      aiUsed: "Error",
      providerKey: "none",
      costUSD: 0,
      chargedUSD: 0,
      tokensUsed: 0,
      mode: 'ERROR'
    });
  }
}
