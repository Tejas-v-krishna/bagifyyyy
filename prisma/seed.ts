import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Clear existing catalog data
  await prisma.review.deleteMany();
  await prisma.bundleProduct.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockNotification.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.image.deleteMany();
  await prisma.product.deleteMany();

  const products = [
    {
      name: "Chrome Logo Hoodie",
      description: "450gsm fleece hoodie with a chrome chest logo, dropped shoulders, a double-layer hood, and a boxy fit.",
      price: 3499,
      brand: "BAGIFYYYY AW24",
      category: "topwears",
      isNew: true,
      isBestSeller: true,
      images: [
        "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
        "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
      ],
      colors: ["Acid Black", "Gunmetal Grey", "Bone White"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "Acid Wash Cyber Cargo Pants",
      description: "Mineral-washed cotton twill cargos with eight pockets, ankle cinch cords, and articulated knees.",
      price: 3999,
      brand: "BAGIFYYYY AW24",
      category: "bottomwears",
      isNew: true,
      isBestSeller: true,
      images: [
        "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
        "/assets/ai/prod_flat_2_cargo_1786660985731.jpg",
      ],
      colors: ["Mineral Charcoal", "Faded Olive"],
      sizes: ["28", "30", "32", "34", "36"],
    },
    {
      name: "Metallic Star Baby Tee",
      description: "Stretch cotton baby tee with a chrome star graphic, a clean neckline, and contrast stitching.",
      price: 1899,
      brand: "BAGIFYYYY ARCHIVE",
      category: "topwears",
      isNew: true,
      isBestSeller: false,
      images: [
        "/assets/ai/prod_model_3_babytee_1786659519157.jpg",
        "/assets/ai/prod_flat_3_babytee_1786661001713.jpg",
      ],
      colors: ["Stark White", "Cyber Pink", "Shadow Black"],
      sizes: ["XS", "S", "M", "L"],
    },
    {
      name: "Oversized Cyber Zip-Up Jacket",
      description: "Heavy fleece zip-up with two-way zips, contrast panels, and stainless-steel pulls.",
      price: 4499,
      brand: "BAGIFYYYY AW24",
      category: "topwears",
      isNew: true,
      isBestSeller: true,
      images: [
        "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
        "/assets/ai/prod_flat_4_cyberzip_1786661014807.jpg",
      ],
      colors: ["Obsidian Black", "Liquid Silver"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "Futuristic Nylon Shoulder Bag",
      description: "Water-resistant ripstop sling bag with a chrome buckle, quick-release strap, and two sealed compartments.",
      price: 2499,
      brand: "BAGIFYYYY ACCESSORIES",
      category: "accessories",
      isNew: true,
      isBestSeller: false,
      images: [
        "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg",
        "/assets/ai/prod_flat_5_shoulderbag_1786661035900.jpg",
      ],
      colors: ["Chrome Silver", "Matte Black"],
      sizes: ["OS"],
    },
    {
      name: "Raw Hem Heavy Denim Jacket",
      description: "14.5oz Japanese selvedge denim trucker with worn abrasions, gunmetal buttons, and a raw frayed hem.",
      price: 4999,
      brand: "BAGIFYYYY ARCHIVE",
      category: "topwears",
      isNew: false,
      isBestSeller: true,
      images: [
        "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
        "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
      ],
      colors: ["Vintage Indigo", "Washed Blue"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "Chrome Star Studded Leather Belt",
      description: "Full-grain Italian leather belt with chrome pyramid studs, star details, and a heavy roller buckle.",
      price: 1999,
      brand: "BAGIFYYYY ACCESSORIES",
      category: "accessories",
      isNew: false,
      isBestSeller: true,
      images: [
        "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
        "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
      ],
      colors: ["Chrome Black"],
      sizes: ["S/M (28-32)", "L/XL (34-38)"],
    },

    {
      name: "Vintage Baggy Skater Jeans",
      description: "Wide-leg denim from the 2000s with a faded wash, reinforced heel guards, and a puddle hem.",
      price: 3699,
      brand: "BAGIFYYYY ARCHIVE",
      category: "bottomwears",
      isNew: false,
      isBestSeller: true,
      images: [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1200&auto=format&fit=crop",
      ],
      colors: ["Acid Tint Blue", "Faded Black"],
      sizes: ["28", "30", "32", "34", "36"],
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        brand: p.brand,
        category: p.category,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
        images: {
          create: p.images.map((url) => ({ url })),
        },
        variants: {
          create: p.colors.flatMap((color) =>
            p.sizes.map((size) => ({
              color,
              size,
              stock: Math.floor(Math.random() * 20) + 10,
            }))
          ),
        },
      },
    });
  }

  console.log(`Database re-seeded successfully with ${products.length} products!`);

  // ── Seed Demo Bundles ─────────────────────────────────────────────────────
  const hoodie = await prisma.product.findFirst({ where: { name: { contains: 'Chrome Logo Hoodie' } } });
  const cargo  = await prisma.product.findFirst({ where: { name: { contains: 'Acid Wash Cyber Cargo' } } });
  const tee    = await prisma.product.findFirst({ where: { name: { contains: 'Metallic Star Baby Tee' } } });
  const belt   = await prisma.product.findFirst({ where: { name: { contains: 'Chrome Star Studded Leather Belt' } } });
  const bag    = await prisma.product.findFirst({ where: { name: { contains: 'Futuristic Nylon Shoulder Bag' } } });
  const jacket = await prisma.product.findFirst({ where: { name: { contains: 'Raw Hem Heavy Denim Jacket' } } });

  // Bundle 1: Full Drip (Hoodie + Cargo + Tee)
  const drip = [hoodie, cargo, tee].filter(Boolean);
  if (drip.length >= 2) {
    const b1 = await prisma.bundle.create({
      data: {
        name: 'The Full Drip',
        description: 'A hoodie, cargos, and baby tee for an easy head-to-toe fit. Take 15% off the set.',
        discount: 15,
      },
    });
    for (const p of drip) {
      await prisma.bundleProduct.create({ data: { bundleId: b1.id, productId: p!.id } });
    }
    console.log('Seeded bundle: The Full Drip');
  }

  // Bundle 2: Cyber Accessories & Denim Stack
  const accItems = [bag, belt, jacket].filter(Boolean);
  if (accItems.length >= 2) {
    const b2 = await prisma.bundle.create({
      data: {
        name: 'Cyber Armor Stack',
        description: 'A denim jacket, studded belt, and nylon shoulder bag. The finishing pieces, 20% off together.',
        discount: 20,
      },
    });
    for (const p of accItems) {
      await prisma.bundleProduct.create({ data: { bundleId: b2.id, productId: p!.id } });
    }
    console.log('Seeded bundle: Cyber Armor Stack');
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
