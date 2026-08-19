import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const beholdUrl = process.env.BEHOLD_FEED_URL;

  // 1. If using Behold.so or Curator JSON feed
  if (beholdUrl) {
    try {
      const res = await fetch(beholdUrl, { next: { revalidate: 1800 } });
      if (res.ok) {
        const data = await res.json();
        const rawPosts = Array.isArray(data) ? data : (data.posts || data.data || []);
        
        if (rawPosts.length > 0) {
          return NextResponse.json({
            success: true,
            source: "behold",
            profile: {
              username: "bagifyyyy",
              name: "BAGIFYYYY",
            },
            posts: rawPosts.map((item: any, idx: number) => ({
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

  // 2. If using Official Meta Instagram Graph API
  if (token && accountId) {
    try {
      const profileUrl = `https://graph.facebook.com/v21.0/${accountId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${token}`;
      const profileRes = await fetch(profileUrl, { next: { revalidate: 3600 } });
      
      const mediaUrl = `https://graph.facebook.com/v21.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${token}`;
      const mediaRes = await fetch(mediaUrl, { next: { revalidate: 3600 } });

      if (profileRes.ok && mediaRes.ok) {
        const profile = await profileRes.json();
        const media = await mediaRes.json();

        return NextResponse.json({
          success: true,
          source: "graph_api",
          profile: {
            username: profile.username || "bagifyyyy",
            name: profile.name || "BAGIFYYYY",
            avatar: profile.profile_picture_url || "/logo.png",
            followersCount: profile.followers_count ?? 5502,
            followingCount: profile.follows_count ?? 1,
            postsCount: profile.media_count ?? 1256,
            biography: profile.biography || "",
          },
          posts: (media.data || []).map((item: any) => ({
            id: item.id,
            url: item.media_type === "VIDEO" ? item.thumbnail_url || item.media_url : item.media_url,
            type: item.media_type === "VIDEO" ? "video" : item.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
            likes: item.like_count ? item.like_count.toLocaleString() : "2.8K",
            comments: item.comments_count ? item.comments_count.toLocaleString() : "142",
            caption: item.caption || "",
            timestamp: new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            link: item.permalink || "https://instagram.com/bagifyyyy",
          })),
        });
      }
    } catch (err) {
      console.warn("Instagram Graph API request error:", err);
    }
  }

  // 3. Fallback to curated default editorial lookbook
  return NextResponse.json({
    success: true,
    source: "static_fallback",
    profile: {
      username: "bagifyyyy",
      name: "BAGIFYYYY",
      avatar: "/logo.png",
      followersCount: 5502,
      followingCount: 1,
      postsCount: 1256,
    },
    posts: [
      {
        id: "post-1",
        url: "/assets/editorial/ig_2_blue.jpg",
        type: "reel",
        likes: "3.4K",
        comments: "182",
        caption: "Midnight tailoring & structured sky blue archive layers.",
        link: "https://instagram.com/bagifyyyy",
      },
      {
        id: "post-2",
        url: "/assets/editorial/ig_3_split.jpg",
        type: "reel",
        likes: "4.9K",
        comments: "320",
        caption: "Vivid Spectrum Issue 04: Emerald nylon & coral puffers.",
        link: "https://instagram.com/bagifyyyy",
      },
      {
        id: "post-3",
        url: "/assets/editorial/ig_1_pink.jpg",
        type: "carousel",
        likes: "5.8K",
        comments: "419",
        caption: "Astra Moderne / Cosmic Lure editorial lookbook capsule.",
        link: "https://instagram.com/bagifyyyy",
      },
      {
        id: "post-4",
        url: "/assets/editorial/ig_4_gold.jpg",
        type: "carousel",
        likes: "6.2K",
        comments: "508",
        caption: "The Grandmaster's Move: Metallic chainmail archive fitting.",
        link: "https://instagram.com/bagifyyyy",
      },
    ],
  });
}
