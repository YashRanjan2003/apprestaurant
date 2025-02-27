import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      name: 'Test User 1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      name: 'Test User 2',
    },
  });

  // Create restaurants
  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 'rest-1' },
    update: {},
    create: {
      id: 'rest-1',
      name: 'The Spice Garden',
      description: 'Authentic Indian cuisine with a modern twist',
      imageUrl: 'https://example.com/spice-garden.jpg',
    },
  });

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'rest-2' },
    update: {},
    create: {
      id: 'rest-2',
      name: 'Sushi Master',
      description: 'Premium Japanese sushi and sashimi',
      imageUrl: 'https://example.com/sushi-master.jpg',
    },
  });

  // Create some favorite relationships
  const favorite1 = await prisma.favorite.upsert({
    where: {
      userId_restaurantId: {
        userId: user1.id,
        restaurantId: restaurant1.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      restaurantId: restaurant1.id,
    },
  });

  const favorite2 = await prisma.favorite.upsert({
    where: {
      userId_restaurantId: {
        userId: user2.id,
        restaurantId: restaurant2.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      restaurantId: restaurant2.id,
    },
  });

  console.log({
    users: [user1, user2],
    restaurants: [restaurant1, restaurant2],
    favorites: [favorite1, favorite2],
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