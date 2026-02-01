import { analyzeIntent } from './intentAnalyzer.service';
import { PROVIDERS } from './ai/providers.config';
import { webSearchService } from './websearch.service';
import { getAvailableProviders, getEnabledProviders, getProvidersByTier } from './providersAvailability.service';
import { ollamaGenerate, ollamaGenerateWithImage } from './ollama.service';

// ============================================
// COST TRACKING (In-memory, should be in DB in production)
// ============================================
const userMonthlyCosts: Record<string, number> = {};

function getUserMonthlyBudget(plan: string): number {
  switch (plan) {
    case 'ELITE': return 50;
    case 'PRO': return 20;
    case 'BAS': return 5;
    default: return 0;
  }
}

function getPremiumRequestLimit(plan: string): number {
  switch (plan) {
    case 'ELITE': return 300; // Premium requests before switching to cheap routing
    case 'PRO': return 100;
    case 'BAS': return 50;
    default: return 0;
  }
}

function getTotalRequestLimit(plan: string): number {
  switch (plan) {
    case 'ELITE': return 1500;
    case 'PRO': return 400;
    case 'BAS': return 100;
    default: return 0;
  }
}

function trackCost(userId: string, cost: number): number {
  const key = `${userId}-${new Date().toISOString().split('T')[0]}`; // Per day
  userMonthlyCosts[key] = (userMonthlyCosts[key] || 0) + cost;
  return userMonthlyCosts[key];
}

// ============================================
// PLAN RESTRICTIONS & TIER MAPPING
// ============================================

function allowedTiersForPlan(plan: string) {
  switch (plan) {
    case 'FREE':
      return ['low'];
    case 'BAS':
      return ['low', 'mid'];
    case 'PRO':
      return ['low', 'mid', 'high'];
    case 'ELITE':
      return ['low', 'mid', 'high'];
    default:
      return ['low'];
  }
}

function getPlanFeatures(plan: string): {
  webSearch: boolean;
  imageAnalysis: boolean;
  customSystemPrompt: boolean;
  priorityQueue: boolean;
  multiTurnMemory: boolean;
  maxRequestsPerDay: number;
} {
  switch (plan) {
    case 'ELITE':
      return {
        webSearch: true,
        imageAnalysis: true,
        customSystemPrompt: true,
        priorityQueue: true,
        multiTurnMemory: true,
        maxRequestsPerDay: 50
      };
    case 'PRO':
      return {
        webSearch: true,
        imageAnalysis: true,
        customSystemPrompt: false,
        priorityQueue: false,
        multiTurnMemory: true,
        maxRequestsPerDay: 15
      };
    case 'BAS':
      return {
        webSearch: false,
        imageAnalysis: false,
        customSystemPrompt: false,
        priorityQueue: false,
        multiTurnMemory: false,
        maxRequestsPerDay: 5
      };
    default:
      return {
        webSearch: false,
        imageAnalysis: false,
        customSystemPrompt: false,
        priorityQueue: false,
        multiTurnMemory: false,
        maxRequestsPerDay: 0
      };
  }
}

// ============================================
// INTELLIGENT INTENT ANALYSIS
// ============================================

