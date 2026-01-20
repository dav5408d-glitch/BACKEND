import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const conversationsController = {
  getAll: async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  getOne: async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  create: async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  delete: async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }
};
