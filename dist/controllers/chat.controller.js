"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = chatController;
const router_service_1 = require("../services/router.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function chatController(req, res) {
    const { message, image, imageUrl, searchWeb, conversationId } = req.body;
    const userId = req.user?.userId;
    const userPlan = req.user?.plan || 'FREE';
    console.log('🔔 Chat request received');
    console.log('User:', userId, 'Plan:', userPlan);
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message required and must be a string' });
    }
    if (message.length > 10000) {
        return res.status(400).json({ error: 'Message too long (max 10000 characters)' });
    }
    try {
        console.log('💬 Processing message...');
        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });
            if (!conversation || conversation.userId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }
        else {
            conversation = await prisma.conversation.create({
                data: {
                    userId,
                    title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
                }
            });
        }
        // Charger l'historique de la conversation courante (6 derniers messages)
        const historyMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            take: 6
        });
        // On les remet dans l'ordre chronologique
        const conversationHistory = historyMessages.reverse().map(m => ({ role: m.role, content: m.content }));
        // Route message to best AI
        const result = await router_service_1.routerService.handleMessageLocal({
            message,
            user: req.user,
            image,
            imageUrl,
            searchWeb: searchWeb && userPlan !== 'FREE',
            requestCount: req.quota?.used || 0,
            conversationHistory,
        });
        // Save message to DB
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: message,
                hasImage: !!image || !!imageUrl
            }
        });
        // Save AI response
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: result.response || '',
                aiUsed: result.aiUsed,
                tokensUsed: result.tokensUsed,
                costUSD: result.costUSD
            }
        });
        // Update usage
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);
        await prisma.usage.upsert({
            where: {
                userId_date: {
                    userId,
                    date: todayDate
                }
            },
            create: {
                userId,
                date: todayDate,
                requests: 1,
                totalTokens: result.tokensUsed || 0,
                totalCostUSD: result.costUSD || 0
            },
            update: {
                requests: { increment: 1 },
                totalTokens: { increment: result.tokensUsed || 0 },
                totalCostUSD: { increment: result.costUSD || 0 }
            }
        });
        console.log('✅ Response sent successfully');
        res.json({
            ...result,
            conversationId: conversation.id
        });
    }
    catch (error) {
        console.error('❌ Error in chatController:', error.message);
        res.status(200).json({
            response: "🤖 L’IA est en train de se réveiller… Revenez dans quelques instants ou testez une démo ci-dessous !",
            aiUsed: "TEMPORARY",
            providerKey: "none",
            intent: {},
            costUSD: 0,
            chargedUSD: 0,
            webSearchUsed: false,
            webSearchResults: null,
            planUsed: req.user?.plan || 'FREE',
            optimizationApplied: false,
            mode: 'TEMPORARY',
            requestCount: 0,
            totalLimit: 0,
            dailyCost: 0,
            remainingBudget: 0,
            tokensUsed: 0,
            conversationId: conversationId || null
        });
    }
}