function analyzeIntentAdvanced(message: string): {
  domain: string;
  complexity: 'low' | 'medium' | 'high';
  requiresWebSearch: boolean;
  suggestedProviderTier: 'low' | 'mid' | 'high';
  isPremiumWorthy: boolean;
} {
  const text = message.toLowerCase();
  let domain = 'general';
  let complexity: 'low' | 'medium' | 'high' = 'medium';
  let requiresWebSearch = false;
  let suggestedProviderTier: 'low' | 'mid' | 'high' = 'mid';
  let isPremiumWorthy = false;

  // DOMAIN DETECTION
  if (text.includes('code') || text.includes('debug') || text.includes('bug') || text.includes('error') || text.includes('function') || text.includes('script')) {
    domain = 'coding';
    complexity = 'high';
    suggestedProviderTier = 'high';
    isPremiumWorthy = true; // CODE needs Claude/OpenAI
  } else if (text.includes('image') || text.includes('photo') || text.includes('picture') || text.includes('visual')) {
    domain = 'vision';
    complexity = 'medium';
    suggestedProviderTier = 'high';
    isPremiumWorthy = true;
  } else if (text.includes('creative') || text.includes('story') || text.includes('poem') || text.includes('write') || text.includes('novel')) {
    domain = 'creative';
    complexity = 'medium';
    suggestedProviderTier = 'mid';
    isPremiumWorthy = true; // CREATIVE benefits from quality
  } else if (text.includes('analyze') || text.includes('research') || text.includes('data') || text.includes('statistics')) {
    domain = 'analysis';
    complexity = 'high';
    suggestedProviderTier = 'mid'; // Downgraded to mid since we don't have high tier
    requiresWebSearch = true;
    isPremiumWorthy = true;
  } else if (text.includes('question') || text.includes('what') || text.includes('how') || text.includes('why')) {
    domain = 'qa';
    complexity = 'medium';
    suggestedProviderTier = 'mid';
  } else if (text.includes('translate') || text.includes('langue')) {
    domain = 'translation';
    complexity = 'low';
    suggestedProviderTier = 'low';
  } else if (text.includes('summary') || text.includes('tldr') || text.includes('resume')) {
    domain = 'summarization';
    complexity = 'medium';
    suggestedProviderTier = 'mid';
  }

  // COMPLEXITY ESTIMATION
  if (message.length < 50) {
    complexity = 'low';
  } else if (message.length > 500) {
    complexity = 'high';
    isPremiumWorthy = true;
  }

  // Web search keywords
  if (text.includes('latest') || text.includes('current') || text.includes('news') || text.includes('today') || text.includes('recent')) {
    requiresWebSearch = true;
  }

  return {
    domain,
    complexity,
    requiresWebSearch,
    suggestedProviderTier,
    isPremiumWorthy
  };
}

// ============================================
// PROMPT OPTIMIZATION
// ============================================

