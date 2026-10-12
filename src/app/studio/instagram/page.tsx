"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Save,
  Film,
  Copy,
  Heart,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
} from "lucide-react";
import { uploadDeviceImages } from "@/lib/studioUpload";
import { IMAGE_ACCEPT_ATTRIBUTE } from "@/lib/imageFormats";

interface InstagramPostItem {
  id: string;
  url: string;
  type: "reel" | "carousel" | "image";
  likes: string;
  comments: string;
  caption: string;
  link: string;
}

const passthroughLoader = ({ src }: { src: string }) => src;

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

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
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
      }
    }

    loadData();
  }, []);

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePostChange = (index: number, field: keyof InstagramPostItem, value: string) => {
    setPosts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = async (index: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    setUploadingIdx(index);
    setMessage(null);

    try {
      const urls = await uploadDeviceImages([file]);
      if (urls.length > 0) {
        handlePostChange(index, "url", urls[0]);
        setMessage({
          type: "success",
          text: `Photo for Post 0${index + 1} uploaded & compressed successfully!`,
        });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload photo from device.",
      });
    } finally {
      setUploadingIdx(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
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
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            SOCIAL MEDIA
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            INSTAGRAM FEED
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            Curate and update the featured Instagram posts on your homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/#instagram"
            target="_blank"
            className="flex items-center gap-2 border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider hover:border-y2k-gunmetal hover:bg-white transition-colors bg-transparent"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Homepage
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-y2k-gunmetal text-white px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save Live Feed"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 text-xs flex items-center gap-2 border bg-white ${
            message.type === "success"
              ? "border-y2k-gunmetal text-y2k-gunmetal font-bold"
              : "border-red-500 text-red-600"
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
      <div className="bg-white border border-y2k-gunmetal/15 p-6 mb-8">
        <label className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-2">
          Instagram Account Handle
        </label>
        <div className="flex items-center gap-2 max-w-sm">
          <span className="text-y2k-gunmetal/40 font-mono text-sm">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="bagifyyyy"
            className="bg-transparent border-b border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-2 py-2 outline-none focus:border-y2k-gunmetal flex-1 font-mono"
          />
        </div>
      </div>

      {/* 4 Posts Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map((post, idx) => (
          <div key={post.id || idx} className="bg-white border border-y2k-gunmetal/15 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-y2k-gunmetal/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal">
                  POST 0{idx + 1}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-y2k-gunmetal/40 font-mono font-bold">
                  {post.type}
                </span>
              </div>

              {/* Image Preview & URL */}
              <div className="flex gap-4 mb-4">
                <div
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(idx, e.dataTransfer.files);
                    }
                  }}
                  className="w-24 h-24 shrink-0 bg-y2k-ice relative border border-y2k-gunmetal/15 overflow-hidden cursor-pointer group transition-all hover:border-black"
                  title="Click or drop image to upload from device"
                >
                  <Image
                    src={post.url}
                    alt="Preview"
                    fill
                    loader={passthroughLoader}
                    unoptimized
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                  <div className="absolute top-1 right-1 bg-white/90 border border-y2k-gunmetal/10 p-1 text-y2k-gunmetal z-10">
                    {post.type === "reel" ? <Film className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </div>

                  {uploadingIdx === idx ? (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-[8px] font-mono font-bold uppercase gap-1 z-20">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-bold uppercase tracking-wider gap-1 z-20">
                      <Upload className="w-4 h-4" />
                      <span>Change</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60">
                        Image / Thumbnail URL *
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={uploadingIdx === idx}
                        className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal hover:text-white bg-[#f5f5f2] hover:bg-black px-2.5 py-1 border border-y2k-gunmetal/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {uploadingIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        <span>{uploadingIdx === idx ? "Uploading…" : "Add From Device"}</span>
                      </button>
                    </div>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[idx] = el;
                      }}
                      type="file"
                      accept={IMAGE_ACCEPT_ATTRIBUTE}
                      className="hidden"
                      aria-label={`Upload image for post ${idx + 1}`}
                      onChange={(e) => handleFileUpload(idx, e.target.files)}
                    />

                    <input
                      type="text"
                      value={post.url}
                      onChange={(e) => handlePostChange(idx, "url", e.target.value)}
                      placeholder="/assets/... or https://..."
                      className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 text-y2k-gunmetal text-[11px] px-2.5 py-2 outline-none focus:border-y2k-gunmetal font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                      Post Type
                    </label>
                    <select
                      value={post.type}
                       onChange={(e) => {
                         const value = e.target.value;
                         if (value === "reel" || value === "carousel" || value === "image") {
                           handlePostChange(idx, "type", value);
                         }
                       }}
                      className="bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal text-[10px] uppercase font-bold px-2.5 py-2 outline-none cursor-pointer w-full"
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
                <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  value={post.caption}
                  onChange={(e) => handlePostChange(idx, "caption", e.target.value)}
                  placeholder="Drop caption text..."
                  className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 text-y2k-gunmetal text-xs p-2.5 outline-none focus:border-y2k-gunmetal resize-none"
                />
              </div>

              {/* Engagement & Link */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Likes
                  </label>
                  <input
                    type="text"
                    value={post.likes}
                    onChange={(e) => handlePostChange(idx, "likes", e.target.value)}
                    placeholder="4.2K"
                    className="w-full bg-transparent border-b border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-1 py-1.5 outline-none font-mono focus:border-y2k-gunmetal"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> Comments
                  </label>
                  <input
                    type="text"
                    value={post.comments}
                    onChange={(e) => handlePostChange(idx, "comments", e.target.value)}
                    placeholder="248"
                    className="w-full bg-transparent border-b border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-1 py-1.5 outline-none font-mono focus:border-y2k-gunmetal"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal/60 block mb-1.5">
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={post.link}
                    onChange={(e) => handlePostChange(idx, "link", e.target.value)}
                    placeholder="https://instagram..."
                    className="w-full bg-transparent border-b border-y2k-gunmetal/10 text-y2k-gunmetal text-xs px-1 py-1.5 outline-none font-mono focus:border-y2k-gunmetal"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar */}
      <div className="mt-10 flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-y2k-gunmetal text-white px-8 py-4 text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-md disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Instagram Feed"}
        </button>
      </div>
    </div>
  );
}
