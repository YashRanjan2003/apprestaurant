import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all menu items
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: {
        category: 'asc',
      },
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

// POST new menu item
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const menuItem = await prisma.menuItem.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl,
        isVeg: data.isVeg,
        originalPrice: data.originalPrice,
        offer: data.offer,
        isAvailable: data.isAvailable ?? true,
      },
    });
    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

// PUT update menu item
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Failed to update menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE menu item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Menu item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
} 