function optimizePrompt(message: string, intent: any, plan: string, isInCheapMode: boolean): string {
  let optimizedMessage = message;

  // Add domain-specific context
  if (intent.domain === 'coding') {
    optimizedMessage += '\n\n[CONTEXT: Response should include well-structured code with comments. Prioritize best practices and error handling.]';
  } else if (intent.domain === 'creative') {
    optimizedMessage += '\n\n[CONTEXT: Response should be engaging and creative. Focus on storytelling and vivid descriptions.]';
  } else if (intent.domain === 'analysis') {
    optimizedMessage += '\n\n[CONTEXT: Response should be analytical and data-driven. Include sources when possible.]';
  }

  // Aggressive optimization in cheap mode for better quality
  if (isInCheapMode) {
    optimizedMessage += '\n\n[OPTIMIZATION MODE: Provide concise, high-value response. Focus on core information. Be specific and actionable.]';
  } else {
    // Premium mode - be thorough
    optimizedMessage += '\n\n[PREMIUM MODE: Provide comprehensive, detailed response. Include examples and edge cases.]';
  }

  // Adaptation automatique du prompt pour le grand public :
  // Si la question est très courte/simple, demander une réponse directe, concise, puis détaillée si besoin
  const isShortQuestion = typeof message === 'string' && message.trim().split(' ').length <= 7;
  if (isShortQuestion) {
    optimizedMessage = `Commence toujours par répondre directement, simplement et brièvement à la question posée, puis détaille si besoin. ${optimizedMessage}`;
  } else {
    optimizedMessage = `Commence toujours par répondre précisément à la question, puis détaille de façon pédagogique et structurée. ${optimizedMessage}`;
  }

  // Optimisation conditionnelle du prompt :
  // Si la question est complexe (plus de 12 mots), demander une réponse longue et détaillée
  // Sinon, rester concis et ignorer les détails inutiles
  const wordCount = typeof message === 'string' ? message.trim().split(/\s+/).length : 0;
  if (wordCount > 12) {
    optimizedMessage = `Donne une réponse longue, détaillée, pédagogique et structurée uniquement si la question le nécessite. ${optimizedMessage}`;
  } else {
    optimizedMessage = `Sois concis et va à l'essentiel, n'ajoute des détails que si c'est pertinent pour la question. ${optimizedMessage}`;
  }

  // Ajout d'une consigne pour le comportement conversationnel grand public
  optimizedMessage = `Tu es un assistant conversationnel pour le grand public. Si la question est vague, ambiguë ou ressemble à une salutation, commence par répondre de façon humaine, naturelle et amicale, puis demande une précision si besoin avant de donner une réponse technique. Ne donne une réponse technique détaillée que si la question est claire et précise. ${optimizedMessage}`;

  // Consigne spéciale pour les IA connues
  optimizedMessage = `Si l'utilisateur demande si tu connais une IA connue (ex : ChatGPT, Gemini, Claude, Mistral, Bard, etc.), réponds clairement que tu connais, explique brièvement ce que c'est, puis propose d'en dire plus si besoin. ${optimizedMessage}`;

  // Consigne pour donner des réponses à jour
  optimizedMessage = `Si la question concerne une technologie, une IA ou un événement, précise la date de tes connaissances (ex : "À ma connaissance en 2026...") et indique si tu n'es pas à jour. Si tu connais une mise à jour récente, mentionne-la. ${optimizedMessage}`;

  // Ajoute la date du jour dans chaque prompt pour que l'IA la reprenne dans sa réponse
  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  optimizedMessage = `Nous sommes le ${today}. ${optimizedMessage}`;

  // INSTRUCTION ANTI-GREETING RENFORCÉE :
  // Ne commence JAMAIS ta réponse par une salutation (Bonjour, Salut, Coucou, Hello, Comment allez-vous, etc.),
  // sauf si l'utilisateur t'a explicitement salué dans son message (ex : commence par Bonjour, Salut, Coucou, Hello, etc.).
  // Si l'utilisateur ne salue pas, commence directement par la réponse sans aucune formule de politesse ou introduction.
  // Si tu n'es pas certain, NE SALUE PAS.
  optimizedMessage = `INSTRUCTION IMPORTANTE : Ne commence JAMAIS ta réponse par une salutation (Bonjour, Salut, Coucou, Hello, Comment allez-vous, etc.), sauf si l'utilisateur t'a explicitement salué dans son message. Si l'utilisateur ne salue pas, commence directement par la réponse sans aucune formule de politesse ou introduction. Si tu n'es pas certain, NE SALUE PAS. ${optimizedMessage}`;

  return optimizedMessage;
}

// ============================================
// PROVIDER SELECTION LOGIC (HYBRID)
// ============================================

