import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

// Zod validation for subscription plan
const planSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().min(0, 'Price must be a positive number'),
  interval: z.enum(['monthly', 'yearly']),
  maxStudents: z.number().int().min(1, 'Max students must be at least 1'),
  maxTeachers: z.number().int().min(1, 'Max teachers must be at least 1'),
  features: z.array(z.string()).min(1, 'Please select at least one feature'),
});

// 1. Get SaaS-wide Analytics
export const getSaaSAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalSchools = await prisma.school.count();
    const approvedSchools = await prisma.school.count({ where: { status: 'APPROVED' } });
    const pendingSchools = await prisma.school.count({ where: { status: 'PENDING' } });
    const suspendedSchools = await prisma.school.count({ where: { status: 'SUSPENDED' } });

    // Calculate total revenue from successful payments
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESSFUL' },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      include: {
        school: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get active subscription counts
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    res.status(200).json({
      analytics: {
        totalSchools,
        statusCounts: {
          approved: approvedSchools,
          pending: pendingSchools,
          suspended: suspendedSchools,
        },
        totalRevenue,
        activeSubscriptions,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          schoolName: p.school.name,
          schoolSlug: p.school.slug,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          gateway: p.gateway,
          reference: p.reference,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('GetSaaSAnalytics Error:', error);
    res.status(500).json({ error: 'Internal server error calculating analytics.' });
  }
};

// 2. Get Subscription Plans
export const getSubscriptionPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    // Parse features back to array since we stored them as JSON
    const parsedPlans = plans.map(p => ({
      ...p,
      price: Number(p.price),
      features: JSON.parse(p.features as string),
    }));

    res.status(200).json({ plans: parsedPlans });
  } catch (error) {
    console.error('GetSubscriptionPlans Error:', error);
    res.status(500).json({ error: 'Internal server error fetching plans.' });
  }
};

// 3. Create Subscription Plan
export const createSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = planSchema.parse(req.body);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        price: parsedData.price,
        interval: parsedData.interval,
        maxStudents: parsedData.maxStudents,
        maxTeachers: parsedData.maxTeachers,
        features: JSON.stringify(parsedData.features),
      },
    });

    res.status(201).json({
      message: 'Subscription plan created successfully.',
      plan: {
        ...plan,
        price: Number(plan.price),
        features: parsedData.features,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateSubscriptionPlan Error:', error);
    res.status(500).json({ error: 'Internal server error creating plan.' });
  }
};

// 4. Update Subscription Plan
export const updateSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = planSchema.parse(req.body);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found.' });
      return;
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: parsedData.name,
        description: parsedData.description,
        price: parsedData.price,
        interval: parsedData.interval,
        maxStudents: parsedData.maxStudents,
        maxTeachers: parsedData.maxTeachers,
        features: JSON.stringify(parsedData.features),
      },
    });

    res.status(200).json({
      message: 'Subscription plan updated successfully.',
      plan: {
        ...updatedPlan,
        price: Number(updatedPlan.price),
        features: parsedData.features,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateSubscriptionPlan Error:', error);
    res.status(500).json({ error: 'Internal server error updating plan.' });
  }
};

// 5. Delete Subscription Plan
export const deleteSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found.' });
      return;
    }

    // Check if any subscriptions are active on this plan
    const activeSubscribersCount = await prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (activeSubscribersCount > 0) {
      res.status(400).json({
        error: `Cannot delete plan. It has ${activeSubscribersCount} active subscribers.`,
      });
      return;
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Subscription plan deleted successfully.',
    });
  } catch (error) {
    console.error('DeleteSubscriptionPlan Error:', error);
    res.status(500).json({ error: 'Internal server error deleting plan.' });
  }
};
