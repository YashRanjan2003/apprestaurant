import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET single menu item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: params.id },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Failed to fetch menu item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

// PATCH update menu item
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data,
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.menuItem.delete({
      where: { id: params.id },
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