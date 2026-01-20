"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableProviders = getAvailableProviders;
exports.getEnabledProviders = getEnabledProviders;
exports.getProvidersByTier = getProvidersByTier;
exports.logAvailableProviders = logAvailableProviders;
exports.validateProvidersConfig = validateProvidersConfig;
const providers_config_1 = require("./ai/providers.config");
/**
 * Detect which AI providers have valid API keys configured
 * This function checks the environment variables and returns only available providers
 */
function getAvailableProviders() {
    const apiKeyMap = {
        'deepseek': process.env.DEEPSEEK_API_KEY,
        'gemini': process.env.GEMINI_API_KEY,
        'claude': process.env.CLAUDE_API_KEY,
        'openai': process.env.OPENAI_API_KEY,
        'cohere': process.env.COHERE_API_KEY,
        'huggingface': process.env.HUGGINGFACE_API_KEY,
        'mistral': process.env.MISTRAL_API_KEY,
        'azure_openai': process.env.AZURE_OPENAI_API_KEY,
        'google_palm': process.env.GOOGLE_PALM_API_KEY,
    };
    const available = [];
    for (const provider of providers_config_1.PROVIDERS) {
        const hasKey = apiKeyMap[provider.key];
        const isEnabled = !!hasKey && hasKey.trim().length > 0;
        available.push({
            key: provider.key,
            name: provider.name,
            enabled: isEnabled,
            hasApiKey: !!hasKey,
            tier: provider.tier,
            quality: provider.quality,
            costUSD: provider.costUSD
        });
    }
    return available;
}
/**
 * Get only the enabled providers
 */
function getEnabledProviders() {
    return getAvailableProviders().filter(p => p.enabled);
}
/**
 * Get providers by tier (only enabled ones)
 */
function getProvidersByTier(tier) {
    return getAvailableProviders()
        .filter(p => p.enabled && p.tier === tier)
        .map(p => providers_config_1.PROVIDERS.find(pr => pr.key === p.key))
        .filter((p) => !!p);
}
/**
 * Log available providers on startup
 */
function logAvailableProviders() {
    console.log('\n====== 📊 AI PROVIDERS STATUS ======');
    const available = getAvailableProviders();
    available.forEach(p => {
        const status = p.enabled ? '✅ ENABLED' : '❌ DISABLED';
        const quality = '⭐'.repeat(Math.round(p.quality / 2));
        console.log(`${status} | ${p.name.padEnd(25)} | Tier: ${p.tier.padEnd(4)} | Quality: ${quality}`);
    });
    const enabledCount = available.filter(p => p.enabled).length;
    console.log(`\n📈 Total: ${enabledCount}/${available.length} providers enabled`);
    console.log('====== 🚀 READY TO START ======\n');
}
/**
 * Validate that at least one provider is enabled
 */
function validateProvidersConfig() {
    const enabled = getEnabledProviders();
    if (enabled.length === 0) {
        console.error('❌ ERROR: No AI providers configured! Please add at least one API key to .env');
        return false;
    }
    return true;
}
