import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "src", "data", "instagram_feed.json");

// Helper to read curated config
function getFeedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading instagram feed file:", err);
  }
  return null;
}

// Helper to save config
function saveFeedConfig(data: any) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const config = getFeedConfig();
  if (config) {
    return NextResponse.json({ success: true, ...config });
  }

  // Fallback defaults
  return NextResponse.json({
    success: true,
    profile: {
      username: "bagifyyyy",
      name: "BAGIFYYYY",
      followersCount: 5502,
    },
    posts: [
      {
        id: "post-1",
        url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
        type: "reel",
        likes: "4.2K",
        comments: "248",
        caption: "✦ DROP 09: Heavy 3D Chrome Star Studded Belt in distressed full-grain leather. Now live on site.",
        link: "https://www.instagram.com/bagifyyyy",
      },
      {
        id: "post-2",
        url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
        type: "carousel",
        likes: "6.7K",
        comments: "512",
        caption: "14.5oz Japanese Selvedge Raw Denim Trucker fitting. Boxy cyber silhouette with distressed accents.",
        link: "https://www.instagram.com/bagifyyyy",
      },
      {
        id: "post-3",
        url: "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
        type: "reel",
        likes: "5.5K",
        comments: "394",
        caption: "Artisanal Mineral Wash 8-Pocket Cyber Cargos. Extended inseam puddle stacking.",
        link: "https://www.instagram.com/bagifyyyy",
      },
      {
        id: "post-4",
        url: "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
        type: "carousel",
        likes: "8.1K",
        comments: "640",
        caption: "Heavyweight 480GSM Dual-Zip Cyber Fleece in Charcoal Slate. Limited archive batch.",
        link: "https://www.instagram.com/bagifyyyy",
      },
    ],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { posts, profile } = body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "Posts array is required." }, { status: 400 });
    }

    const payload = {
      profile: profile || { username: "bagifyyyy", name: "BAGIFYYYY" },
      posts,
      updatedAt: new Date().toISOString(),
    };

    saveFeedConfig(payload);
    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("Error saving instagram feed:", error);
    return NextResponse.json({ error: "Failed to update feed" }, { status: 500 });
  }
}
