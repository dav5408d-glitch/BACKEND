"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.conversationsController = {
    getAll: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'No user ID in token' });
            }
            const conversations = await prisma.conversation.findMany({
                where: { userId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
            res.json(conversations);
        }
        catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    },
    getOne: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'No user ID in token' });
            }
            const conversation = await prisma.conversation.findUnique({
                where: { id },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }
            // Check if user owns this conversation
            if (conversation.userId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            res.json(conversation);
        }
        catch (error) {
            console.error('Get conversation error:', error);
            res.status(500).json({ error: 'Failed to fetch conversation' });
        }
    },
    create: async (req, res) => {
        try {
            const { title } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'No user ID in token' });
            }
            const conversation = await prisma.conversation.create({
                data: {
                    userId,
                    title: title || 'New Conversation'
                }
            });
            res.status(201).json(conversation);
        }
        catch (error) {
            console.error('Create conversation error:', error);
            res.status(500).json({ error: 'Failed to create conversation' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'No user ID in token' });
            }
            const conversation = await prisma.conversation.findUnique({
                where: { id }
            });
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }
            if (conversation.userId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            await prisma.conversation.delete({
                where: { id }
            });
            res.json({ message: 'Conversation deleted' });
        }
        catch (error) {
            console.error('Delete conversation error:', error);
            res.status(500).json({ error: 'Failed to delete conversation' });
        }
    }
};
