import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { Redis } from '@upstash/redis';

// Define types
type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BOGO';

interface DiscountData {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  applicableCategories: string[];
  isActive: boolean;
  validUntil: Date;
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

const CACHE_DURATION = 5 * 60; // 5 minutes in seconds
const BATCH_SIZE = 100;
const ERROR_RETRY_COUNT = 3;

// Implement connection pooling for Prisma
const prismaWithRetry = async <T>(
  operation: () => Promise<T>,
  retries = ERROR_RETRY_COUNT
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return prismaWithRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Optimized batch update with retry logic
async function processPendingUpdates(updates: { id: string; count: number }[]) {
  if (updates.length === 0) return;

  const batchedUpdates = updates.reduce((acc, { id, count }) => {
    acc[id] = (acc[id] || 0) + count;
    return acc;
  }, {} as Record<string, number>);

  const updatePromises = Object.entries(batchedUpdates).map(([id, count]) =>
    prismaWithRetry(() =>
      prisma.discount.update({
        where: { id },
        data: { usageCount: { increment: count } },
        select: { id: true, usageCount: true }, // Optimize query by selecting only needed fields
      })
    )
  );

  try {
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Failed to update discount usage counts:', error);
  }
}

// Optimized discount validation with caching
export async function POST(request: Request) {
  try {
    const { code, cartTotal, categories } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase();
    const cacheKey = `discount:${upperCode}`;

    // Try to get discount from Redis cache
    const cachedDiscount = await redis.get(cacheKey);
    if (cachedDiscount) {
      const discount = JSON.parse(cachedDiscount as string) as DiscountData;
      
      // Validate cached discount
      if (!discount.isActive || new Date(discount.validUntil) < new Date()) {
        await redis.del(cacheKey);
      } else {
        const validationResult = validateDiscount(discount, cartTotal, categories);
        if (validationResult.error) {
          return NextResponse.json(validationResult, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          discount: {
            ...discount,
            discountAmount: validationResult.discountAmount,
          },
        });
      }
    }

    // If not in cache, fetch from database with optimized query
    const discount = await prismaWithRetry(() =>
      prisma.discount.findUnique({
        where: {
          code: upperCode,
        },
        select: {
          id: true,
          code: true,
          type: true,
          value: true,
          minOrderValue: true,
          maxDiscount: true,
          usageLimit: true,
          usageCount: true,
          applicableCategories: true,
          isActive: true,
          validUntil: true,
        },
      })
    ) as DiscountData | null;

    if (!discount || !discount.isActive || new Date(discount.validUntil) < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired discount code' },
        { status: 404 }
      );
    }

    // Cache the discount
    await redis.set(cacheKey, JSON.stringify(discount), {
      ex: CACHE_DURATION,
    });

    const validationResult = validateDiscount(discount, cartTotal, categories);
    if (validationResult.error) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Update usage count in background
    queueUsageUpdate(discount.id);

    return NextResponse.json({
      success: true,
      discount: {
        ...discount,
        discountAmount: validationResult.discountAmount,
      },
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}

// Optimized discount validation logic
function validateDiscount(
  discount: DiscountData,
  cartTotal: number,
  categories: string[]
) {
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return {
      error: 'This discount code has reached its usage limit',
    };
  }

  if (discount.minOrderValue && cartTotal < discount.minOrderValue) {
    return {
      error: `Minimum order value of ₹${discount.minOrderValue} required for this discount`,
      minOrderValue: discount.minOrderValue,
    };
  }

  if (
    !discount.applicableCategories.includes('All') &&
    !categories.some(category => discount.applicableCategories.includes(category))
  ) {
    return {
      error: 'This discount is not applicable to items in your cart',
    };
  }

  let discountAmount = 0;
  if (discount.type === 'PERCENTAGE') {
    discountAmount = (cartTotal * discount.value) / 100;
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }
  } else if (discount.type === 'FIXED') {
    discountAmount = discount.value;
  }

  return { discountAmount };
}

// Optimized usage count update queue
let pendingUpdates: { id: string; count: number }[] = [];
let updateTimeout: NodeJS.Timeout | null = null;

function queueUsageUpdate(id: string) {
  pendingUpdates.push({ id, count: 1 });

  if (pendingUpdates.length >= BATCH_SIZE) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    const updates = [...pendingUpdates];
    pendingUpdates = [];
    processPendingUpdates(updates);
  } else if (!updateTimeout) {
    updateTimeout = setTimeout(() => {
      const updates = [...pendingUpdates];
      pendingUpdates = [];
      updateTimeout = null;
      processPendingUpdates(updates);
    }, 1000);
  }
} 