function pickOptimalProvider(
  intent: any,
  allowedProviders: typeof PROVIDERS,
  plan: string,
  isInCheapMode: boolean
) {
  // Filter to only ENABLED providers
  const enabledProviders = allowedProviders.filter(p => {
    const availability = getAvailableProviders().find(ap => ap.key === p.key);
    return availability?.enabled || false;
  });

  if (enabledProviders.length === 0) {
    console.warn('⚠️  No enabled providers in allowed list, using first available');
    return allowedProviders[0];
  }

  console.log(`🎯 Selecting from ${enabledProviders.length} enabled providers: domain="${intent.domain}", isPremium=${!isInCheapMode}, plan=${plan}`);

  // ELITE users in premium mode: prioritize quality (OpenAI > Mistral > others)
  if (plan === 'ELITE' && !isInCheapMode) {
    console.log('👑 ELITE user in premium mode - prioritizing quality');
    const openai = enabledProviders.find(p => p.key === 'openai');
    if (openai) {
      console.log('🏆 Using OpenAI (best quality for ELITE)');
      return openai;
    }
    const mistral = enabledProviders.find(p => p.key === 'mistral');
    if (mistral) {
      console.log('🏆 Using Mistral (2nd best for ELITE)');
      return mistral;
    }
  }

  // PRO users in premium mode: prefer quality too
  if (plan === 'PRO' && !isInCheapMode) {
    console.log('💎 PRO user - preferring quality');
    const openai = enabledProviders.find(p => p.key === 'openai');
    if (openai) {
      console.log('✨ Using OpenAI (best for PRO)');
      return openai;
    }
    const mistral = enabledProviders.find(p => p.key === 'mistral');
    if (mistral) {
      console.log('✨ Using Mistral (quality option for PRO)');
      return mistral;
    }
  }

  // In cheap mode, prioritize cost
  if (isInCheapMode) {
    const cheapProviders = enabledProviders.filter(p => p.tier === 'low' || p.key === 'deepseek');
    if (cheapProviders.length > 0) {
      // Prefer DeepSeek (very cheap) > OpenAI > HuggingFace
      const deepseek = cheapProviders.find(p => p.key === 'deepseek');
      if (deepseek) {
        console.log('💰 Using DeepSeek (cheapest tier)');
        return deepseek;
      }
      const openai = cheapProviders.find(p => p.key === 'openai');
      if (openai) {
        console.log('💰 Using OpenAI (best quality in low tier)');
        return openai;
      }
      const huggingface = cheapProviders.find(p => p.key === 'huggingface');
      if (huggingface) {
        console.log('💰 Using HuggingFace (low cost)');
        return huggingface;
      }
      return cheapProviders[0];
    }
  }

  // Premium mode - select by domain
  let candidates = enabledProviders.filter(p => p.tier !== 'low' || enabledProviders.length < 2);

  if (intent.domain === 'coding') {
    const mistral = candidates.find(p => p.key === 'mistral');
    if (mistral && !isInCheapMode) {
      console.log('🎯 Using Mistral (best available for coding)');
      return mistral;
    }
  }

  if (intent.domain === 'creative') {
    const mistral = candidates.find(p => p.key === 'mistral');
    if (mistral && !isInCheapMode) {
      console.log('🎯 Using Mistral (best available for creative)');
      return mistral;
    }
  }

  if (intent.domain === 'analysis') {
    const mistral = candidates.find(p => p.key === 'mistral');
    if (mistral && !isInCheapMode) {
      console.log('🎯 Using Mistral (best available for analysis)');
      return mistral;
    }
  }

  // Fallback: sort by quality for high complexity, by cost for low complexity
  if (intent.complexity === 'high' && !isInCheapMode) {
    candidates.sort((a, b) => b.quality - a.quality);
  } else {
    // For low complexity, prefer quality/enabled: OpenAI > HuggingFace > DeepSeek > Demo
    const openai = enabledProviders.find(p => p.key === 'openai');
    if (openai) {
      console.log('🤖 Using OpenAI (best available for simple requests)');
      return openai;
    }
    const huggingface = enabledProviders.find(p => p.key === 'huggingface');
    if (huggingface) {
      console.log('⚡ Using HuggingFace (fast & cheap for simple requests)');
      return huggingface;
    }
    // Check in all enabledProviders, not just candidates
    const deepseek = enabledProviders.find(p => p.key === 'deepseek');
    if (deepseek) {
      console.log('⚡ Using DeepSeek (fast & cheap for simple requests)');
      return deepseek;
    }
    candidates.sort((a, b) => a.priceUSD - b.priceUSD);
  }

  // Ultimate fallback: use demo mode
  const demoProvider = PROVIDERS.find(p => p.key === 'demo');
  if (demoProvider) {
    console.log('📺 All APIs failed, using Demo Mode for demonstration purposes');
    return demoProvider;
  }

  return candidates[0] || enabledProviders[0];
}

