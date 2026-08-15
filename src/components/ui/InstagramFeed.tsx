"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Check, Video, Layers, ExternalLink, MoreHorizontal } from "lucide-react";

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
    caption: "Heavyweight distressed vintage hoodie. DM on Instagram for sizing.",
    timestamp: "2h ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-2",
    url: "/fit.jpg",
    type: "carousel",
    likes: "4,820",
    comments: "315",
    caption: "Acid wash tactical multi-pocket cargo pants. Unisex archive fit.",
    timestamp: "1d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-3",
    url: "/assets/ai/prod_model_3_babytee_1786659519157.jpg",
    type: "image",
    likes: "3,110",
    comments: "202",
    caption: "Y2K uniform baby tee. Sourced & verified archive garment.",
    timestamp: "2d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-4",
    url: "/cmmawear.jpg",
    type: "video",
    likes: "5,940",
    comments: "414",
    caption: "Cyberpunk industrial hardware zip jacket. 1 of 1 piece.",
    timestamp: "3d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-5",
    url: "/assets/ai/prod_model_5_shoulderbag_1786659873205.jpg",
    type: "carousel",
    likes: "2,760",
    comments: "163",
    caption: "Everyday tactical archive shoulder bag. Solid metal hardware.",
    timestamp: "4d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-6",
    url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    type: "video",
    likes: "4,340",
    comments: "299",
    caption: "Hand-distressed 90s wash denim trucker jacket.",
    timestamp: "5d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-7",
    url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
    type: "carousel",
    likes: "3,210",
    comments: "182",
    caption: "Chrome studded vintage archive belt. Solid zinc buckle.",
    timestamp: "6d ago",
    link: "https://instagram.com/bagifyyyy",
  },
  {
    id: "post-8",
    url: "/hero-1-new.jpg",
    type: "video",
    likes: "6,890",
    comments: "524",
    caption: "Behind the drops: Tokyo & Milan vintage sourcing capsule.",
    timestamp: "1w ago",
    link: "https://instagram.com/bagifyyyy",
  },
];

export default function InstagramFeed() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(5502);

  const handleFollowToggle = () => {
    if (!isFollowing) {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    } else {
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
      {/* ── 1. Clean Authentic Instagram Profile Card ── */}
      <div className="bg-white border border-y2k-gunmetal/15 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left: Avatar + Profile Details */}
          <div className="flex items-start sm:items-center gap-5 sm:gap-7">
            {/* Story Gradient Ring Avatar */}
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] shrink-0 shadow-xs">
              <div className="p-0.5 bg-white rounded-full">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                  <Image
                    src="/logo.png"
                    alt="bagifyyyy Profile"
                    width={80}
                    height={80}
                    priority
                    className="object-contain p-2.5 filter invert"
                  />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col">
              {/* Username + Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                <h3 className="font-sans font-bold text-xl sm:text-2xl lowercase tracking-tight text-y2k-gunmetal">
                  bagifyyyy
                </h3>

                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`px-4 sm:px-5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isFollowing
                      ? "bg-gray-100 text-y2k-gunmetal hover:bg-gray-200 border border-y2k-gunmetal/15"
                      : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <span>Follow</span>
                  )}
                </button>

                <a
                  href="https://instagram.com/bagifyyyy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-y2k-gunmetal/60 hover:text-black transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </a>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm text-y2k-gunmetal mb-2.5">
                <span>
                  <strong className="font-bold">1,256</strong> posts
                </span>
                <span>
                  <strong className="font-bold">{followerCount.toLocaleString()}</strong> followers
                </span>
                <span>
                  <strong className="font-bold">1</strong> following
                </span>
              </div>

              {/* Exact Bio Lines */}
              <div className="text-xs sm:text-[13px] font-sans text-y2k-gunmetal leading-snug flex flex-col font-medium space-y-0.5">
                <span>UNISEX!</span>
                <span>ALL INDIA SHIPPING 🇮🇳</span>
                <span>NO COD/RETURN/EXCHANGE/CANCELLATION ❌</span>
                <span className="font-semibold text-y2k-gunmetal/90">PAYMENT-GPAY/PAYTM/PHONEPAY</span>
              </div>
            </div>
          </div>

          {/* Right: Direct Profile Link CTA */}
          <div className="shrink-0 self-start md:self-center pt-2 md:pt-0">
            <a
              href="https://instagram.com/bagifyyyy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#232D3B] hover:bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>VIEW ON INSTAGRAM</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

        </div>
      </div>

      {/* ── 2. Instagram 8-Post Photo Grid with Native Hover ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {INSTAGRAM_POSTS.map((post) => (
          <a
            key={post.id}
            href="https://instagram.com/bagifyyyy"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square bg-gray-100 overflow-hidden block border border-y2k-gunmetal/10"
          >
            {/* Post Photo */}
            <Image
              src={post.url}
              alt={post.caption}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Native Top-Right Video / Carousel Icon Badge */}
            <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
              {post.type === "video" && (
                <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-md text-white shadow-md">
                  <Video className="w-3.5 h-3.5" />
                </div>
              )}
              {post.type === "carousel" && (
                <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-md text-white shadow-md">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Interactive Hover Overlay with Real-Feel Counts */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 text-white p-4 text-center z-20">
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
    </div>
  );
}
