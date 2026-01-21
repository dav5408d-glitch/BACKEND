"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaConnector = void 0;
const ollama_service_1 = require("../../ollama.service");
class OllamaConnector {
    constructor() {
        this.name = 'ollama';
    }
    async generateResponse(prompt) {
        const text = await (0, ollama_service_1.ollamaGenerate)(prompt);
        const content = typeof text === 'string' ? text : String(text);
        return {
            content,
            tokensUsed: Math.ceil(content.length / 4),
            costUSD: 0,
            model: 'phi3-local'
        };
    }
}
exports.ollamaConnector = new OllamaConnector();
