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
      strokeWidth="1.5"
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

const EDITORIAL_POSTS: EditorialPost[] = [
  {
    id: "post-1",
    url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
    caption: "Chrome Star Belt — Drop 09",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-2",
    url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
    caption: "Raw Denim Trucker — Archive",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-3",
    url: "/assets/ai/prod_model_2_cargo_1786659253971.jpg",
    caption: "8-Pocket Cyber Cargos — Drop 07",
    link: "https://www.instagram.com/bagifyyyy",
  },
  {
    id: "post-4",
    url: "/assets/ai/prod_model_4_cyberzip_1786659858926.jpg",
    caption: "480GSM Dual-Zip Fleece — Archive",
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
            data.posts.slice(0, 4).map((p: any) => ({
              id: p.id,
              url: p.url,
              caption: p.caption || "Archive drop.",
              link: p.link || "https://instagram.com/bagifyyyy",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      className="w-full bg-y2k-ice pt-20 md:pt-28 pb-16 border-t border-y2k-gunmetal/[0.06]"
      aria-labelledby="instagram-heading"
    >
      {/* Header — right aligned, display type */}
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 mb-8 md:mb-10 flex items-end justify-between gap-4">
        <a
          href={profileLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[9.5px] uppercase tracking-[0.22em] text-y2k-gunmetal/50 hover:text-y2k-gunmetal transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-4"
          aria-label={`Follow us on Instagram — ${handle}`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>{handle}</span>
        </a>
        <h2
          id="instagram-heading"
          className="font-display text-4xl sm:text-5xl md:text-[56px] uppercase tracking-[-0.05em] leading-none text-y2k-gunmetal select-none"
          aria-label="Follow us on Instagram"
        >
          FOLLOW
        </h2>
      </div>

      {/* Flush photo grid — no borders, no gaps except 1px between cells */}
      <div
        className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16"
        role="list"
        aria-label="Instagram posts"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-y2k-gunmetal/[0.06]">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={post.caption}
              className="group relative aspect-square bg-y2k-pale/20 overflow-hidden block focus-visible:outline focus-visible:outline-2 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-0"
            >
              {/* Photo */}
              <Image
                src={post.url}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />

              {/* Hover overlay — dark glass, minimal copy */}
              <div
                className="absolute inset-0 glass-dark opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col items-center justify-center gap-3"
                aria-hidden="true"
              >
                <ArrowUpRight className="w-5 h-5 text-white/70" strokeWidth={1} />
                <span className="text-[9px] uppercase tracking-[0.22em] text-white/60">View</span>
              </div>
            </a>
          ))}
        </div>

        {/* Follow CTA — below grid, minimal */}
        <div className="pt-6 flex justify-end">
          <a
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.22em] text-y2k-gunmetal/45 hover:text-y2k-gunmetal transition-colors duration-300 group focus-visible:outline focus-visible:outline-1 focus-visible:outline-y2k-gunmetal focus-visible:outline-offset-4"
            aria-label="Open Instagram profile"
          >
            <span>Follow on Instagram</span>
            <ArrowUpRight
              className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
              strokeWidth={1.5}
            />
          </a>
        </div>
      </div>
    </section>
  );
}
