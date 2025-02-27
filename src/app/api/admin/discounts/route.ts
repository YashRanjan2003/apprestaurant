import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { DiscountType } from '@prisma/client';

// GET all discounts
export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Failed to fetch discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

// POST new discount
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const discount = await prisma.discount.create({
      data: {
        code: data.code,
        type: data.type as DiscountType,
        value: data.value,
        minOrderValue: data.minOrderValue || null,
        maxDiscount: data.maxDiscount || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        description: data.description,
        isActive: data.isActive,
        usageLimit: data.usageLimit || null,
        usageCount: 0,
        applicableCategories: data.applicableCategories || ['All']
      }
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Failed to create discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

// PUT update discount
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...updateData,
        validFrom: new Date(updateData.validFrom),
        validUntil: new Date(updateData.validUntil)
      }
    });
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Failed to update discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

// DELETE discount
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    await prisma.discount.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Discount deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
} 