import { PrismaClient, Role, DiscountType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      phone: '+1234567890',
      email: 'admin@restaurant.com',
      role: Role.ADMIN,
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

  const paneerTikka = await prisma.menuItem.upsert({
    where: { id: 'paneer-tikka' },
    update: {},
    create: {
      id: 'paneer-tikka',
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese with spices',
      price: 10.99,
      category: 'Starters',
      imageUrl: '/images/paneer-tikka.jpg',
      isVeg: true,
      rating: 4.4,
      ratingCount: 80,
      originalPrice: 12.99,
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
      type: DiscountType.PERCENTAGE,
      value: 50,
      minOrderValue: 20,
      maxDiscount: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Get 50% off on your first order',
      isActive: true,
      usageLimit: 1000,
      usageCount: 0,
      applicableCategories: ['South Indian', 'Main Course', 'Starters'],
    },
  });

  const flat100 = await prisma.discount.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: {
      code: 'FLAT100',
      type: DiscountType.FIXED,
      value: 100,
      minOrderValue: 500,
      maxDiscount: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      description: 'Get ₹100 off on orders above ₹500',
      isActive: true,
      usageLimit: 500,
      usageCount: 0,
      applicableCategories: ['All'],
    },
  });

  console.log({
    admin,
    menuItems: {
      masalaDosa,
      butterChicken,
      paneerTikka,
    },
    discounts: {
      welcomeDiscount,
      flat100,
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