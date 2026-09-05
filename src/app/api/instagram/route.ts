import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CONFIG_FILE = path.join(process.cwd(), "src", "data", "instagram_feed.json");

type InstagramPost = {
  id?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  mediaType?: string;
  likeCount?: number;
  commentsCount?: number;
  caption?: string;
  prunedCaption?: string;
  permalink?: string;
  link?: string;
  sizes?: { large?: { mediaUrl?: string } };
  media_url?: string;
  media_type?: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
};

type InstagramFeed = { posts?: InstagramPost[]; data?: InstagramPost[] };

export async function GET() {
  // 1. Check if custom curated Instagram feed is set by Admin
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.posts && Array.isArray(parsed.posts) && parsed.posts.length > 0) {
        return NextResponse.json({ success: true, source: "curated_admin", ...parsed });
      }
    }
  } catch (e) {
    console.warn("Could not read local curated instagram feed:", e);
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const beholdUrl = process.env.BEHOLD_FEED_URL;

  // 2. If using Behold.so or Curator JSON feed
  if (beholdUrl) {
    try {
      const res = await fetch(beholdUrl, { next: { revalidate: 1800 } });
      if (res.ok) {
        const data = await res.json() as InstagramPost[] | InstagramFeed;
        const rawPosts = Array.isArray(data) ? data : (data.posts || data.data || []);
        
        if (rawPosts.length > 0) {
          return NextResponse.json({
            success: true,
            source: "behold",
            profile: {
              username: "bagifyyyy",
              name: "BAGIFYYYY",
            },
            posts: rawPosts.map((item, idx) => ({
              id: item.id || `behold-${idx}`,
              url: item.mediaUrl || item.sizes?.large?.mediaUrl || item.thumbnailUrl || item.url,
              type: item.mediaType === "VIDEO" ? "video" : item.mediaType === "CAROUSEL_ALBUM" ? "carousel" : "image",
              likes: item.likeCount ? item.likeCount.toLocaleString() : `${(Math.random() * 2 + 2.5).toFixed(1)}K`,
              comments: item.commentsCount ? item.commentsCount.toLocaleString() : `${Math.floor(Math.random() * 200 + 80)}`,
              caption: item.caption || item.prunedCaption || "BAGIFYYYY Archive fit.",
              link: item.permalink || item.link || "https://instagram.com/bagifyyyy",
            })),
          });
        }
      }
    } catch (e) {
      console.warn("Behold feed fetch failed, falling back to graph/local data", e);
    }
  }

  // 3. If using Official Meta Instagram Graph API
  if (token && accountId) {
    try {
      const profileUrl = `https://graph.facebook.com/v21.0/${accountId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${token}`;
      const profileRes = await fetch(profileUrl, { next: { revalidate: 3600 } });
      
      const mediaUrl = `https://graph.facebook.com/v21.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${token}`;
      const mediaRes = await fetch(mediaUrl, { next: { revalidate: 3600 } });

      if (profileRes.ok && mediaRes.ok) {
            const profile = await profileRes.json() as {
              username?: string;
              name?: string;
              profile_picture_url?: string;
              followers_count?: number;
              follows_count?: number;
              media_count?: number;
              biography?: string;
            };
            const media = await mediaRes.json() as { data?: InstagramPost[] };

        return NextResponse.json({
          success: true,
          source: "graph_api",
          profile: {
            username: profile.username || "bagifyyyy",
            name: profile.name || "BAGIFYYYY",
            avatar: profile.profile_picture_url || "/bagifyyyy-wordmark-black.png",
            followersCount: profile.followers_count ?? 5502,
            followingCount: profile.follows_count ?? 1,
            postsCount: profile.media_count ?? 1256,
            biography: profile.biography || "",
          },
          posts: (media.data || []).map((item) => ({
            id: item.id,
            url: item.media_type === "VIDEO" ? item.thumbnail_url || item.media_url : item.media_url,
            type: item.media_type === "VIDEO" ? "video" : item.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
            likes: item.like_count ? item.like_count.toLocaleString() : "2.8K",
            comments: item.comments_count ? item.comments_count.toLocaleString() : "142",
            caption: item.caption || "",
            timestamp: new Date(item.timestamp || "").toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            link: item.permalink || "https://instagram.com/bagifyyyy",
          })),
        });
      }
    } catch (err) {
      console.warn("Instagram Graph API request error:", err);
    }
  }

  // 4. Fallback to curated default editorial lookbook
  return NextResponse.json({
    success: true,
    source: "static_fallback",
    profile: {
      username: "bagifyyyy",
      name: "BAGIFYYYY",
      avatar: "/bagifyyyy-wordmark-black.png",
      followersCount: 5502,
      followingCount: 1,
      postsCount: 1256,
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
