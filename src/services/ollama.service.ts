import fetch from 'node-fetch';

// @ts-ignore


export async function ollamaGenerate(prompt: string, model: string = 'phi3') {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: true })
  });
  if (!response.ok) {
    throw new Error('Ollama API error: ' + response.statusText);
  }
  return new Promise((resolve, reject) => {
    let result = '';
    let buffer = '';
    response.body.on('data', (chunk: any) => {
      buffer += chunk.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const obj = JSON.parse(line);
            if (obj.response) result += obj.response;
          } catch (e) {
            // ignore parse errors for incomplete lines
          }
        }
      }
    });
    response.body.on('end', () => {
      resolve(result.trim());
    });
    response.body.on('error', (err: any) => {
      reject(err);
    });
  });
}

// Envoi d'une image à Ollama (vision)
export async function ollamaGenerateWithImage(prompt: string, imageBase64: string, model: string = 'llava') {
  // imageBase64 doit être sans préfixe data:image/png;base64,
  const response = await fetch('http://localhost:11434/api/generate', {
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
