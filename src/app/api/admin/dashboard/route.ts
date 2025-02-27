import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Order, MenuItem, Discount } from '@prisma/client';

export async function GET() {
  try {
    // Get total orders and their statuses
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        finalTotal: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Get last 10 orders for recent orders list
    });

    // Get menu items count and availability
    const menuItems = await prisma.menuItem.findMany({
      select: {
        id: true,
        isAvailable: true,
      },
    });

    // Get active discounts
    const discounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        validUntil: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        validUntil: true,
      },
    });

    // Calculate dashboard metrics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
    const totalMenuItems = menuItems.length;
    const lowStockItems = menuItems.filter((item) => !item.isAvailable).length;
    const activeDiscounts = discounts.length;
    const endingSoonDiscounts = discounts.filter(
      (discount) => 
        new Date(discount.validUntil).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
    ).length;

    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = orders
      .filter((order) => new Date(order.createdAt) >= today)
      .reduce((sum, order) => sum + (order.finalTotal || 0), 0);

    // Get recent orders with more details
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            username: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      metrics: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
        },
        menuItems: {
          total: totalMenuItems,
          lowStock: lowStockItems,
        },
        discounts: {
          active: activeDiscounts,
          endingSoon: endingSoonDiscounts,
        },
        revenue: {
          today: todayRevenue,
        },
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customer: {
          name: order.user.username,
          phone: order.user.phone,
        },
        status: order.status,
        total: order.finalTotal,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 