"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Check, Video, Copy, ExternalLink } from "lucide-react";

interface InstagramPost {
  id: string;
  url: string;
  type: "video" | "carousel" | "image";
  likes: string;
  comments: string;
  caption: string;
  timestamp: string;
  link: string;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: "post-1",
    url: "/assets/ai/prod_model_1_hoodie_1786659181183.jpg",
    type: "video",
    likes: "2,491",
    comments: "148",
    caption: "Archive drop 01 live in vault. Heavyweight distressed vintage hoodie. No restocks.",
    timestamp: "2h ago",
    link: "https://instagram.com",
  },
  {
    id: "post-2",
    url: "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
    type: "carousel",
    likes: "3,820",
    comments: "215",
    caption: "Acid-wash tactical multi-pocket cargo pants. Details on slide 2 & 3.",
    timestamp: "1d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-3",
    url: "/assets/ai/prod_model_3_babytee_1786659519157.jpg",
    type: "video",
    likes: "4,110",
    comments: "302",
    caption: "2000s Harajuku aesthetic baby tee. Ribbed vintage cotton blend.",
    timestamp: "2d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-4",
    url: "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
    type: "image",
    likes: "1,940",
    comments: "94",
    caption: "Hardware details on the Cyberpunk industrial zip jacket.",
    timestamp: "3d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-5",
    url: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg",
    type: "carousel",
    likes: "2,760",
    comments: "163",
    caption: "Everyday tactical archive shoulder bag. Metal hardware clasp.",
    timestamp: "4d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-6",
    url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    type: "video",
    likes: "5,340",
    comments: "419",
    caption: "Hand-distressed 90s wash denim trucker. Rare 1-of-1 archival piece.",
    timestamp: "5d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-7",
    url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
    type: "carousel",
    likes: "3,210",
    comments: "182",
    caption: "Chrome studded archive belt. Solid zinc buckle.",
    timestamp: "6d ago",
    link: "https://instagram.com",
  },
  {
    id: "post-8",
    url: "/hero-1-new.jpg",
    type: "video",
    likes: "6,890",
    comments: "524",
    caption: "Behind the lens: Milan & Tokyo sourcing trip for Winter Drop 2024.",
    timestamp: "1w ago",
    link: "https://instagram.com",
  },
];

export default function InstagramFeed() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(38420);
  const [currentPage, setCurrentPage] = useState(0);

  const postsPerPage = 8;
  const totalPages = Math.ceil(INSTAGRAM_POSTS.length / postsPerPage);
  const displayedPosts = INSTAGRAM_POSTS.slice(
    currentPage * postsPerPage,
    (currentPage + 1) * postsPerPage
  );

  const handleFollowToggle = () => {
    if (!isFollowing) {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    } else {
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
      {/* ── 1. Authentic Instagram Profile Header Bar ── */}
      <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Avatar with Instagram Gradient Ring */}
          <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
            <div className="p-0.5 bg-white rounded-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                <Image
                  src="/logo.png"
                  alt="BAGIFYYYY Profile"
                  width={80}
                  height={80}
                  className="object-contain p-2 filter invert"
                />
              </div>
            </div>
          </div>

          {/* Name & Handle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-medium text-xl sm:text-2xl uppercase tracking-tight text-y2k-gunmetal">
                BAGIFYYYY
              </h3>
              {/* Instagram Verified Blue Badge */}
              <span className="inline-flex items-center justify-center w-4 h-4 bg-[#0095F6] text-white rounded-full text-[10px] font-bold shadow-xs">
                ✓
              </span>
            </div>
            <a
              href="https://instagram.com/bagifyyyy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-y2k-slate font-medium hover:text-black transition-colors"
            >
              @bagifyyyy
            </a>
            <span className="text-[11px] text-y2k-gunmetal/70 mt-1 hidden sm:block">
              Archival Streetwear &amp; Vintage Drops • Sourced Globally
            </span>
          </div>
        </div>

        {/* Middle / Right: Stats & Follow Button */}
        <div className="flex items-center gap-6 sm:gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-y2k-gunmetal/10 pt-4 md:pt-0">
          {/* Stats Row */}
          <div className="flex items-center gap-6 sm:gap-8 text-center">
            <div>
              <span className="block font-display font-medium text-lg sm:text-xl text-y2k-gunmetal leading-none">
                {INSTAGRAM_POSTS.length}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-slate">
                Posts
              </span>
            </div>
            <div>
              <span className="block font-display font-medium text-lg sm:text-xl text-y2k-gunmetal leading-none">
                {formatFollowers(followerCount)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-slate">
                Followers
              </span>
            </div>
            <div>
              <span className="block font-display font-medium text-lg sm:text-xl text-y2k-gunmetal leading-none">
                412
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-y2k-slate">
                Following
              </span>
            </div>
          </div>

          {/* Follow Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFollowToggle}
              className={`px-5 sm:px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isFollowing
                  ? "bg-gray-100 text-y2k-gunmetal hover:bg-gray-200 border border-y2k-gunmetal/20"
                  : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <span>Follow</span>
                </>
              )}
            </button>

            <a
              href="https://instagram.com/bagifyyyy"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-y2k-gunmetal border border-y2k-gunmetal/15 transition-colors"
              title="Open in Instagram"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Grid Container with Native Overlay Badges ── */}
      <div className="relative group/feed">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {displayedPosts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/bagifyyyy"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square bg-black overflow-hidden group/item cursor-pointer block border border-y2k-gunmetal/10"
            >
              {/* Photo Image */}
              <Image
                src={post.url}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover/item:scale-105 group-hover/item:brightness-90"
              />

              {/* Native Top-Right Post Type Icon (Reels / Carousel) */}
              <div className="absolute top-2.5 right-2.5 z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white">
                {post.type === "video" && (
                  <div className="bg-black/40 backdrop-blur-xs p-1 rounded-sm">
                    <Video className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {post.type === "carousel" && (
                  <div className="bg-black/40 backdrop-blur-xs p-1 rounded-sm">
                    <Copy className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Hover Overlay with Likes & Comments Counter */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 text-white p-4 text-center z-20">
                <div className="flex items-center gap-5 text-sm font-bold tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white text-white" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                    <span>{post.comments}</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/90 line-clamp-2 leading-tight max-w-[200px] font-sans">
                  {post.caption}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                  {post.timestamp}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Carousel Pagination Arrows (when more than 1 page) */}
        {totalPages > 1 && (
          <>
            {currentPage > 0 && (
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-black shadow-lg rounded-full flex items-center justify-center z-30 transition-all cursor-pointer"
                aria-label="Previous posts"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentPage < totalPages - 1 && (
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-black shadow-lg rounded-full flex items-center justify-center z-30 transition-all cursor-pointer"
                aria-label="Next posts"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
