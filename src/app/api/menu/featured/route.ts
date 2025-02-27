import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get menu items with high ratings or special offers
    const featuredItems = await prisma.menuItem.findMany({
      where: {
        OR: [
          { rating: { gte: 4.5 } },
          { offer: { not: null } },
        ],
        isAvailable: true,
      },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' },
      ],
      take: 4, // Limit to 4 featured items
    });

    return NextResponse.json(featuredItems);
  } catch (error) {
    console.error('Failed to fetch featured items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
} 