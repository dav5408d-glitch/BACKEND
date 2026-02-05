import express from 'express';

const router = express.Router();

/**
 * Lemon Squeezy Webhook Handler
 * Endpoint: POST /api/webhooks/lemon-squeezy
 * 
 * This webhook receives payment notifications from Lemon Squeezy:
 * - subscription.created
 * - subscription.updated
 * - subscription.resumed
 * - subscription.expired
 * - subscription.paused
 * - subscription.cancelled
 */

interface LemonSqueezyEvent {
  meta: {
    event_name: string;
    custom_data?: {
      userId: string;
      userEmail: string;
      plan: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      customer_email?: string;
      pause_at?: string;
      resume_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
      [key: string]: any;
    };
  };
}

router.post('/lemon-squeezy', async (req: any, res: any) => {
  try {
    const event: LemonSqueezyEvent = req.body;
    const eventName = event.meta.event_name;

    console.log('Webhook Lemon Squeezy reçu:', eventName);

    // Verify webhook signature (in production)
    // const isValid = verifyWebhookSignature(req);
    // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    const customData = event.meta.custom_data;
    const status = event.data.attributes.status;

    // Handle different event types
    switch (eventName) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.resumed':
        await handleSubscriptionActive(customData, status);
        break;

      case 'subscription.expired':
      case 'subscription.cancelled':
      case 'subscription.paused':
        await handleSubscriptionInactive(customData);
        break;

      default:
        console.log('Unknown webhook event:', eventName);
    }

    res.json({ success: true, event: eventName });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle subscription activation events
 * In production: update DB subscription status
 */
async function handleSubscriptionActive(
  customData: any,
  status: string
): Promise<void> {
  if (!customData) return;

  console.log(`Plan activé pour ${customData.userEmail}: ${customData.plan}`);

  // TODO: Update user subscription in DB
  // const user = await prisma.user.findUnique({ where: { email: customData.userEmail } });
  // if (user) {
  //   await prisma.subscription.upsert({
  //     where: { userId: user.id },
  //     update: { 
  //       planType: customData.plan,
  //       status: 'active',
  //       currentPeriodStart: new Date(),
  //       currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
  //     },
  //     create: {
  //       userId: user.id,
  //       planType: customData.plan,
  //       status: 'active'
  //     }
  //   });
  // }
}

/**
 * Handle subscription cancellation/expiration events
 * In production: reset user to FREE plan
 */
async function handleSubscriptionInactive(customData: any): Promise<void> {
  if (!customData) return;

  console.log(`Plan révoqué pour ${customData.userEmail}`);

  // TODO: Reset user to FREE in DB
  // const user = await prisma.user.findUnique({ where: { email: customData.userEmail } });
  // if (user) {
  //   await prisma.subscription.update({
  //     where: { userId: user.id },
  //     data: { 
  //       planType: 'FREE',
  //       status: 'inactive',
  //       currentPeriodEnd: new Date()
  //     }
  //   });
  // }
}

export default router;
