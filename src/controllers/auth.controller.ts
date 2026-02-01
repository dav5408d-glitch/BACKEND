import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation email regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation password
const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const authController = {
  register: async (req: any, res: any) => {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(password, 10);

      // Create user in DB
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          subscription: {
            create: {
              planType: 'FREE',
              status: 'active'
            }
          }
        },
        include: { subscription: true }
      });

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.planType || 'FREE'
        },
        process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.planType || 'FREE',
          isPaid: user.subscription?.planType !== 'FREE'
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
  },

  login: async (req: any, res: any) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Find user in DB
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.planType || 'FREE'
        },
        process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.planType || 'FREE',
          isPaid: user.subscription?.planType !== 'FREE'
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed: ' + error.message });
    }
  },

  getProfile: async (req: any, res: any) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'No user in token' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.planType || 'FREE',
          isPaid: user.subscription?.planType !== 'FREE',
          subscriptionStatus: user.subscription?.status
        }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  updatePlan: async (req: any, res: any) => {
    try {
      const { plan } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'No user in token' });
      }

      const validPlans = ['FREE', 'BAS', 'PRO', 'ELITE'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      // Update subscription in DB
      const subscription = await prisma.subscription.update({
        where: { userId },
        data: { 
          planType: plan,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // Get updated user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      const newToken = jwt.sign(
        {
          userId: user!.id,
          email: user!.email,
          name: user!.name,
          plan: subscription.planType
        },
        process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      return res.json({
        token: newToken,
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          plan: subscription.planType,
          isPaid: subscription.planType !== 'FREE'
        }
      });
    } catch (error: any) {
      console.error('Update plan error:', error);
      return res.status(500).json({ error: 'Failed to update plan: ' + error.message });
    }
  }
};
