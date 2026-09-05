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
    caption: "Chrome Star Belt — Drop 09",
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
    caption: "8-Pocket Cyber Cargos — Drop 07",
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
      className="w-full bg-white px-4 py-20 text-black sm:px-7 md:py-28 lg:px-10"
      aria-labelledby="instagram-heading"
    >
      <div className="mx-auto w-full max-w-[1700px]">
        <div className="flex flex-col gap-4 border-t border-black/15 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <a
              href={profileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-black/45 transition-colors hover:text-black sm:text-[10px]"
              aria-label={`Follow us on Instagram — ${handle}`}
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              <span>{handle}</span>
            </a>
            <h2 id="instagram-heading" className="mt-2 text-[clamp(2.5rem,6vw,7rem)] font-display font-bold uppercase leading-[0.84] tracking-[-0.03em] select-none text-black">
               On<br />Instagram
            </h2>
          </div>
          <a
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ${handle} on Instagram`}
            className="h-10 inline-flex w-fit shrink-0 items-center gap-2 rounded-[0.35rem] bg-[#111111] px-4 sm:px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            <InstagramIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden">Follow</span>
            <span className="hidden sm:inline">Follow {handle}</span>
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-12 md:grid-rows-2" role="list" aria-label="Instagram posts">
          {posts.slice(0, 4).map((post, index) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={post.caption}
              className={`group relative block overflow-hidden rounded-xl bg-[#e9ecef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-3 sm:rounded-2xl ${postLayouts[index]} ${postRatios[index]}`}
            >
              <Image
                src={post.url}
                alt={post.caption}
                fill
                sizes={index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 50vw, 30vw"}
                className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
              />

              <div className="absolute bottom-4 right-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:bottom-5 sm:right-5">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.4} aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>

        <div className="flex justify-end pt-7">
          <a
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 border-b border-black/25 pb-1 text-[9px] font-medium uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-black hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-black focus-visible:outline-offset-4 sm:text-[10px]"
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
