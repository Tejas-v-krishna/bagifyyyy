"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  Trash2,
  Plus,
  X,
  ExternalLink,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Layers,
  FileText,
  Heart,
  Ruler,
  ShoppingBag,
  RotateCcw
} from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  brand: string;
  category: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  images: ProductImage[];
}

function ConfirmDeleteModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 font-sans">
      <div className="bg-white border border-y2k-gunmetal/10 p-8 max-w-sm w-full shadow-2xl text-y2k-gunmetal">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <h2 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal">Delete Product?</h2>
        </div>
        <p className="text-y2k-gunmetal/70 text-xs mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-y2k-gunmetal">"{productName}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal hover:bg-y2k-ice py-3 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer shadow-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudioEditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Preview interactive state
  const [previewSize, setPreviewSize] = useState("M");
  const [previewWishlisted, setPreviewWishlisted] = useState(false);
  const [previewBagAdded, setPreviewBagAdded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    brand: "",
    collectionTag: "BAGIFYYYY",
    category: "topwear",
    isNew: false,
    isSoldOut: false,
    isBestSeller: false,
  });

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (!data.error) {
        setProduct(data);
        const originalPrice = data.price ? String(data.price) : "";
        const estComparePrice = data.price ? String(Math.round(data.price * 1.35)) : "";

        setForm({
          name: data.name || "",
          description: data.description || "",
          price: originalPrice,
          comparePrice: estComparePrice,
          brand: data.brand || "BAGIFYYYY",
          collectionTag: data.collectionTag || data.brand || "BAGIFYYYY",
          category: data.category || "topwear",
          isNew: Boolean(data.isNew),
          isSoldOut: Boolean(data.isSoldOut),
          isBestSeller: Boolean(data.isBestSeller),
        });

        const rawRes = await fetch(`/api/admin/products/${id}/images`);
        if (rawRes.ok) {
          const rawImages = await rawRes.json();
          setImages(rawImages);
        } else {
          setImages(
            (data.images || []).map((img: any, i: number) => ({
              id: typeof img === "object" ? img.id || `img-${i}` : `img-${i}`,
              url: typeof img === "object" ? img.url : img,
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      } else {
        alert("Failed to save product changes.");
      }
    } catch {
      alert("Error saving changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Device File Upload Handler (via Explorer or Drag-and-Drop) ──────────────
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

      // Add uploaded images to product via API
      for (const url of uploadedUrls) {
        const addRes = await fetch(`/api/admin/products/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (addRes.ok) {
          const newImg = await addRes.json();
          setImages((prev) => [...prev, newImg]);
        }
      }

      setActiveImageIndex(images.length);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload image from device.");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    setUploadingFiles(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newImageUrl.trim() }),
      });
      if (res.ok) {
        const newImg = await res.json();
        setImages((prev) => [...prev, newImg]);
        setNewImageUrl("");
        setActiveImageIndex(images.length);
      } else {
        alert("Failed to add image URL");
      }
    } catch {
      alert("Error adding image URL");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setActiveImageIndex(0);
      } else {
        alert("Failed to remove image");
      }
    } catch {
      alert("Error removing image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/studio/products");
        router.refresh();
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Error deleting product");
    }
  };

  const activeImgUrl = images[activeImageIndex]?.url || images[0]?.url || "";
  const numericPrice = parseFloat(form.price) || 0;
  const numericComparePrice = parseFloat(form.comparePrice) || 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="text-[10px] font-bold uppercase tracking-wide text-y2k-slate animate-pulse">
          Loading Product Studio…
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <p className="text-xs font-bold uppercase tracking-wide text-y2k-gunmetal mb-4">
          Product not found in catalog
        </p>
        <Link
          href="/studio/products"
          className="btn-bagify px-6 py-2.5 text-[10px] font-bold uppercase tracking-wide"
        >
          ← Return to Products &amp; Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header & Mode Switcher ────────────────────────────────────────── */}
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
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate">
                PRODUCT STUDIO
              </span>
            </div>
            <h1 className="font-display font-medium text-lg uppercase tracking-tight text-y2k-gunmetal truncate max-w-xs sm:max-w-md">
              {form.name || product.name}
            </h1>
          </div>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-y2k-ice p-1 border border-y2k-gunmetal/15">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "editor"
                  ? "bg-y2k-gunmetal text-white shadow-2xs"
                  : "text-y2k-slate hover:text-black"
              }`}
            >
              Studio Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-y2k-gunmetal text-white shadow-2xs"
                  : "text-y2k-slate hover:text-black"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Store Preview</span>
            </button>
          </div>

          <Link
            href={`/product/${id}`}
            target="_blank"
            className="flex items-center gap-1.5 bg-white border border-y2k-gunmetal/10 text-y2k-gunmetal px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide hover:bg-y2k-ice transition-colors cursor-pointer shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-bagify px-6 py-2 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Saving…" : saved ? "Saved Changes!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-y2k-gunmetal text-white text-xs font-bold uppercase tracking-wide flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Product details updated successfully! Live page is updated.</span>
          </div>
          <Link href={`/product/${id}`} target="_blank" className="underline text-[10px]">
            Preview on website →
          </Link>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: STUDIO INLINE EDITOR
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "editor" && (
        <div className="bg-white border border-y2k-gunmetal/15 p-6 sm:p-8 lg:p-10 shadow-xs text-y2k-gunmetal">
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
                <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
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
                <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 px-3.5 py-2.5 font-display font-medium text-xl sm:text-2xl text-y2k-gunmetal outline-none focus:border-y2k-gunmetal"
                  placeholder="Product Name"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal outline-none focus:border-y2k-gunmetal cursor-pointer"
                >
                  <option value="topwear">Topwear / Shirts &amp; Tees</option>
                  <option value="bottomwear">Bottomwear / Pants &amp; Cargos</option>
                  <option value="accessories">Accessories</option>
                  <option value="footwear">Footwear</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Description & Fit Details */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
                  Description &amp; Fit Details *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  required
                  className="w-full bg-y2k-ice/50 border border-y2k-gunmetal/10 p-3.5 text-xs text-y2k-gunmetal leading-relaxed outline-none focus:border-y2k-gunmetal font-sans resize-none"
                  placeholder="Describe garment cut, fit, chest/waist measurements, and styling..."
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
                    <img
                      src={activeImgUrl}
                      alt={form.name}
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
                      <span className="absolute top-3 left-3 bg-y2k-gunmetal text-white text-[8px] font-bold uppercase tracking-wide px-2.5 py-1 shadow-sm">
                        Primary Cover Photo
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-y2k-slate text-xs uppercase tracking-wide p-6 text-center">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                    <span>No product image uploaded yet</span>
                    <p className="text-[10px] text-y2k-slate/70 mt-1 lowercase">Select a photo from your device below</p>
                  </div>
                )}
              </div>

              {/* Interactive Thumbnails Selector */}
              {images.length > 0 && (
                <div className="w-full mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate">
                      Click any thumbnail to preview or manage:
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                    {images.map((img, idx) => {
                      const isSelected = activeImageIndex === idx;
                      return (
                        <div
                          key={img.id}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative aspect-square border cursor-pointer transition-all overflow-hidden group/item ${
                            isSelected
                              ? "border-y2k-gunmetal ring-2 ring-y2k-gunmetal bg-white shadow-sm"
                              : "border-y2k-gunmetal/10 opacity-75 hover:opacity-100 hover:border-y2k-gunmetal"
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Delete Image Overlay Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(img.id);
                            }}
                            disabled={deletingImageId === img.id}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity shadow-sm hover:bg-red-700 cursor-pointer"
                            title="Delete image"
                          >
                            {deletingImageId === img.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
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
                  <span className="text-[8px] font-bold uppercase tracking-wide text-y2k-slate block mb-1">
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
                      className="bg-y2k-gunmetal text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
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
                  <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
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
                  <label className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate block mb-1.5">
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

                {numericComparePrice > numericPrice && (
                  <div className="p-2 bg-white border border-y2k-gunmetal/15 text-[10px] font-bold uppercase text-y2k-gunmetal flex items-center justify-between">
                    <span>Customer Savings:</span>
                    <span className="bg-y2k-gunmetal text-white px-2 py-0.5 font-mono">
                      {Math.round(((numericComparePrice - numericPrice) / numericComparePrice) * 100)}% OFF
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
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="btn-bagify w-full py-4 px-5 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? "Saving Changes…" : saved ? "Saved Changes!" : "Save Changes"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: STOREFRONT CUSTOMER VIEW PREVIEW
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="bg-white border border-y2k-gunmetal/15 shadow-xs overflow-hidden text-y2k-gunmetal">
          {/* Preview Banner Header */}
          <div className="bg-y2k-ice px-6 py-3 border-b border-y2k-gunmetal/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-y2k-gunmetal" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-y2k-gunmetal">
                STOREFRONT LIVE CUSTOMER PREVIEW — This reflects your current edits in real-time
              </span>
            </div>
            <button
              onClick={() => setActiveTab("editor")}
              className="text-[9px] font-bold uppercase tracking-wide text-y2k-slate hover:text-black transition-colors underline cursor-pointer"
            >
              Return to Studio Editor →
            </button>
          </div>

          <div className="p-6 sm:p-10 lg:p-14">
            {/* Top Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-y2k-gunmetal/50">
                <span>HOME</span>
                <span>/</span>
                <span>DROPS</span>
                <span>/</span>
                <span>{form.category?.toUpperCase() || "COLLECTION"}</span>
                <span>/</span>
                <span className="text-y2k-gunmetal truncate max-w-[200px]">{form.name || "Untitled Product"}</span>
              </nav>
            </div>

            {/* 3-Column Public Store Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.8fr_1.1fr] gap-8 lg:gap-10 xl:gap-14">
              
              {/* Left: Garment Specs */}
              <div className="flex flex-col order-2 lg:order-1 pt-0 lg:pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-y2k-slate">
                    {form.collectionTag || "BAGIFYYYY"}
                  </span>
                  <span className="text-[9px] font-mono text-y2k-gunmetal/40">· ART: {id.substring(0, 8).toUpperCase()}</span>
                </div>

                <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl leading-[1.08] tracking-tight text-y2k-gunmetal mb-4">
                  {form.name || "Product Name"}
                </h1>

                <p className="text-xs sm:text-sm text-y2k-gunmetal/80 leading-relaxed font-normal mb-6">
                  {form.description ||
                    "A signature piece crafted with heavyweight construction and tailored modern streetwear silhouette."}
                </p>

                {/* Scarcity Low Stock Indicator */}
                <div className="flex items-center gap-2 py-2 px-3 bg-y2k-ice border border-y2k-gunmetal/15 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal mb-6">
                  <span className="w-2 h-2 rounded-full bg-y2k-gunmetal animate-pulse" />
                  <span>LIMITED QUANTITY · 100% AUTHENTIC QUALITY</span>
                </div>

                {/* Size Selector with Inline Size Guide */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/70">
                      SELECT SIZE
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal">
                      <Ruler className="w-3 h-3" />
                      <span>Size Guide</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPreviewSize(s)}
                        className={`text-xs font-bold uppercase tracking-wider px-3.5 py-2 border transition-all cursor-pointer ${
                          previewSize === s
                            ? "border-y2k-gunmetal bg-y2k-gunmetal text-white"
                            : "border-y2k-gunmetal/10 text-y2k-gunmetal hover:border-y2k-gunmetal bg-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Notes */}
                <div className="text-[11px] text-y2k-gunmetal/70 space-y-1.5 pt-4 border-t border-y2k-gunmetal/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-y2k-gunmetal" />
                    <span>100% Verified Heavyweight Quality Standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="font-bold w-3.5 h-3.5 text-y2k-gunmetal" />
                    <span>Complimentary Shipping Over ₹2000</span>
                  </div>
                </div>
              </div>

              {/* Center: Image Showcase */}
              <div className="flex flex-col items-center order-1 lg:order-2">
                <div className="w-full aspect-[3/4] md:aspect-[4/5] relative bg-[#FAFAFA] border border-y2k-gunmetal/10 overflow-hidden group">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={activeImgUrl}
                        alt={form.name}
                        className="w-full h-full object-cover"
                      />

                      {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                            className="w-9 h-9 rounded-full bg-white/90 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                            className="w-9 h-9 rounded-full bg-white/90 text-y2k-gunmetal flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-y2k-gunmetal/40 text-xs uppercase tracking-wider">
                      No Image Uploaded
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center gap-3 mt-4 text-xs font-bold uppercase tracking-wider flex-wrap justify-center">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`px-3 py-1.5 border transition-all cursor-pointer font-mono text-[11px] ${
                          activeImageIndex === idx
                            ? "bg-y2k-gunmetal text-white border-y2k-gunmetal ring-2 ring-y2k-gunmetal/20 shadow-xs"
                            : "bg-white text-y2k-gunmetal/60 border-y2k-gunmetal/15 hover:border-y2k-gunmetal"
                        }`}
                      >
                        {(idx + 1).toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Price & Add to Bag */}
              <div className="flex flex-col order-3 lg:order-3 pt-0 lg:pt-8">
                <div className="mb-6 lg:text-right">
                  <h2 className="font-bold font-display font-medium text-3xl sm:text-4xl lg:text-5xl tracking-tight text-y2k-gunmetal">
                    ₹{numericPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </h2>

                  {numericComparePrice > numericPrice && (
                    <div className="flex items-center gap-2 mt-1 justify-start lg:justify-end">
                      <span className="font-bold text-xs text-y2k-slate line-through font-mono">
                        MRP: ₹{numericComparePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[9px] font-bold bg-y2k-gunmetal text-white px-2 py-0.5 font-mono">
                        {Math.round(((numericComparePrice - numericPrice) / numericComparePrice) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {form.isSoldOut ? (
                  <div className="p-5 bg-y2k-ice/70 border border-y2k-gunmetal/15 text-center space-y-3">
                    <p className="text-xs font-bold uppercase text-red-600">This piece is sold out</p>
                    <p className="text-[10px] text-y2k-slate">Customers will see a "Notify Me" restock alert form</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewBagAdded(true);
                        setTimeout(() => setPreviewBagAdded(false), 2000);
                      }}
                      className="btn-bagify w-full py-4 px-5 text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center justify-between shadow-md cursor-pointer"
                    >
                      <span>{previewBagAdded ? "✓ ADDED TO BAG" : `ADD TO BAG (${previewSize})`}</span>
                      <span className="font-bold text-[11px] text-white/70 font-normal">
                        BAG: ₹{numericPrice.toLocaleString("en-IN")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewWishlisted(!previewWishlisted)}
                      className="w-full py-3 border border-y2k-gunmetal/10 text-y2k-gunmetal hover:border-y2k-gunmetal flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          previewWishlisted ? "fill-y2k-gunmetal text-y2k-gunmetal" : ""
                        }`}
                      />
                      <span>{previewWishlisted ? "SAVED IN WISHLIST" : "SAVE TO WISHLIST"}</span>
                    </button>
                  </div>
                )}

                {/* Return Policy Notice */}
                <div className="mt-8 p-4 bg-y2k-ice/60 border border-y2k-gunmetal/15 text-[10px] text-y2k-gunmetal/80 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-y2k-gunmetal">7-DAY RETURNS &amp; VERIFIED QUALITY</p>
                  <p className="leading-relaxed">
                    Every piece is inspected for fabric density, hardware integrity, and provenance.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          productName={form.name || product.name}
          onConfirm={handleDeleteProduct}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