// ============================================
// MAIN ROUTER SERVICE
// ============================================

export const routerService = {
  async handleMessage({ message, user, searchWeb, requestCount }: any) {
    console.log('\n====== 🔄 MESSAGE ROUTING START ======');
    console.log('📨 Message:', message.substring(0, 60) + '...');
    console.log('👤 User:', user?.email);

    // Détection du provider forcé via mot-clé (ex: (GPT), (HG), (MISTRAL), ...)
    let forcedProviderKey: string | null = null;
    let cleanedMessage = message;
    const providerMatch = message.match(/^\(([^)]+)\)/);
    if (providerMatch) {
      const keyword = providerMatch[1].toUpperCase();
      switch (keyword) {
        case 'GPT':
          forcedProviderKey = 'openai';
          break;
        case 'HG':
          forcedProviderKey = 'huggingface';
          break;
        case 'MISTRAL':
          forcedProviderKey = 'mistral';
          break;
        case 'DEEPSEEK':
          forcedProviderKey = 'deepseek';
          break;
        case 'CLAUDE':
          forcedProviderKey = 'claude';
          break;
        // Ajoute d'autres IA ici si besoin
        default:
          forcedProviderKey = null;
      }
      cleanedMessage = message.replace(/^\([^)]+\)\s*/, '');
    }

    // Validate plan
    const plan = (user && (user.plan || user.planType)) || 'FREE';
    console.log('📊 Plan:', plan);

    // FREE users are now allowed with limited access to low-tier providers

    // Check request limit
    const totalLimit = getTotalRequestLimit(plan);
    const premiumLimit = getPremiumRequestLimit(plan);
    const currentRequestCount = requestCount || 0;
    const isInCheapMode = currentRequestCount >= premiumLimit;

    console.log(`📊 Request count: ${currentRequestCount}/${totalLimit}, Premium limit: ${premiumLimit}`);
    console.log(`💰 Mode: ${isInCheapMode ? 'SMART ROUTING (cheap)' : 'PREMIUM'}`);

    // Get plan features
    const planFeatures = getPlanFeatures(plan);
    console.log('✨ Plan features enabled:', {
      webSearch: planFeatures.webSearch,
      imageAnalysis: planFeatures.imageAnalysis,
      priorityQueue: planFeatures.priorityQueue
    });

    // Advanced intent analysis
    const intent = analyzeIntentAdvanced(cleanedMessage);
    console.log('🧠 Intent:', { domain: intent.domain, complexity: intent.complexity, isPremiumWorthy: intent.isPremiumWorthy });

    // Web search handling
    const allowWebSearch = searchWeb && planFeatures.webSearch;
    if (searchWeb && !planFeatures.webSearch) {
      console.log('⚠️  Web search not available for this plan');
    }

    // Get allowed providers for plan (ONLY ENABLED ONES)
    const allowedTiers = allowedTiersForPlan(plan);
    const allProvidersForTier = PROVIDERS.filter(p => allowedTiers.includes(p.tier));

    // Filter to only enabled providers
    let allowedProviders = allProvidersForTier.filter(p => {
      const availability = getAvailableProviders().find(ap => ap.key === p.key);
      return availability?.enabled || false;
    });

    if (!allowedProviders.length) {
      const available = getEnabledProviders();
      console.warn(`⚠️  No ${plan} providers enabled, falling back to available providers`);
      if (available.length === 0) {
        throw new Error('No providers available! Please configure at least one API key in .env');
      }
      // Use the enabled providers regardless of tier
      const fallbackProviders = available.map(ap => PROVIDERS.find(p => p.key === ap.key)).filter((p): p is typeof PROVIDERS[0] => !!p);
      console.log('🔄 Using fallback providers:', fallbackProviders.map(p => p.name).join(', '));
      allowedProviders.push(...fallbackProviders);
    }

    console.log('🤖 Enabled providers for plan:', allowedProviders.map(p => `${p.name}(${p.tier})`).join(', '));

    // Sélection du provider forcé si mot-clé détecté
    let provider;
    if (forcedProviderKey) {
      provider = allowedProviders.find(p => p.key === forcedProviderKey);
      if (!provider) {
        console.warn(`⚠️  Provider forcé (${forcedProviderKey}) non disponible pour ce plan, routage normal.`);
        provider = pickOptimalProvider(intent, allowedProviders, plan, isInCheapMode);
      } else {
        console.log(`✅ Provider forcé sélectionné: ${provider.name}`);
      }
    } else {
      provider = pickOptimalProvider(intent, allowedProviders, plan, isInCheapMode);
      console.log('✅ Selected provider:', provider.name);
    }

    // Optimize prompt based on mode
    const optimizedMessage = optimizePrompt(cleanedMessage, intent, plan, isInCheapMode);
    console.log('📝 Prompt optimized for', isInCheapMode ? 'efficiency' : 'quality');

    // Web search if needed
    let enhancedMessage = optimizedMessage;
    let searchResults = null;

    if (allowWebSearch && intent.requiresWebSearch) {
      try {
        console.log('🔍 Performing web search...');
        const results = await webSearchService.search(cleanedMessage);
        searchResults = results;
        const formattedResults = webSearchService.formatResultsForContext(results.results);
        enhancedMessage = `${optimizedMessage}\n\n## Web Search Results:\n${formattedResults}`;
        console.log('✅ Web search completed');
      } catch (error) {
        console.error('⚠️  Web search failed:', error);
      }
    }

    // Generate response
    console.log('🤔 Generating response with', provider.name, '...');
    const response = await provider.connector.generateResponse(enhancedMessage);
    console.log('✨ Response received - Length:', response.content.length, 'chars');

    // Track cost
    const dailyCost = trackCost(user.userId || user.email, response.costUSD);
    const monthlyBudget = getUserMonthlyBudget(plan);
    const remainingBudget = monthlyBudget - dailyCost;

    console.log(`💳 Cost: $${response.costUSD.toFixed(4)} | Daily: $${dailyCost.toFixed(2)} | Budget remaining: $${remainingBudget.toFixed(2)}`);
    console.log('====== ✅ MESSAGE ROUTING END ======\n');

    return {
      response: response.content,
      aiUsed: provider.name,
      providerKey: provider.key,
      intent,
      costUSD: response.costUSD,
      chargedUSD: provider.priceUSD,
      webSearchUsed: !!searchResults,
      webSearchResults: searchResults,
      planUsed: plan,
      optimizationApplied: true,
      mode: isInCheapMode ? 'SMART_ROUTING' : 'PREMIUM',
      requestCount: currentRequestCount + 1,
      totalLimit: totalLimit,
      dailyCost: dailyCost,
      remainingBudget: remainingBudget,
      tokensUsed: response.tokensUsed || 0
    };
  },

  // Ajout d'une fonction pour router vers Ollama si aucune API externe
  async handleMessageLocal({ message, user, image, imageUrl, searchWeb, requestCount, conversationHistory }: any) {
    const intent = analyzeIntentAdvanced(message);
    let optimizedMessage = optimizePrompt(message, intent, user?.plan || 'FREE', true);

    // Use Mixtral or Mistral as default if available, otherwise fallback to llama3
    // For now, we will ask for 'mistral' model from Ollama which usually maps to Mistral 7B or Mixtral 8x7B depending on user setup
    // We intentionally include 'llama3' in the logic for future/fallback support
    let model = image ? 'llava' : 'mistral';

    // Fallback logic (unused currently but keeps the type broad enough for the checks below)
    if (!image && process.env.DEFAULT_LOCAL_MODEL === 'llama3') {
      model = 'llama3';
    }

    console.log(`🧠 Local Inference using model: ${model}`);

    // Prompt amélioré pour des réponses longues, détaillées, pédagogiques et compréhensives
    if (model === 'mistral' || model === 'mixtral') {
      optimizedMessage = `Tu es une IA sophistiquée basée sur Mixtral 7B/8x7B. Réponds TOUJOURS en français. Sois très précis, nuancé et exhaustif. Tes réponses doivent être bien structurées (titres, listes à puces). ${optimizedMessage}`;
    } else if (model === 'llama3') {
      optimizedMessage = `Tu es un assistant IA expert, compétent, et détaillé. Réponds TOUJOURS en français, de manière très claire, structurée, pédagogique et compréhensible, sans inventer de sources ni d'instructions. Donne TOUJOURS une réponse longue, détaillée et complète, avec des exemples concrets si possible. Sois professionnel et utile. ${optimizedMessage}`;
    } else if (model === 'llava') {
      optimizedMessage = `Analyse l'image fournie et réponds en français, de façon claire, très détaillée, pédagogique, structurée et compréhensible. Donne une réponse longue et complète, avec des exemples si possible. ${optimizedMessage}`;
    }

    // Ajout du contexte conversationnel (mémoire courte)
    // On récupère les 12 derniers messages (6 échanges complets user/assistant) pour meilleure mémorisation
    let contextHistory = '';
    // Utilise l'historique de la conversation courante si fourni (prioritaire)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const lastMessages = conversationHistory.slice(-12); // 6 échanges complets (augmenté de 6 à 12)
      for (const msg of lastMessages) {
        contextHistory += `\n[${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}]: ${msg.content}`;
      }
    } else if (user && user.conversationHistory && Array.isArray(user.conversationHistory)) {
      // fallback éventuel (rare)
      const lastMessages = user.conversationHistory.slice(-12);
      for (const msg of lastMessages) {
        contextHistory += `\n[${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}]: ${msg.content}`;
      }
    }
    if (contextHistory) {
      // Reformate le contexte comme un historique de chat, puis la question, puis une consigne unique
      optimizedMessage = `HISTORIQUE DE LA CONVERSATION ACTUELLE:\n${contextHistory}\n\n[Utilisateur]: ${message}\n\nINSTRUCTION CRITIQUE POUR MISTRAL:\n1. Tu DOIS absolument te souvenir de TOUS les sujets précédents discutés dans l'historique ci-dessus.\n2. Si l'utilisateur dit "dis-moi en plus", "continue", "explique davantage", tu dois CONTINUER DIRECTEMENT sur le sujet précédent sans faire d'introduction générique.\n3. Tu n'as PAS LE DROIT de répondre de manière générique ou de demander une clarification si la question concerne le sujet précédent.\n4. Si la question est vague ou courte (comme "dis moi en plus"), relie-la TOUJOURS au dernier sujet important discuté dans l'historique.\n5. Donne une réponse APPROFONDIE et DÉTAILLÉE qui poursuit directement le fil de la conversation.\n6. Ne répète pas ce que tu as déjà dit, mais ajoute des informations NOUVELLES et COMPLÉMENTAIRES.\n`;
    } else {
      optimizedMessage = `[Utilisateur]: ${message}\n`;
    }
    // Ajout d'une consigne pour s'adapter au style de l'utilisateur
    if (user && user.profile && user.profile.style) {
      optimizedMessage = `Adapte ta façon de répondre au style suivant : ${user.profile.style}. ${optimizedMessage}`;
    }

    // Ajout d'une consigne pour que l'IA réponde d'abord comme un assistant humain, demande une précision si la question est vague, et ne donne une réponse technique que si c'est pertinent.
    optimizedMessage = `Tu es un assistant conversationnel pour le grand public. Si la question est vague, ambiguë ou ressemble à une salutation, commence par répondre de façon humaine, naturelle et amicale, puis demande une précision si besoin avant de donner une réponse technique. Ne donne une réponse technique détaillée que si la question est claire et précise. ${optimizedMessage}`;

    // Consigne spéciale pour les IA connues
    optimizedMessage = `Si l'utilisateur demande si tu connais une IA connue (ex : ChatGPT, Gemini, Claude, Mistral, Bard, etc.), réponds clairement que tu connais, explique brièvement ce que c'est, puis propose d'en dire plus si besoin. ${optimizedMessage}`;

    // Consigne pour donner des réponses à jour
    optimizedMessage = `Si la question concerne une technologie, une IA ou un événement, précise la date de tes connaissances (ex : "À ma connaissance en 2026...") et indique si tu n'es pas à jour. Si tu connais une mise à jour récente, mentionne-la. ${optimizedMessage}`;

    // Ajoute la date du jour dans chaque prompt pour que l'IA la reprenne dans sa réponse
    const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    optimizedMessage = `Nous sommes le ${today}. ${optimizedMessage}`;

    // Supprime toute consigne ou contexte qui forcerait l'IA à saluer systématiquement
    // Ajoute une consigne explicite pour NE PAS saluer systématiquement
    optimizedMessage = `Ne commence jamais ta réponse par une salutation comme Bonjour, Salut, Coucou, Comment allez-vous, etc., sauf si l'utilisateur te salue explicitement. ${optimizedMessage}`;

    try {
      let response = await ollamaGenerate(optimizedMessage, model);
      // Post-traitement : suppression des salutations automatiques en début de réponse
      if (typeof response === 'string') {
        response = response.replace(/^(\s*)(bonjour|salut|coucou|hello|bonsoir|hey|bienvenue|\s*[,!\-–—]*)+/i, '').trimStart();
      }
      const disclaimer = '\n\n⚠️ Réponse générée par Llama 3 (Ollama local, phase gratuite/bêta) : les informations peuvent être inexactes ou datées, et l\'IA n\'a pas accès à Internet.';
      return {
        response: (typeof response === 'string' ? response : String(response)) + disclaimer,
        aiUsed: 'Llama 3 (Local)',
        providerKey: 'llama3-local',
        intent,
        costUSD: 0,
        chargedUSD: 0,
        webSearchUsed: false,
        webSearchResults: null,
        planUsed: user?.plan || 'FREE',
        optimizationApplied: true,
        mode: 'LOCAL',
        requestCount: requestCount + 1,
        totalLimit: 0,
        dailyCost: 0,
        remainingBudget: 0,
        tokensUsed: (typeof response === 'string' ? response.length : 0)
      };
    } catch (err) {
      console.error('❌ Erreur lors de l’appel à Ollama :', err);
      throw err;
    }

    // Si une image est jointe, utiliser le modèle vision (llava)
    if (image) {
      const visionModel = 'llava';
      const response = await ollamaGenerateWithImage(optimizedMessage, image, visionModel);
      const disclaimer = '\n\n⚠️ Réponse générée par une IA locale (vision, phase gratuite/bêta) : les informations peuvent être inexactes ou datées, et l’IA n’a pas accès à Internet.';
      return {
        response: (typeof response === 'string' ? response : String(response)) + disclaimer,
        aiUsed: 'LLaVA (Ollama)',
        providerKey: 'llava-local',
        intent,
        costUSD: 0,
        chargedUSD: 0,
        webSearchUsed: false,
        webSearchResults: null,
        planUsed: user?.plan || 'FREE',
        optimizationApplied: true,
        mode: 'LOCAL',
        requestCount: requestCount + 1,
        totalLimit: 0,
        dailyCost: 0,
        remainingBudget: 0,
        tokensUsed: (typeof response === 'string' ? response.length : 0)
      };
    }
  }
};
