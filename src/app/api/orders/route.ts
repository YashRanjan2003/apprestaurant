import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
}

const orderInclude = {
  items: {
    include: {
      menuItem: {
        select: {
          name: true,
          price: true
        }
      }
    }
  },
  user: {
    select: {
      username: true,
      phone: true
    }
  }
} as const;

// GET user's orders
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: orderInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST new order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();

    // Get user ID from email
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.random().toString().slice(2, 8);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderType: data.orderType,
        deliveryAddress: data.deliveryAddress,
        scheduledTime: data.scheduledTime,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'CARD' ? 'COMPLETED' : 'PENDING',
        otp,
        itemTotal: data.itemTotal,
        gst: data.gst,
        platformFee: data.platformFee,
        deliveryCharge: data.deliveryCharge,
        finalTotal: data.finalTotal,
        items: {
          create: data.items.map((item: OrderItemInput) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: orderInclude,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 