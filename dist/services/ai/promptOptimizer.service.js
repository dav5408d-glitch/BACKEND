"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptOptimizer = void 0;
class PromptOptimizer {
    optimize(prompt, intent) {
        const enhancements = [];
        let optimized = prompt.trim();
        // Add context if missing
        if (!this.hasContext(prompt)) {
            optimized = `Please provide a detailed response: ${optimized}`;
            enhancements.push('Added context');
        }
        // Add format preference if code-related
        if (this.isCodeRelated(prompt)) {
            if (!optimized.includes('format') && !optimized.includes('code block')) {
                optimized = `${optimized}\n\nPlease format with proper code blocks.`;
                enhancements.push('Added code formatting');
            }
        }
        // Add structure for analysis
        if (this.isAnalysisRequest(prompt)) {
            if (!optimized.includes('structure')) {
                optimized = `${optimized}\n\nStructure response clearly.`;
                enhancements.push('Added structure');
            }
        }
        return {
            original: prompt,
            optimized,
            enhancements
        };
    }
    hasContext(prompt) {
        return prompt.length >= 20 && prompt.split(' ').length > 5;
    }
    isCodeRelated(prompt) {
        const keywords = ['code', 'function', 'algorithm', 'debug', 'javascript', 'python'];
        return keywords.some(kw => prompt.toLowerCase().includes(kw));
    }
    isAnalysisRequest(prompt) {
        const keywords = ['analyze', 'explain', 'compare', 'evaluate'];
        return keywords.some(kw => prompt.toLowerCase().includes(kw));
    }
}
exports.PromptOptimizer = PromptOptimizer;
