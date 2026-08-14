import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.variant.deleteMany()
  await prisma.image.deleteMany()
  await prisma.product.deleteMany()

  // Create products
  const products = [
    {
      name: "Chrome Logo Hoodie",
      description: "Heavyweight 400gsm cotton fleece hoodie featuring our signature chrome-effect logo print on the chest. Designed with a dropped shoulder, relaxed fit, and oversized hood for the ultimate early 2000s silhouette.",
      price: 85.00,
      brand: "Y2K ARCHIVE",
      category: "men",
      isNew: true,
      images: [
        "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
        "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
      ],
      colors: ["black", "gray", "white"],
      sizes: ["S", "M", "L", "XL"]
    },
    {
      name: "Acid Wash Cargo Pants",
      description: "Baggy acid wash cargo pants with multiple utility pockets, adjustable drawstrings at the waist and ankles. Inspired by classic cyber-rave culture.",
      price: 120.00,
      brand: "Y2K ARCHIVE",
      category: "men",
      isNew: true,
      images: [
        "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
        "/assets/ai/prod_flat_2_cargo_1786660985731.jpg",
      ],
      colors: ["#333333"],
      sizes: ["S", "M", "L"]
    },
    {
      name: "Star Baby Tee",
      description: "Cropped, tight-fitting baby tee featuring a metallic star graphic. Made from a stretchy, comfortable cotton blend.",
      price: 45.00,
      brand: "Y2K ARCHIVE",
      category: "women",
      isNew: true,
      images: [
        "/assets/ai/prod_model_3_babytee_1786659519157.jpg",
        "/assets/ai/prod_flat_3_babytee_1786661001713.jpg",
      ],
      colors: ["white", "pink"],
      sizes: ["XS", "S", "M"]
    },
    {
      name: "Oversized Cyber Zip-Up",
      description: "Oversized full-zip hoodie with technical paneling and metallic hardware. Perfect for layering.",
      price: 95.00,
      brand: "Y2K ARCHIVE",
      category: "unisex",
      isNew: true,
      images: [
        "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
        "/assets/ai/prod_flat_4_cyberzip_1786661014807.jpg",
      ],
      colors: ["black", "silver"],
      sizes: ["M", "L", "XL"]
    },
    {
      name: "Metallic Shoulder Bag",
      description: "Faux leather shoulder bag with a high-shine metallic finish and chunky hardware. Features our signature logo plate.",
      price: 65.00,
      brand: "Y2K ARCHIVE",
      category: "accessories",
      isNew: true,
      images: [
        "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg",
        "/assets/ai/prod_flat_5_shoulderbag_1786661035900.jpg",
      ],
      colors: ["silver"],
      sizes: ["OS"]
    },
    {
      name: "Vintage Denim Jacket",
      description: "Distressed vintage denim jacket with custom embroidery detail. A true archive find sourced from Tokyo flea markets.",
      price: 145.00,
      brand: "Y2K ARCHIVE",
      category: "unisex",
      isNew: true,
      images: [
        "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
        "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
      ],
      colors: ["blue", "indigo"],
      sizes: ["S", "M", "L"]
    },
    {
      name: "Y2K Chrome Belt",
      description: "Chunky chrome-finish statement belt with oversized logo buckle. The finishing touch for any archive fit.",
      price: 55.00,
      brand: "Y2K ARCHIVE",
      category: "accessories",
      isNew: false,
      images: [
        "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
        "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
      ],
      colors: ["silver"],
      sizes: ["OS"]
    },
    {
      name: "Rave Mesh Top",
      description: "Sheer mesh long-sleeve top with subtle shimmer weave. Designed for layering or wearing solo at the club.",
      price: 55.00,
      brand: "Y2K ARCHIVE",
      category: "women",
      isNew: true,
      images: [
        "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
      ],
      colors: ["black", "white"],
      sizes: ["XS", "S", "M"]
    },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        brand: p.brand,
        category: p.category,
        isNew: p.isNew,
        images: {
          create: p.images.map(url => ({ url }))
        },
        variants: {
          create: p.colors.flatMap(color => 
            p.sizes.map(size => ({
              color,
              size,
              stock: Math.floor(Math.random() * 50) + 10
            }))
          )
        }
      }
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
