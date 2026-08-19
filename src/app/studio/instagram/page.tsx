"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  Save,
  Film,
  Copy,
  Heart,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface InstagramPostItem {
  id: string;
  url: string;
  type: "reel" | "carousel" | "image";
  likes: string;
  comments: string;
  caption: string;
  link: string;
}

export default function StudioInstagramPage() {
  const [handle, setHandle] = useState("bagifyyyy");
  const [posts, setPosts] = useState<InstagramPostItem[]>([
    {
      id: "post-1",
      url: "/assets/ai/prod_model_7_chromebelt_1786660225515.jpg",
      type: "reel",
      likes: "4.2K",
      comments: "248",
      caption: "✦ DROP 09: Heavy 3D Chrome Star Studded Belt in distressed full-grain leather.",
      link: "https://www.instagram.com/bagifyyyy",
    },
    {
      id: "post-2",
      url: "/assets/ai/prod_model_6_denimjacket_1786660137724.jpg",
      type: "carousel",
      likes: "6.7K",
      comments: "512",
      caption: "14.5oz Japanese Selvedge Raw Denim Trucker fitting. Boxy cyber silhouette.",
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
      caption: "Heavyweight 480GSM Dual-Zip Cyber Fleece in Charcoal Slate.",
      link: "https://www.instagram.com/bagifyyyy",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/studio/instagram");
        const data = await res.json();
        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          setPosts(data.posts);
        }
        if (data.profile?.username) {
          setHandle(data.profile.username);
        }
      } catch (err) {
        console.error("Failed to load instagram feed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handlePostChange = (index: number, field: keyof InstagramPostItem, value: any) => {
    setPosts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/studio/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { username: handle.replace("@", "").trim(), name: "BAGIFYYYY" },
          posts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save feed.");

      setMessage({ type: "success", text: "Instagram feed updated successfully on homepage!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 sm:px-10 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-gray-600 mb-2">
            BAGIFYYYY / STUDIO
          </p>
          <h1 className="text-2xl font-medium tracking-tight">Instagram Lookbook Feed</h1>
          <p className="text-xs text-gray-400 mt-1">
            Curate and update the 4 featured Instagram drop posts shown on the store homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 border border-white/20 text-white px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:border-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Homepage
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save Live Feed"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-red-950/40 border-red-800 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Handle Setting */}
      <div className="bg-[#111] border border-white/5 p-6 mb-8">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
          Instagram Account Handle
        </label>
        <div className="flex items-center gap-2 max-w-sm">
          <span className="text-gray-500 font-mono text-sm">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="bagifyyyy"
            className="bg-white/5 border border-white/10 text-white text-xs px-3.5 py-2 outline-none focus:border-white/40 flex-1 font-mono"
          />
        </div>
      </div>

      {/* 4 Posts Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map((post, idx) => (
          <div key={post.id || idx} className="bg-[#111] border border-white/8 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                  POST 0{idx + 1}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">
                  {post.type.toUpperCase()}
                </span>
              </div>

              {/* Image Preview & URL */}
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 shrink-0 bg-white/5 relative border border-white/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                  <div className="absolute top-1 right-1 bg-black/60 p-1 text-white">
                    {post.type === "reel" ? <Film className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Image / Thumbnail URL *
                    </label>
                    <input
                      type="text"
                      value={post.url}
                      onChange={(e) => handlePostChange(idx, "url", e.target.value)}
                      placeholder="/assets/ai/prod_model_7_chromebelt_1786660225515.jpg"
                      className="w-full bg-white/5 border border-white/10 text-white text-[11px] px-2.5 py-1.5 outline-none focus:border-white/40 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Post Type
                    </label>
                    <select
                      value={post.type}
                      onChange={(e) => handlePostChange(idx, "type", e.target.value as any)}
                      className="bg-[#181818] border border-white/10 text-white text-[10px] uppercase font-bold px-2.5 py-1 outline-none cursor-pointer"
                    >
                      <option value="reel">Reel / Video</option>
                      <option value="carousel">Lookbook Carousel</option>
                      <option value="image">Single Photo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="mb-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  value={post.caption}
                  onChange={(e) => handlePostChange(idx, "caption", e.target.value)}
                  placeholder="Drop caption text..."
                  className="w-full bg-white/5 border border-white/10 text-white text-xs p-2.5 outline-none focus:border-white/40"
                />
              </div>

              {/* Engagement & Link */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" /> Likes
                  </label>
                  <input
                    type="text"
                    value={post.likes}
                    onChange={(e) => handlePostChange(idx, "likes", e.target.value)}
                    placeholder="4.2K"
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1 flex items-center gap-1">
                    <MessageCircle className="w-2.5 h-2.5" /> Comments
                  </label>
                  <input
                    type="text"
                    value={post.comments}
                    onChange={(e) => handlePostChange(idx, "comments", e.target.value)}
                    placeholder="248"
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Instagram Link URL
                  </label>
                  <input
                    type="text"
                    value={post.link}
                    onChange={(e) => handlePostChange(idx, "link", e.target.value)}
                    placeholder="https://instagram.com/bagifyyyy"
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Instagram Feed"}
        </button>
      </div>
    </div>
  );
}
