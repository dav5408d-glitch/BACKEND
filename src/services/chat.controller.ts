// src/chat.controller.ts
import { ollamaChat } from './ollama.service';

// Stockage temporaire (en prod : utilisez Redis ou DB)
const conversations: Record<string, Array<{ role: string, content: string }>> = {};

export async function handleChat(req: any, res: any) {
  const { userId, message } = req.body;
  const history = conversations[userId] || [];

  // Ajoute le message utilisateur
  history.push({ role: "user", content: message });

  try {
    // Envoie tout l'historique à Ollama
    const response = await ollamaChat(history, 'mixtral');
    // Sauvegarde la réponse
    history.push({ role: "assistant", content: response });

    // Persiste la conversation
    conversations[userId] = history;

    res.json({ response });
  } catch (err) {
res.status(500).json({ 
  error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue'
});   
  }
}   