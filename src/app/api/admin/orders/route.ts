import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            username: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST new order (for testing purposes)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        orderType: data.orderType,
        deliveryAddress: data.deliveryAddress,
        scheduledTime: data.scheduledTime,
        paymentMethod: data.paymentMethod,
        otp: Math.random().toString().slice(2, 8), // Generate 6-digit OTP
        itemTotal: data.itemTotal,
        gst: data.gst,
        platformFee: data.platformFee,
        deliveryCharge: data.deliveryCharge,
        finalTotal: data.finalTotal,
        items: {
          create: data.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        user: {
          select: {
            username: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 