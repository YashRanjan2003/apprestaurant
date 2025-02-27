import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
} 