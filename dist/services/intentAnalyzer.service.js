"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeIntent = analyzeIntent;
function analyzeIntent(message) {
    const text = message.toLowerCase();
    if (text.includes('code') || text.includes('bug')) {
        return { domain: 'code', complexity: 'high' };
    }
    if (message.length > 200) {
        return { domain: 'text', complexity: 'high' };
    }
    return { domain: 'general', complexity: 'low' };
}
