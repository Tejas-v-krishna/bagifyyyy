import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const products = [
  {
    name: "Chrome Logo Hoodie",
    description: "Heavyweight 400gsm cotton fleece hoodie featuring our signature chrome-effect logo print on the chest. Designed with a dropped shoulder, relaxed fit, and oversized hood for the ultimate early 2000s silhouette.",
    price: 3499,
    brand: "BAGIFYYYY ARCHIVE",
    category: "topwears",
    isNew: true,
    isBestSeller: true,
    images: [
      "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
      "/assets/ai/prod_flat_4_cyberzip_1786661014807.jpg"
    ],
    variants: [
      { color: "Onyx Black", size: "S", stock: 15 },
      { color: "Onyx Black", size: "M", stock: 25 },
      { color: "Onyx Black", size: "L", stock: 30 },
      { color: "Onyx Black", size: "XL", stock: 10 },
      { color: "Chrome Gray", size: "M", stock: 20 },
      { color: "Chrome Gray", size: "L", stock: 15 },
    ]
  },
  {
    name: "Acid Wash Cyber Cargo Pants",
    description: "Baggy acid wash cargo pants with multiple utility pockets, adjustable drawstrings at the waist and ankles. Inspired by classic cyber-rave culture.",
    price: 3999,
    brand: "BAGIFYYYY ARCHIVE",
    category: "bottomwears",
    isNew: true,
    isBestSeller: true,
    images: [
      "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
      "/assets/ai/prod_flat_2_cargo_1786660985731.jpg"
    ],
    variants: [
      { color: "Acid Black", size: "S", stock: 10 },
      { color: "Acid Black", size: "M", stock: 18 },
      { color: "Acid Black", size: "L", stock: 12 },
    ]
  },
  {
    name: "Metallic Star Baby Tee",
    description: "Cropped, tight-fitting baby tee featuring a metallic star graphic. Made from a stretchy, comfortable cotton blend.",
    price: 1899,
    brand: "BAGIFYYYY ARCHIVE",
    category: "topwears",
    isNew: true,
    isBestSeller: false,
    images: [
      "/assets/ai/prod_model_3_babytee_1786659519157.jpg",
      "/assets/ai/prod_flat_3_babytee_1786661001713.jpg"
    ],
    variants: [
      { color: "Pure White", size: "XS", stock: 20 },
      { color: "Pure White", size: "S", stock: 25 },
      { color: "Pure White", size: "M", stock: 15 },
      { color: "Cyber Pink", size: "S", stock: 12 },
      { color: "Cyber Pink", size: "M", stock: 10 },
    ]
  },
  {
    name: "Oversized Cyber Zip-Up Jacket",
    description: "Oversized full-zip hoodie with technical paneling and metallic hardware. Heavyweight thermal construction for winter streetwear layering.",
    price: 4499,
    brand: "BAGIFYYYY ARCHIVE",
    category: "topwears",
    isNew: true,
    isBestSeller: true,
    images: [
      "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
      "/assets/ai/prod_flat_4_cyberzip_1786661014807.jpg"
    ],
    variants: [
      { color: "Silver Slate", size: "M", stock: 14 },
      { color: "Silver Slate", size: "L", stock: 22 },
      { color: "Silver Slate", size: "XL", stock: 8 },
    ]
  },
  {
    name: "Futuristic Nylon Shoulder Bag",
    description: "Sleek, asymmetrical shoulder bag crafted from durable ballistic nylon with chrome buckle accents and adjustable strap.",
    price: 2499,
    brand: "BAGIFYYYY ARCHIVE",
    category: "accessories",
    isNew: true,
    isBestSeller: false,
    images: [
      "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg",
      "/assets/ai/prod_flat_5_shoulderbag_1786661035900.jpg"
    ],
    variants: [
      { color: "Stealth Black", size: "ONE SIZE", stock: 40 },
    ]
  },
  {
    name: "Raw Hem Heavy Denim Jacket",
    description: "Distressed boxy denim jacket with custom metal shank buttons, frayed raw hemline, and subtle laser-etched Y2K cross insignia on the back.",
    price: 4999,
    brand: "BAGIFYYYY ARCHIVE",
    category: "topwears",
    isNew: false,
    isBestSeller: true,
    images: [
      "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
      "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg"
    ],
    variants: [
      { color: "Vintage Indigo", size: "M", stock: 15 },
      { color: "Vintage Indigo", size: "L", stock: 18 },
      { color: "Vintage Indigo", size: "XL", stock: 7 },
    ]
  },
  {
    name: "Chrome Star Studded Leather Belt",
    description: "Premium full-grain Italian leather belt adorned with 3D chrome star studs and a heavy cast brushed steel buckle.",
    price: 1999,
    brand: "BAGIFYYYY ARCHIVE",
    category: "accessories",
    isNew: true,
    isBestSeller: true,
    images: [
      "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
      "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg"
    ],
    variants: [
      { color: "Matte Black", size: "30-34", stock: 25 },
      { color: "Matte Black", size: "34-38", stock: 20 },
    ]
  }
];

async function seed() {
  console.log('🌱 Seeding Turso Cloud Database with BAGIFYYYY Product Archive...');

  for (const p of products) {
    const productId = crypto.randomUUID();
    
    // Insert Product
    await turso.execute({
      sql: `INSERT INTO Product (id, name, description, price, brand, category, isNew, isBestSeller, isSoldOut, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [productId, p.name, p.description, p.price, p.brand, p.category, p.isNew ? 1 : 0, p.isBestSeller ? 1 : 0, 0]
    });

    // Insert Images
    for (const imgUrl of p.images) {
      await turso.execute({
        sql: `INSERT INTO Image (id, url, productId) VALUES (?, ?, ?)`,
        args: [crypto.randomUUID(), imgUrl, productId]
      });
    }

    // Insert Variants
    for (const v of p.variants) {
      await turso.execute({
        sql: `INSERT INTO Variant (id, color, size, stock, productId) VALUES (?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), v.color, v.size, v.stock, productId]
      });
    }
  }

  // Insert Default Subscriber
  await turso.execute({
    sql: `INSERT OR IGNORE INTO Subscriber (id, email, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    args: [crypto.randomUUID(), 'admin@bagifyyyy.in']
  });

  console.log('🎉 Turso Cloud Database successfully seeded with 7 high-res fashion products, images, variants & categories!');
}

seed().catch(console.error);
