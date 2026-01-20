"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoConnector = void 0;
class DemoConnector {
    constructor() {
        this.name = 'demo';
    }
    async generateResponse(prompt) {
        // Simple demo responses based on prompt keywords
        const text = prompt.toLowerCase();
        let content = '';
        if (text.includes('hello') || text.includes('bonjour') || text.includes('salut')) {
            content = 'Bonjour! Je suis une réponse de démonstration. Je suis heureux de discuter avec vous. En attendant, vous pouvez configurer vos vraies clés API pour obtenir des réponses réelles d\'IA avancées.';
        }
        else if (text.includes('how') || text.includes('comment') || text.includes('quoi')) {
            content = 'Excellente question! Voici une explication détaillée:\n\n1. **Point un**: C\'est un aspect important\n2. **Point deux**: Ceci fournit des détails supplémentaires\n3. **Point trois**: Voici la conclusion\n\nJ\'espère que cela répond à votre question.';
        }
        else if (text.includes('code') || text.includes('javascript') || text.includes('python')) {
            content = 'Voici un exemple de code:\n\n```javascript\nfunction example() {\n  console.log("Ceci est un exemple de démonstration");\n  return "Résultat";\n}\n```\n\nCe code illustre le concept de base. Pour des cas réels, configurez vos API réelles.';
        }
        else if (text.includes('2+2') || text.includes('math') || text.includes('calcul')) {
            content = '2 + 2 = 4\n\nC\'est une addition simple. Pour des calculs plus complexes, les vraies clés API fourniraient des réponses plus nuancées.';
        }
        else {
            content = `Vous avez demandé: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nCeci est une réponse de démonstration. Le système fonctionne correctement! Configurez vos vraies clés API (DeepSeek, HuggingFace, Mistral, etc.) pour obtenir des réponses d\'IA professionnelles.\n\n**Prochaines étapes:**\n1. Obtenez une clé API valide\n2. Mettez-la à jour dans le fichier .env\n3. Redémarrez le serveur\n4. Profitez des réponses d\'IA réelles!`;
        }
        return {
            content,
            tokensUsed: Math.ceil(content.length / 4),
            costUSD: 0.0001,
            model: 'demo-v1'
        };
    }
    async send(message) {
        const response = await this.generateResponse(message);
        return response.content;
    }
}
exports.demoConnector = new DemoConnector();
