"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Film, Copy, ArrowUpRight } from "lucide-react";

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
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<EditorialPost[]>(EDITORIAL_POSTS);

  // Sync with live API if configured
  useEffect(() => {
    fetch("/api/instagram")
      .then((res) => res.json())
      .then((data) => {
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
    <section className="w-full bg-white pt-10 sm:pt-14 pb-4">
      {/* ── Top Header: follow us (Right Aligned Editorial Serif) ── */}
      <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-12 lg:px-16 mb-6 sm:mb-8 flex justify-end">
        <h2 className="font-serif italic font-normal text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-black lowercase tracking-normal select-none">
          follow us
        </h2>
      </div>

      {/* ── 4-Column Editorial High-Fashion Photo Strip ── */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square bg-gray-100 overflow-hidden block border border-black/5"
            >
              {/* Lookbook Photo */}
              <Image
                src={post.url}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Minimal Top-Right Editorial Badge */}
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                {post.type === "reel" && (
                  <div className="bg-black/40 backdrop-blur-md p-1.5 rounded text-white/90 shadow-sm">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}
                {post.type === "carousel" && (
                  <div className="bg-black/40 backdrop-blur-md p-1.5 rounded text-white/90 shadow-sm">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Hover Dark Glass Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-white text-center z-20">
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
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/20 px-2.5 py-1 rounded-full">
                  View on Instagram <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* ── Bottom Left Brand Handle Pill / Tag ── */}
        <div className="pt-3 sm:pt-4 flex justify-start">
          <a
            href="https://instagram.com/bagifyyyy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-6 bg-white hover:bg-gray-50 border border-black/10 transition-all group"
          >
            <span className="font-serif italic font-normal text-base sm:text-lg text-black tracking-tight group-hover:text-y2k-slate">
              @bagifyyyy
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black/50 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
