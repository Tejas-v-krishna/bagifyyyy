import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

export type Subcategory = {
  id: string;
  category: string;
  name: string;
  slug: string;
  createdAt: string;
};

function getDbClient() {
  const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({
    url,
    authToken,
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch all subcategories for a given category (e.g. "bottomwears")
 */
export async function getSubcategories(category: string): Promise<Subcategory[]> {
  const db = getDbClient();
  const normalized = category.toLowerCase().trim();
  const categoriesToMatch = [
    normalized,
    normalized.replace(/s$/, ""),
    normalized.endsWith("s") ? normalized : `${normalized}s`,
  ];

  try {
    const res = await db.execute({
      sql: `SELECT id, category, name, slug, createdAt FROM Subcategory WHERE category IN (?, ?, ?) ORDER BY name ASC`,
      args: categoriesToMatch,
    });

    return res.rows.map((row) => ({
      id: String(row.id),
      category: String(row.category),
      name: String(row.name),
      slug: String(row.slug),
      createdAt: String(row.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return [];
  }
}

/**
 * Fetch all subcategories across the catalogue
 */
export async function getAllSubcategories(): Promise<Subcategory[]> {
  const db = getDbClient();
  try {
    const res = await db.execute(`SELECT id, category, name, slug, createdAt FROM Subcategory ORDER BY category ASC, name ASC`);
    return res.rows.map((row) => ({
      id: String(row.id),
      category: String(row.category),
      name: String(row.name),
      slug: String(row.slug),
      createdAt: String(row.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching all subcategories:", error);
    return [];
  }
}

/**
 * Create a new subcategory (e.g. category="bottomwears", name="Baggy")
 */
export async function createSubcategory(category: string, name: string): Promise<Subcategory | null> {
  const db = getDbClient();
  const cat = category.toLowerCase().trim();
  const trimmedName = name.trim();
  const slug = slugify(trimmedName);

  if (!cat || !trimmedName || !slug) return null;

  const id = randomUUID();
  try {
    await db.execute({
      sql: `INSERT INTO Subcategory (id, category, name, slug) VALUES (?, ?, ?, ?)`,
      args: [id, cat, trimmedName, slug],
    });

    return {
      id,
      category: cat,
      name: trimmedName,
      slug,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating subcategory:", error);
    // Might fail if unique constraint violated (already exists)
    const existing = await db.execute({
      sql: `SELECT id, category, name, slug, createdAt FROM Subcategory WHERE category = ? AND slug = ? LIMIT 1`,
      args: [cat, slug],
    });
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        id: String(row.id),
        category: String(row.category),
        name: String(row.name),
        slug: String(row.slug),
        createdAt: String(row.createdAt),
      };
    }
    return null;
  }
}

/**
 * Delete a subcategory by ID
 */
export async function deleteSubcategory(id: string): Promise<boolean> {
  const db = getDbClient();
  try {
    // Optionally unset subcategory on products that used this subcategory
    const subRes = await db.execute({
      sql: `SELECT slug, category FROM Subcategory WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (subRes.rows.length > 0) {
      const slug = String(subRes.rows[0].slug);
      const cat = String(subRes.rows[0].category);
      await db.execute({
        sql: `UPDATE Product SET subcategory = NULL WHERE category = ? AND subcategory = ?`,
        args: [cat, slug],
      });
    }

    await db.execute({
      sql: `DELETE FROM Subcategory WHERE id = ?`,
      args: [id],
    });
    return true;
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return false;
  }
}

/**
 * Update a product's subcategory directly in DB
 */
export async function updateProductSubcategory(productId: string, subcategory: string | null): Promise<boolean> {
  const db = getDbClient();
  try {
    const slug = subcategory ? slugify(subcategory) : null;
    await db.execute({
      sql: `UPDATE Product SET subcategory = ? WHERE id = ?`,
      args: [slug, productId],
    });
    return true;
  } catch (error) {
    console.error("Error updating product subcategory:", error);
    return false;
  }
}
