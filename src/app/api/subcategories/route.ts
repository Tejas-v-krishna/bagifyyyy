import { NextResponse } from "next/server";
import { getSubcategories, getAllSubcategories, createSubcategory, deleteSubcategory } from "@/lib/subcategories";
import { requireStudioAuth } from "@/lib/requireStudioAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category) {
      const subcategories = await getSubcategories(category);
      return NextResponse.json({ subcategories });
    }

    const subcategories = await getAllSubcategories();
    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error("GET /api/subcategories error:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { category, name } = body as { category?: string; name?: string };
    if (!category || !category.trim() || !name || !name.trim()) {
      return NextResponse.json({ error: "Category and name are required." }, { status: 400 });
    }

    const subcategory = await createSubcategory(category.trim(), name.trim());
    if (!subcategory) {
      return NextResponse.json({ error: "Failed to create subcategory." }, { status: 400 });
    }

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subcategories error:", error);
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object" && "id" in body) {
        id = String(body.id);
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Subcategory ID is required" }, { status: 400 });
    }

    const success = await deleteSubcategory(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/subcategories error:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
