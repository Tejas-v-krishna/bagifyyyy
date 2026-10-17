"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Save,
  Plus,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { uploadDeviceImages } from "@/lib/studioUpload";
import { IMAGE_ACCEPT_ATTRIBUTE } from "@/lib/imageFormats";

type ReviewImage = { src: string; alt: string };

const passthroughLoader = ({ src }: { src: string }) => src;

export default function StudioReviewsPage() {
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/studio/reviews");
        const data = await res.json();
        if (Array.isArray(data.images)) setImages(data.images);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const flash = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingIdx(-1);
    setMessage(null);
    try {
      const urls = await uploadDeviceImages(Array.from(fileList));
      setImages((prev) =>
        [...prev, ...urls.map((src) => ({ src, alt: "" }))].slice(0, 30)
      );
      flash("success", `${urls.length} screenshot${urls.length > 1 ? "s" : ""} uploaded. Hit Save to publish.`);
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/studio/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      flash("success", `Published ${images.length} review screenshot${images.length === 1 ? "" : "s"} to all product pages.`);
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-y2k-gunmetal/15">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
            Product pages
          </span>
          <h1 className="font-display font-medium text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            Community reviews
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-0.5">
            DM screenshots shown on every product page. No user-written reviews.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            className="flex items-center gap-2 border border-y2k-gunmetal/10 text-y2k-gunmetal px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider hover:border-y2k-gunmetal hover:bg-white transition-colors bg-transparent"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View store
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-y2k-gunmetal text-white px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save reviews"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-xs flex items-center gap-2 border bg-white ${
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

      <div className="bg-white border border-y2k-gunmetal/15 p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT_ATTRIBUTE}
          multiple
          className="hidden"
          aria-label="Upload review screenshots"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingIdx !== null}
          className="flex items-center gap-2 bg-black text-white px-5 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-black/85 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploadingIdx !== null ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{uploadingIdx !== null ? "Uploading…" : "Add screenshots"}</span>
        </button>
        <p className="mt-2 text-[11px] text-black/50">
          {images.length}/30 · shows on all product pages in this order. Use ← → to reorder.
        </p>
      </div>

      {!loaded ? (
        <p className="text-xs text-black/50">Loading…</p>
      ) : images.length === 0 ? (
        <div className="bg-white border border-dashed border-black/20 p-10 text-center">
          <Upload className="w-6 h-6 mx-auto mb-3 text-black/30" />
          <p className="text-xs font-bold uppercase tracking-wider">No review screenshots yet</p>
          <p className="mt-1 text-[11px] text-black/50">Upload Instagram DM screenshots above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={`${img.src}-${idx}`} className="bg-white border border-y2k-gunmetal/15 p-3">
              <div className="relative h-48 w-full overflow-hidden bg-black">
                <Image
                  src={img.src}
                  alt={img.alt || `Review ${idx + 1}`}
                  fill
                  loader={passthroughLoader}
                  unoptimized
                  className="object-cover object-top"
                />
              </div>
              <input
                type="text"
                value={img.alt}
                onChange={(e) =>
                  setImages((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, alt: e.target.value } : p))
                  )
                }
                placeholder={`Alt text ${idx + 1}`}
                aria-label={`Alt text for screenshot ${idx + 1}`}
                className="mt-2 w-full bg-transparent border-b border-black/10 text-xs px-1 py-1.5 outline-none focus:border-black"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move left"
                    className="px-2 py-1 text-xs border border-black/10 hover:bg-black hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === images.length - 1}
                    aria-label="Move right"
                    className="px-2 py-1 text-xs border border-black/10 hover:bg-black hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Remove screenshot ${idx + 1}`}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-y2k-gunmetal text-white px-8 py-4 text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save reviews"}
          </button>
        </div>
      )}
    </div>
  );
}
