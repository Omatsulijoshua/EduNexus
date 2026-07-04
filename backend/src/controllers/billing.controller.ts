import { Request, Response } from 'express';
import prisma from '../utils/db';

// ==========================================
// 💳 SCHOOL BILLING PORTAL ENDPOINTS
// ==========================================

export const getActiveBilling = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;

  if (!schoolId) {
    res.status(400).json({ error: 'School context not resolved.' });
    return;
  }

  try {
    // 1. Fetch current subscription details
    const subscription = await prisma.subscription.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      include: { plan: true },
    });

    // 2. Calculate current usage metrics
    const studentCount = await prisma.studentProfile.count({ where: { schoolId } });
    const teacherCount = await prisma.teacherProfile.count({ where: { schoolId } });

    // 3. Fetch past payment transactions
    const payments = await prisma.payment.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch all subscription plans (for upgrading options)
    const plans = await prisma.subscriptionPlan.findMany();

    // Map maxStudents and maxTeachers to studentLimit and teacherLimit for frontend compatibility
    const mappedPlans = plans.map((p) => ({
      ...p,
      studentLimit: p.maxStudents,
      teacherLimit: p.maxTeachers,
    }));

    let mappedSub = null;
    if (subscription) {
      mappedSub = {
        ...subscription,
        plan: {
          ...subscription.plan,
          studentLimit: subscription.plan.maxStudents,
          teacherLimit: subscription.plan.maxTeachers,
        },
      };
    }

    res.status(200).json({
      subscription: mappedSub,
      usage: {
        students: studentCount,
        teachers: teacherCount,
      },
      payments,
      plans: mappedPlans,
    });
  } catch (error) {
    console.error('GetActiveBilling Error:', error);
    res.status(500).json({ error: 'Internal server error fetching billing details.' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.body;

  if (!planId) {
    res.status(400).json({ error: 'planId is required to start checkout session.' });
    return;
  }

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found.' });
      return;
    }

    // Mock checkout URL redirects the admin to the frontend checkout screen with query params
    const checkoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/checkout?planId=${planId}`;

    res.status(200).json({ checkoutUrl });
  } catch (error) {
    console.error('CreateCheckoutSession Error:', error);
    res.status(500).json({ error: 'Internal server error initializing checkout session.' });
  }
};

export const confirmCheckout = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;
  const { planId } = req.body;

  if (!schoolId) {
    res.status(400).json({ error: 'School context not resolved.' });
    return;
  }

  if (!planId) {
    res.status(400).json({ error: 'planId is required to confirm checkout.' });
    return;
  }

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found.' });
      return;
    }

    // Confirm mock payment in a transactional operation
    const result = await prisma.$transaction(async (tx) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30); // 30-day billing cycle

      // Upsert Subscription
      const activeSub = await tx.subscription.findFirst({
        where: { schoolId, status: 'ACTIVE' },
      });

      const subscription = await tx.subscription.upsert({
        where: { id: activeSub?.id || 'new-sub-placeholder' },
        update: {
          planId: plan.id,
          endDate,
          nextBilling: endDate,
        },
        create: {
          schoolId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          nextBilling: endDate,
        },
      });

      // Create Payment log record
      const payment = await tx.payment.create({
        data: {
          schoolId,
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: 'USD',
          status: 'SUCCESSFUL',
          reference: `txn_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
          gateway: 'STRIPE',
        },
      });

      return { subscription, payment };
    });

    res.status(200).json({
      message: 'Subscription checkout confirmed successfully.',
      subscription: result.subscription,
      payment: result.payment,
    });
  } catch (error) {
    console.error('ConfirmCheckout Error:', error);
    res.status(500).json({ error: 'Internal server error confirming subscription checkout.' });
  }
};
