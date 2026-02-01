import fetch from 'node-fetch';

// Configuration pour Ollama local ou distant
const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';

export async function ollamaGenerate(prompt: string, model: string = 'mixtral') {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!response.ok) {
    throw new Error('Ollama API error: ' + response.statusText);
  }
  const data = await response.json();
  return data.response;
}

export async function ollamaChat(messages: Array<{ role: string, content: string }>, model: string = 'mixtral') {
  console.log(`🤖 Sending chat request to Ollama (${model}) with ${messages.length} messages`);
  console.log(`🌐 Ollama URL: ${OLLAMA_BASE_URL}`);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText} (${OLLAMA_BASE_URL})`);
  }

  const data = await response.json();
  return data.message.content;
}

// Envoi d'une image à Ollama (vision)
export async function ollamaGenerateWithImage(prompt: string, imageBase64: string, model: string = 'llava') {
  // imageBase64 doit être sans préfixe data:image/png;base64,
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      images: [imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')]
    })
  });
  if (!response.ok) {
    throw new Error('Ollama API error: ' + response.statusText);
  }
  const data = await response.json();
  return data.response || data.message || '[Aucune réponse reçue]';
}

// Vérifier si Ollama est accessible
export async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error: any) {
    console.error('❌ Ollama health check failed:', error.message);
    return false;
  }
}
