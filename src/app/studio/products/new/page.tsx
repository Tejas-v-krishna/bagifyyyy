"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function StudioNewProduct() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    collectionTag: "BAGIFYYYY",
    category: CATEGORIES[0].slug,
    isNew: true,
    isSoldOut: false,
    isBestSeller: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const value =
      target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  // ── Device File Upload Handler ───────────────────────────────────────────────
  const handleDeviceUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingFiles(true);

    try {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => {
        formData.append("files", file);
      });

      const uploadRes = await fetch("/api/studio/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const uploadedUrls: string[] = uploadData.urls || [uploadData.url];
      setImages((prev) => [...prev, ...uploadedUrls]);
      setActiveImageIndex(images.length);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to upload image from device.");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
    setActiveImageIndex(images.length);
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (activeImageIndex >= images.length - 1) {
      setActiveImageIndex(Math.max(0, images.length - 2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validImages = images.filter((u) => u.trim());
    if (validImages.length === 0) {
      alert("Please upload or add at least one product photo.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price) || 0,
          category: form.category,
          description: form.description,
          isNew: form.isNew,
          isSoldOut: form.isSoldOut,
          isBestSeller: form.isBestSeller,
          image: validImages[0],
          collectionTag: form.collectionTag,
        }),
      });

      if (!res.ok) {
        alert("Failed to create product");
        setLoading(false);
        return;
      }

      const created = await res.json();

      if (validImages.length > 1) {
        await Promise.all(
          validImages.slice(1).map((url) =>
            fetch(`/api/admin/products/${created.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            })
          )
        );
      }

      if (form.collectionTag && form.collectionTag !== "BAGIFYYYY") {
        await fetch(`/api/admin/products/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionTag: form.collectionTag }),
        });
      }

      router.push("/studio/products");
      router.refresh();
    } catch {
      alert("Error creating product");
      setLoading(false);
    }
  };

  const activeImgUrl = images[activeImageIndex] || images[0] || "";

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-y2k-gunmetal/15 p-4 shadow-xs sticky top-16 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/studio/products"
            className="text-y2k-slate hover:text-black transition-colors"
            title="Return to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
              NEW PRODUCT
            </span>
            <h1 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">
              ADD PRODUCT
            </h1>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-bagify px-8 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{loading ? "Publishing…" : "Publish Product"}</span>
        </button>
      </div>

      {/* ── MAIN STUDIO WORKSPACE CANVAS ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 lg:p-10 shadow-xs text-y2k-gunmetal">
        
        {/* 3-Column Visual Layout (Matching Product Detail Page) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.7fr_1.15fr] gap-8 lg:gap-10 xl:gap-14">
          
          {/* ── Column 1: Left Details (Title, Description, Specs) ─────────────── */}
          <div className="flex flex-col space-y-6">
            <div className="border-b border-y2k-gunmetal/15 pb-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
                PRODUCT SPECIFICATIONS
              </span>
              <h2 className="font-display text-lg uppercase tracking-tight text-y2k-gunmetal">
                Details &amp; Information
              </h2>
            </div>

            {/* Collection / Brand Tag */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Collection Badge
              </label>
              <input
                type="text"
                name="collectionTag"
                value={form.collectionTag}
                onChange={handleChange}
                className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                placeholder="BAGIFYYYY"
              />
            </div>

            {/* Product Title */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 px-3.5 py-2.5 font-display font-medium text-xl sm:text-2xl text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                placeholder="Over-Sized Heavy Cotton Hoodie"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Description & Fit Details */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                Description &amp; Fit Details *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                required
                className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 p-3.5 text-xs text-y2k-gunmetal leading-relaxed outline-none focus:border-y2k-gunmetal font-sans resize-none"
                placeholder="Describe garment cut, fit, chest/waist measurements, and styling notes..."
              />
            </div>

            {/* Features & Shipping Badges */}
            <div className="space-y-2 pt-4 border-t border-y2k-gunmetal/15 text-[11px] text-y2k-gunmetal/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-y2k-gunmetal shrink-0" />
                <span>Heavyweight Construction Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="font-bold w-4 h-4 text-y2k-gunmetal shrink-0" />
                <span>Free Express Shipping Over ₹2000</span>
              </div>
            </div>
          </div>

          {/* ── Column 2: Center Image Showcase & Gallery (Interactive) ───────── */}
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-y2k-gunmetal/15 pb-4 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-0.5">
                  GALLERY SHOWCASE
                </span>
                <h2 className="font-display text-lg uppercase tracking-tight text-y2k-gunmetal">
                  Product Photos ({images.length})
                </h2>
              </div>

              {images.length > 1 && (
                <span className="text-[10px] font-mono text-y2k-slate font-bold">
                  {(activeImageIndex + 1).toString().padStart(2, "0")} / {images.length.toString().padStart(2, "0")}
                </span>
              )}
            </div>

            {/* Large Interactive Main Image Viewer */}
            <div className="w-full aspect-[3/4] sm:aspect-[4/5] relative bg-y2k-ice border border-y2k-gunmetal/15 overflow-hidden group">
              {activeImgUrl ? (
                <>
                  <Image
                    src={activeImgUrl}
                    alt={form.name || "Product preview"}
                    fill
                    loader={({ src }) => src}
                    unoptimized
                    className="w-full h-full object-cover select-none"
                  />

                  {/* Previous / Next Arrow Controls */}
                  {images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Previous Photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                        title="Next Photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {activeImageIndex === 0 && (
                    <span className="absolute top-3 left-3 bg-y2k-gunmetal text-white text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-sm">
                      Primary Cover Photo
                    </span>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-y2k-slate text-xs uppercase tracking-wider p-6 text-center">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                  <span>No photo uploaded yet</span>
                  <p className="text-[10px] text-y2k-slate/70 mt-1 lowercase">Upload photos from device below</p>
                </div>
              )}
            </div>

            {/* Interactive Thumbnails Selector */}
            {images.length > 0 && (
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate">
                    Click any thumbnail to preview or remove:
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {images.map((url, idx) => {
                    const isSelected = activeImageIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative aspect-square border cursor-pointer transition-all overflow-hidden group/item ${
                          isSelected
                            ? "border-y2k-gunmetal ring-2 ring-y2k-gunmetal bg-white shadow-sm"
                            : "border-y2k-gunmetal/10 opacity-75 hover:opacity-100 hover:border-y2k-gunmetal"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          loader={({ src }) => src}
                          unoptimized
                          className="w-full h-full object-cover"
                        />

                        {/* Delete Thumbnail Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity shadow-sm hover:bg-red-700 cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[7px] font-mono px-1 py-0.5">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Device File Upload Zone ───────────────────────────────────────── */}
            <div className="w-full mt-6 space-y-3 pt-4 border-t border-y2k-gunmetal/15">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block">
                ADD PHOTOS TO PRODUCT
              </span>

              {/* Drag and Drop & Explorer Upload Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleDeviceUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-y2k-gunmetal bg-y2k-ice"
                    : "border-y2k-gunmetal/25 hover:border-y2k-gunmetal bg-y2k-ice/30 hover:bg-y2k-ice/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => handleDeviceUpload(e.target.files)}
                  className="hidden"
                />

                {uploadingFiles ? (
                  <div className="flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
                    <Loader2 className="w-6 h-6 animate-spin text-y2k-gunmetal" />
                    <span>Uploading photo from device…</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-y2k-gunmetal mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
                      Upload from Device / File Explorer
                    </p>
                    <p className="text-[10px] text-y2k-slate mt-1">
                      Drag &amp; drop photos here or click to browse files (JPEG, PNG, WebP)
                    </p>
                  </>
                )}
              </div>

              {/* Optional: Add via Image URL */}
              <div className="pt-2">
                <span className="text-[8px] font-bold uppercase tracking-wider text-y2k-slate block mb-1">
                  Or Paste Public Image URL:
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="flex-1 bg-y2k-ice/40 border border-y2k-gunmetal/10 text-y2k-gunmetal px-3 py-2 text-xs outline-none focus:border-y2k-gunmetal font-medium placeholder:text-y2k-gunmetal/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={uploadingFiles || !newImageUrl.trim()}
                    className="bg-y2k-gunmetal text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
                  >
                    + Add URL
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 3: Right Pricing, Status & Quick Controls ──────────────── */}
          <div className="flex flex-col space-y-6">
            <div className="border-b border-y2k-gunmetal/15 pb-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
                PRICING &amp; INVENTORY
              </span>
              <h2 className="font-display text-lg uppercase tracking-tight text-y2k-gunmetal">
                Live Store Pricing
              </h2>
            </div>

            {/* Price Box */}
            <div className="font-bold bg-y2k-ice/40 border border-y2k-gunmetal/15 p-5 space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                  Selling Price (₹ INR) *
                </label>
                <div className="flex items-center gap-2 border border-y2k-gunmetal/10 bg-white px-3.5 py-2.5">
                  <span className="font-display text-2xl font-bold text-y2k-gunmetal">₹</span>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full font-display font-medium text-2xl sm:text-3xl text-y2k-gunmetal outline-none bg-transparent"
                    placeholder="3499"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-y2k-slate block mb-1.5">
                  Compare-At Price / Original MRP (₹)
                </label>
                <div className="flex items-center gap-2 border border-y2k-gunmetal/10 bg-white px-3.5 py-2">
                  <span className="font-display text-base font-bold text-y2k-slate">₹</span>
                  <input
                    type="number"
                    name="comparePrice"
                    value={form.comparePrice}
                    onChange={handleChange}
                    className="w-full font-display font-medium text-base text-y2k-slate outline-none bg-transparent"
                    placeholder="4999"
                  />
                </div>
              </div>

              {parseFloat(form.comparePrice) > parseFloat(form.price) && (
                <div className="p-2 bg-white border border-y2k-gunmetal/15 text-[10px] font-bold uppercase text-y2k-gunmetal flex items-center justify-between">
                  <span>Customer Savings:</span>
                  <span className="bg-y2k-gunmetal text-white px-2 py-0.5 font-mono">
                    {Math.round(
                      ((parseFloat(form.comparePrice) - parseFloat(form.price)) /
                        parseFloat(form.comparePrice)) *
                        100
                    )}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Inventory Status & Flags */}
            <div className="bg-y2k-ice/40 border border-y2k-gunmetal/15 p-5 space-y-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block">
                STOCK AVAILABILITY &amp; BADGES
              </span>

              {/* Stock Status Toggle */}
              <div
                onClick={() => setForm((prev) => ({ ...prev, isSoldOut: !prev.isSoldOut }))}
                className="flex items-center justify-between p-3.5 bg-white border border-y2k-gunmetal/15 cursor-pointer hover:bg-y2k-ice/60 transition-colors shadow-2xs"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-y2k-gunmetal">Stock Availability</p>
                  <p className="text-[9px] text-y2k-slate mt-0.5">
                    {form.isSoldOut ? "Item is marked as SOLD OUT" : "Item is IN STOCK & Purchasable"}
                  </p>
                </div>
                {form.isSoldOut ? (
                  <ToggleRight className="w-6 h-6 text-red-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-y2k-slate" />
                )}
              </div>

              {/* New Arrival Tag Toggle */}
              <div
                onClick={() => setForm((prev) => ({ ...prev, isNew: !prev.isNew }))}
                className="flex items-center justify-between p-3.5 bg-white border border-y2k-gunmetal/15 cursor-pointer hover:bg-y2k-ice/60 transition-colors shadow-2xs"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-y2k-gunmetal">New Arrival Tag</p>
                  <p className="text-[9px] text-y2k-slate mt-0.5">
                    {form.isNew ? "New Drop Badge ACTIVE" : "New Drop Badge Inactive"}
                  </p>
                </div>
                <Sparkles className={`w-5 h-5 ${form.isNew ? "text-y2k-gunmetal fill-y2k-gunmetal" : "text-y2k-slate"}`} />
              </div>

              {/* Best Seller Badge Toggle */}
              <div
                onClick={() => setForm((prev) => ({ ...prev, isBestSeller: !prev.isBestSeller }))}
                className="flex items-center justify-between p-3.5 bg-white border border-y2k-gunmetal/15 cursor-pointer hover:bg-y2k-ice/60 transition-colors shadow-2xs"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-y2k-gunmetal">Best Seller Badge</p>
                  <p className="text-[9px] text-y2k-slate mt-0.5">
                    {form.isBestSeller ? "Best Seller Badge ACTIVE" : "Standard Catalog Item"}
                  </p>
                </div>
                <Star className={`w-5 h-5 ${form.isBestSeller ? "text-y2k-gunmetal fill-y2k-gunmetal" : "text-y2k-slate"}`} />
              </div>
            </div>

            {/* Bottom Save Action */}
            <button
              type="submit"
              disabled={loading}
              className="btn-bagify w-full py-4 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{loading ? "Publishing Product…" : "Publish Product to Catalog"}</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
