// Script d'export des conversations pour fine-tuning Ollama
// Exporte les conversations et messages du backend Prisma en JSONL compatible avec l'entraînement LLM

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportConversationsForOllama() {
  const conversations = await prisma.conversation.findMany({
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  const lines: string[] = [];
  for (const conv of conversations) {
    let history: { role: string, content: string }[] = [];
    for (const msg of conv.messages) {
      history.push({ role: msg.role, content: msg.content });
      // Pour chaque échange user/assistant, on exporte un exemple
      if (msg.role === 'assistant' && history.length >= 2) {
        const userMsg = history[history.length - 2];
        const aiMsg = history[history.length - 1];
        if (userMsg.role === 'user') {
          lines.push(JSON.stringify({
            input: userMsg.content,
            output: aiMsg.content
          }));
        }
      }
    }
  }
  fs.writeFileSync('ollama-finetune.jsonl', lines.join('\n'), 'utf-8');
  console.log(`Exporté ${lines.length} exemples dans ollama-finetune.jsonl`);
  process.exit(0);
}

exportConversationsForOllama();
