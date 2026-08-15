import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const beholdUrl = process.env.BEHOLD_FEED_URL;

  // 1. If using Behold.so or Curator JSON feed
  if (beholdUrl) {
    try {
      const res = await fetch(beholdUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, source: "behold", data });
      }
    } catch (e) {
      console.warn("Behold feed fetch failed, falling back to local data", e);
    }
  }

  // 2. If using Official Meta Instagram Graph API
  if (token && accountId) {
    try {
      // Fetch profile data (followers, following, media_count, biography, etc.)
      const profileUrl = `https://graph.facebook.com/v21.0/${accountId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${token}`;
      const profileRes = await fetch(profileUrl, { next: { revalidate: 3600 } });
      
      // Fetch latest 12 media items
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
            likes: item.like_count ? item.like_count.toLocaleString() : "1.2K",
            comments: item.comments_count ? item.comments_count.toLocaleString() : "84",
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

  // 3. Fallback to curated default data
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
      bioLines: [
        "UNISEX!",
        "ALL INDIA SHIPPING 🇮🇳",
        "NO COD/RETURN/EXCHANGE/CANCELLATION ❌",
        "PAYMENT-GPAY/PAYTM/PHONEPAY",
      ],
    },
  });
}
