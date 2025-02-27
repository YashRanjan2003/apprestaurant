import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create or update admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      phone: '+1234567890',
      email: 'admin@restaurant.com',
      role: 'ADMIN',
    },
  });

  // Create or update menu items
  const masalaDosa = await prisma.menuItem.upsert({
    where: { id: 'masala-dosa' },
    update: {},
    create: {
      id: 'masala-dosa',
      name: 'Masala Dosa',
      description: 'Crispy rice crepe filled with spiced potato mixture',
      price: 8.99,
      category: 'South Indian',
      imageUrl: '/images/masala-dosa.jpg',
      isVeg: true,
      rating: 4.5,
      ratingCount: 100,
      originalPrice: 10.99,
      offer: '20% off',
      isAvailable: true,
    },
  });

  const butterChicken = await prisma.menuItem.upsert({
    where: { id: 'butter-chicken' },
    update: {},
    create: {
      id: 'butter-chicken',
      name: 'Butter Chicken',
      description: 'Tender chicken in rich tomato and butter gravy',
      price: 12.99,
      category: 'Main Course',
      imageUrl: '/images/butter-chicken.jpg',
      isVeg: false,
      rating: 4.7,
      ratingCount: 150,
      originalPrice: 14.99,
      offer: '15% off',
      isAvailable: true,
    },
  });

  // Create or update discount codes
  const welcomeDiscount = await prisma.discount.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      type: 'PERCENTAGE',
      value: 50,
      minOrderValue: 20,
      maxDiscount: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Get 50% off on your first order',
      isActive: true,
      usageLimit: 1000,
      usageCount: 0,
      applicableCategories: ['South Indian', 'Main Course'],
    },
  });

  console.log({
    admin,
    menuItems: {
      masalaDosa,
      butterChicken,
    },
    discounts: {
      welcomeDiscount,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 