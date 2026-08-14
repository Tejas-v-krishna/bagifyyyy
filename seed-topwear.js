const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const topwear = await prisma.product.create({
    data: {
      name: "Y2K CYBER HOODIE",
      brand: "BAGIFYYYY",
      price: 138,
      description: "Signature details and heavyweight construction. Features classic boxy fit with slightly dropped shoulders.",
      category: "topwears",
      isNew: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop" },
          { url: "https://images.unsplash.com/photo-1572495641004-28421ae52e52?q=80&w=1000&auto=format&fit=crop" }
        ]
      },
      variants: {
        create: [
          { size: "44", color: "STONE WHITE", stock: 10 },
          { size: "46", color: "STONE WHITE", stock: 10 },
          { size: "48", color: "STONE WHITE", stock: 10 },
          { size: "50", color: "STONE WHITE", stock: 10 },
          { size: "44", color: "CHARCOAL BLACK", stock: 10 },
          { size: "46", color: "CHARCOAL BLACK", stock: 10 },
          { size: "48", color: "CHARCOAL BLACK", stock: 10 },
          { size: "50", color: "CHARCOAL BLACK", stock: 10 },
        ]
      }
    },
    include: {
      images: true,
      variants: true
    }
  });

  console.log("Created topwear product:", topwear.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
