"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

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
      aria-hidden="true"
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
  caption: string;
  link: string;
}

const postLayouts = [
  "col-span-2 md:col-span-7 md:row-span-2",
  "md:col-span-5",
  "md:col-span-3",
  "col-span-2 md:col-span-2",
];

const postRatios = [
  "aspect-[1.04] md:aspect-auto md:min-h-[700px]",
  "aspect-[1.35] md:aspect-auto md:min-h-[330px]",
  "aspect-[0.9] md:aspect-auto md:min-h-[330px]",
  "aspect-[0.9] md:aspect-auto md:min-h-[330px]",
];

const EDITORIAL_POSTS: EditorialPost[] = [
  {
    id: "post-1",
    url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
    caption: "Chrome Star Belt · Drop 09",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-2",
    url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    caption: "Raw Denim Trucker",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-3",
    url: "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
    caption: "8-Pocket Cyber Cargos · Drop 07",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-4",
    url: "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
    caption: "480GSM Dual-Zip Fleece",
    link: "https://www.instagram.com/bagifyyyy",
  },
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<EditorialPost[]>(EDITORIAL_POSTS);
  const [handle, setHandle] = useState("@BAGIFYYYY");
  const [profileLink, setProfileLink] = useState("https://instagram.com/bagifyyyy");

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
            data.posts.slice(0, 4).map((p: { id: string; url: string; caption?: string; link?: string }) => ({
              id: p.id,
              url: p.url,
              caption: p.caption || "New piece.",
              link: p.link || "https://instagram.com/bagifyyyy",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      className="w-full bg-white px-4 pt-6 pb-8 text-black sm:px-7 sm:pt-10 sm:pb-12 md:pt-12 md:pb-14 lg:px-10"
      aria-labelledby="instagram-heading"
    >
      <div className="mx-auto w-full max-w-[1700px]">
        <div className="flex flex-col gap-4 border-t border-black/15 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <h2 id="instagram-heading" className="text-[clamp(2.5rem,6vw,7rem)] font-display font-bold uppercase leading-[0.84] tracking-[-0.03em] select-none text-black">
               On<br />Instagram
            </h2>
          </div>
          <a
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ${handle} on Instagram`}
            className="btn-bagify btn-bagify-dark w-fit shrink-0 text-[11px] uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            <span className="sm:hidden">Follow</span>
            <span className="hidden sm:inline">Follow {handle}</span>
            <InstagramIcon className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>

        {/* Minimalist Editorial Lookbook Collage */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12 md:grid-rows-2 md:h-[680px]" role="list" aria-label="Instagram posts">
          {/* Post 0: Main Feature Hero Card */}
          {posts[0] && (
            <a
              href={posts[0].link}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={posts[0].caption}
              className="group relative block aspect-[4/5] sm:aspect-auto md:h-full md:col-span-7 md:row-span-2 overflow-hidden rounded-2xl bg-[#f0f0f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3"
            >
              <Image
                src={posts[0].url}
                alt={posts[0].caption}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
              />

              {/* Minimal pure gradient fade for caption readability */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300" aria-hidden="true" />

              {/* Minimal top right arrow cue on hover */}
              <div className="absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black shadow-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>

              {/* Minimal caption layout */}
              <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3 text-white">
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-widest text-white/60">
                    FW26 // 01
                  </span>
                  <p className="truncate font-sans text-[12.5px] sm:text-[14px] font-medium tracking-tight text-white/95 mt-0.5">
                    {posts[0].caption}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-white/70 group-hover:text-white transition-colors duration-200">
                  VIEW ↗
                </span>
              </div>
            </a>
          )}

          {/* Post 1: Top Right Card */}
          {posts[1] && (
            <a
              href={posts[1].link}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={posts[1].caption}
              className="group relative block aspect-[16/10] sm:aspect-auto md:h-full md:col-span-5 md:row-span-1 overflow-hidden rounded-2xl bg-[#f0f0f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3"
            >
              <Image
                src={posts[1].url}
                alt={posts[1].caption}
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300" aria-hidden="true" />

              <div className="absolute top-3.5 right-3.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </div>

              <div className="absolute inset-x-3.5 bottom-3.5 z-10 flex items-end justify-between gap-3 text-white">
                <div className="min-w-0">
                  <span className="block font-mono text-[8.5px] uppercase tracking-widest text-white/60">
                    ARCHIVE // 02
                  </span>
                  <p className="truncate font-sans text-[11.5px] sm:text-[13px] font-medium tracking-tight text-white/95 mt-0.5">
                    {posts[1].caption}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-wider text-white/70 group-hover:text-white transition-colors duration-200">
                  VIEW ↗
                </span>
              </div>
            </a>
          )}

          {/* Posts 2 & 3: Bottom Right Pair */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:contents">
            {posts.slice(2, 4).map((post, subIdx) => {
              const postIndex = subIdx + 2;
              return (
                <a
                  key={post.id}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  aria-label={post.caption}
                  className={`group relative block aspect-[3/4] sm:aspect-auto md:h-full md:row-span-1 overflow-hidden rounded-2xl bg-[#f0f0f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 ${
                    postIndex === 2 ? "md:col-span-3 md:col-start-8" : "md:col-span-2 md:col-start-11"
                  }`}
                >
                  <Image
                    src={post.url}
                    alt={post.caption}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300" aria-hidden="true" />

                  <div className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </div>

                  <div className="absolute inset-x-3 bottom-3 z-10 text-white">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-white/60">
                      0{postIndex + 1}
                    </span>
                    <p className="truncate font-sans text-[10.5px] sm:text-[11.5px] font-medium tracking-tight text-white/95 mt-0.5">
                      {post.caption}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
