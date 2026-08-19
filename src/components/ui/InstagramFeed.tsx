"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Film, Copy, ArrowUpRight } from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface EditorialPost {
  id: string;
  url: string;
  type: "reel" | "carousel" | "image";
  likes: string;
  comments: string;
  caption: string;
  link: string;
}

const EDITORIAL_POSTS: EditorialPost[] = [
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
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<EditorialPost[]>(EDITORIAL_POSTS);
  const [handle, setHandle] = useState("@BAGIFYYYY");
  const [profileLink, setProfileLink] = useState("https://instagram.com/bagifyyyy");

  // Sync with live API if configured
  useEffect(() => {
    fetch("/api/instagram")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.username) {
          setHandle(`@${data.profile.username.toUpperCase()}`);
          setProfileLink(`https://instagram.com/${data.profile.username}`);
        }
        if (data.posts && Array.isArray(data.posts) && data.posts.length >= 4) {
          setPosts(
            data.posts.slice(0, 4).map((p: any) => ({
              id: p.id,
              url: p.url,
              type: p.type === "video" ? "reel" : p.type === "carousel" ? "carousel" : "image",
              likes: p.likes || "2.4K",
              comments: p.comments || "120",
              caption: p.caption || "Archive fit drop.",
              link: p.link || "https://instagram.com/bagifyyyy",
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Instagram live sync error:", err);
      });
  }, []);

  return (
    <section className="w-full bg-y2k-ice pt-12 sm:pt-16 pb-8 border-t border-y2k-gunmetal/10">
      {/* ── Top Header: FOLLOW US (Consistent with New Arrivals & Curated Grails Typography) ── */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-8 sm:mb-10 flex justify-end">
        <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[46px] uppercase tracking-[-0.03em] leading-none text-y2k-gunmetal select-none">
          FOLLOW US
        </h2>
      </div>

      {/* ── 4-Column High-Fashion Grid Photo Strip ── */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square bg-white overflow-hidden block border border-y2k-gunmetal/15"
            >
              {/* Lookbook Photo */}
              <Image
                src={post.url}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Minimal Top-Right Media Badge */}
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                {post.type === "reel" && (
                  <div className="bg-black/50 backdrop-blur-md p-1.5 text-white shadow-sm">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}
                {post.type === "carousel" && (
                  <div className="bg-black/50 backdrop-blur-md p-1.5 text-white shadow-sm">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Hover Dark Glass Overlay */}
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-white text-center z-20">
                <div className="flex items-center gap-6 mb-3 font-semibold text-sm">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white text-white" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                    {post.comments}
                  </span>
                </div>
                <p className="text-xs text-white/90 line-clamp-2 max-w-[220px] font-sans font-normal leading-snug mb-3">
                  {post.caption}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/20 px-3 py-1">
                  View on Instagram <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* ── Bottom Left Brand Handle Button (Matching New Arrivals / Grails Button Style) ── */}
        <div className="pt-4 sm:pt-6 flex justify-start">
          <a
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 py-3 px-6 bg-white hover:bg-y2k-gunmetal hover:text-white border border-y2k-gunmetal/20 text-y2k-gunmetal transition-all group shadow-xs cursor-pointer"
          >
            <InstagramIcon className="w-4 h-4" />
            <span className="font-display font-medium text-xs md:text-sm uppercase tracking-[0.14em]">
              {handle}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-y2k-gunmetal/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
