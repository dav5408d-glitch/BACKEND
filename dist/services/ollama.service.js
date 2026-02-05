"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaGenerate = ollamaGenerate;
exports.ollamaGenerateWithImage = ollamaGenerateWithImage;
const node_fetch_1 = __importDefault(require("node-fetch"));
// @ts-ignore
async function ollamaGenerate(prompt, model = 'phi3') {
    const response = await (0, node_fetch_1.default)('http://localhost:11434/api/generate', {
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
        response.body.on('data', (chunk) => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const obj = JSON.parse(line);
                        if (obj.response)
                            result += obj.response;
                    }
                    catch (e) {
                        // ignore parse errors for incomplete lines
                    }
                }
            }
        });
        response.body.on('end', () => {
            resolve(result.trim());
        });
        response.body.on('error', (err) => {
            reject(err);
        });
    });
}
// Envoi d'une image à Ollama (vision)
async function ollamaGenerateWithImage(prompt, imageBase64, model = 'llava') {
    // imageBase64 doit être sans préfixe data:image/png;base64,
    const response = await (0, node_fetch_1.default)('http://localhost:11434/api/generate', {
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
