import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

export type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
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

/**
 * Ensures the Coupon table exists in Turso/LibSQL
 */
export async function ensureCouponTable(): Promise<void> {
  const db = getDbClient();
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Coupon (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discountType TEXT NOT NULL DEFAULT 'PERCENTAGE',
        discountValue REAL NOT NULL,
        minOrderAmount REAL DEFAULT 0,
        maxDiscountAmount REAL,
        usageLimit INTEGER,
        usedCount INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1,
        expiresAt TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Ensure BAGIFY10 exists as a default starter promo if table was just created
    const existing = await db.execute({
      sql: "SELECT id FROM Coupon WHERE code = 'BAGIFY10' LIMIT 1",
      args: [],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO Coupon (id, code, discountType, discountValue, minOrderAmount, isActive) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), "BAGIFY10", "PERCENTAGE", 10, 0, 1],
      });
    }

    // Ensure FREESHIP exists as a default starter promo
    const existingFreeship = await db.execute({
      sql: "SELECT id FROM Coupon WHERE code = 'FREESHIP' LIMIT 1",
      args: [],
    });

    if (existingFreeship.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO Coupon (id, code, discountType, discountValue, minOrderAmount, isActive) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), "FREESHIP", "FREE_SHIPPING", 0, 0, 1],
      });
    }
  } catch (error) {
    console.error("Error ensuring Coupon table:", error);
  }
}

/**
 * Fetch all coupons for the studio admin view
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  await ensureCouponTable();
  const db = getDbClient();
  try {
    const res = await db.execute(`SELECT * FROM Coupon ORDER BY createdAt DESC`);
    return res.rows.map((row) => ({
      id: String(row.id),
      code: String(row.code).toUpperCase(),
      discountType: (String(row.discountType) as Coupon["discountType"]) || "PERCENTAGE",
      discountValue: Number(row.discountValue),
      minOrderAmount: Number(row.minOrderAmount || 0),
      maxDiscountAmount: row.maxDiscountAmount ? Number(row.maxDiscountAmount) : null,
      usageLimit: row.usageLimit ? Number(row.usageLimit) : null,
      usedCount: Number(row.usedCount || 0),
      isActive: Boolean(row.isActive),
      expiresAt: row.expiresAt ? String(row.expiresAt) : null,
      createdAt: String(row.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

/**
 * Create a new coupon code
 */
export async function createCoupon(data: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; coupon?: Coupon; error?: string }> {
  await ensureCouponTable();
  const db = getDbClient();

  const code = data.code.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Coupon code is required." };
  }

  const id = randomUUID();
  try {
    await db.execute({
      sql: `INSERT INTO Coupon (id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, isActive, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        id,
        code,
        data.discountType,
        data.discountValue,
        data.minOrderAmount || 0,
        data.maxDiscountAmount ?? null,
        data.usageLimit ?? null,
        data.expiresAt ?? null,
      ],
    });

    return {
      ok: true,
      coupon: {
        id,
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount || 0,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        usageLimit: data.usageLimit ?? null,
        usedCount: 0,
        isActive: true,
        expiresAt: data.expiresAt ?? null,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    if (String(error?.message).includes("UNIQUE") || String(error).includes("constraint")) {
      return { ok: false, error: "A coupon with this code already exists." };
    }
    return { ok: false, error: "Failed to create coupon." };
  }
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponActive(id: string, isActive: boolean): Promise<boolean> {
  const db = getDbClient();
  try {
    await db.execute({
      sql: `UPDATE Coupon SET isActive = ? WHERE id = ?`,
      args: [isActive ? 1 : 0, id],
    });
    return true;
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    return false;
  }
}

/**
 * Delete coupon by ID
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  const db = getDbClient();
  try {
    await db.execute({
      sql: `DELETE FROM Coupon WHERE id = ?`,
      args: [id],
    });
    return true;
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return false;
  }
}

export type ValidatedCouponResult = {
  valid: boolean;
  error?: string;
  coupon?: {
    code: string;
    discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    discountValue: number;
    discountAmount: number;
    freeShipping: boolean;
  };
};

/**
 * Validate a coupon code against a given subtotal
 */
export async function validateCouponCode(
  code: string,
  subtotal: number
): Promise<ValidatedCouponResult> {
  await ensureCouponTable();
  const db = getDbClient();
  const upper = code.trim().toUpperCase();

  if (!upper) {
    return { valid: false, error: "Enter a coupon code." };
  }

  try {
    const res = await db.execute({
      sql: `SELECT * FROM Coupon WHERE code = ? LIMIT 1`,
      args: [upper],
    });

    if (res.rows.length === 0) {
      // Hardcoded fallback for BAGIFY10 and FREESHIP if not in DB yet
      if (upper === "BAGIFY10") {
        const discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
        return {
          valid: true,
          coupon: {
            code: "BAGIFY10",
            discountType: "PERCENTAGE",
            discountValue: 10,
            discountAmount,
            freeShipping: false,
          },
        };
      }
      if (upper === "FREESHIP") {
        return {
          valid: true,
          coupon: {
            code: "FREESHIP",
            discountType: "FREE_SHIPPING",
            discountValue: 0,
            discountAmount: 80,
            freeShipping: true,
          },
        };
      }
      return { valid: false, error: "Invalid coupon code." };
    }

    const row = res.rows[0];
    const isActive = Boolean(row.isActive);
    if (!isActive) {
      return { valid: false, error: "This coupon is no longer active." };
    }

    // Check expiration date
    if (row.expiresAt) {
      const exp = new Date(String(row.expiresAt));
      if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        return { valid: false, error: "This coupon has expired." };
      }
    }

    // Check usage limit
    if (row.usageLimit && Number(row.usedCount) >= Number(row.usageLimit)) {
      return { valid: false, error: "This coupon has reached its usage limit." };
    }

    // Check minimum order amount
    const minAmount = Number(row.minOrderAmount || 0);
    if (minAmount > 0 && subtotal < minAmount) {
      return {
        valid: false,
        error: `Minimum order amount of ₹${minAmount.toLocaleString("en-IN")} required for this coupon.`,
      };
    }

    const discountType = (String(row.discountType) as Coupon["discountType"]) || "PERCENTAGE";
    const discountValue = Number(row.discountValue);
    const maxDiscountAmount = row.maxDiscountAmount ? Number(row.maxDiscountAmount) : null;

    let discountAmount = 0;
    let freeShipping = false;

    if (discountType === "PERCENTAGE") {
      discountAmount = Math.round((subtotal * (discountValue / 100)) * 100) / 100;
      if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
      }
    } else if (discountType === "FIXED") {
      discountAmount = Math.min(discountValue, subtotal);
    } else if (discountType === "FREE_SHIPPING") {
      freeShipping = true;
      discountAmount = 80; // Standard shipping waiver
    }

    return {
      valid: true,
      coupon: {
        code: upper,
        discountType,
        discountValue,
        discountAmount,
        freeShipping,
      },
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Error checking coupon code." };
  }
}

/**
 * Increment coupon used count upon successful order
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const db = getDbClient();
  try {
    await db.execute({
      sql: `UPDATE Coupon SET usedCount = usedCount + 1 WHERE code = ?`,
      args: [code.trim().toUpperCase()],
    });
  } catch (error) {
    console.error("Error incrementing coupon usage:", error);
  }
}
