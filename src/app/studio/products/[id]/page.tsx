"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#111] border border-white/10 p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <h2 className="text-white font-medium text-lg">Delete Product?</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          This will permanently delete the product, all its images, and all variants. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-gray-400 hover:text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudioEditProduct() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    collectionTag: "",
    category: "",
    isNew: false,
    isSoldOut: false,
    isBestSeller: false,
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (!data.error) {
        setProduct(data);
        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price?.toString() || "",
          collectionTag: data.brand || "BAGIFYYYY AW24",
          category: data.category || "",
          isNew: data.isNew || false,
          isSoldOut: data.isSoldOut || false,
          isBestSeller: data.isBestSeller || false,
        });
        // Map images — API returns urls array, we need id+url objects
        // Re-fetch raw product data for image IDs
        const rawRes = await fetch(`/api/studio/product-images/${id}`);
        if (rawRes.ok) {
          const rawImages = await rawRes.json();
          setImages(rawImages);
        } else {
          // fallback: build from url array without IDs
          setImages(
            (data.images || []).map((url: string, i: number) => ({
              id: `img-${i}`,
              url,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Failed to save. Please try again.");
      }
    } catch {
      alert("Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setAddingImage(true);
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
      } else {
        alert("Failed to add image");
      }
    } catch {
      alert("Error adding image");
    } finally {
      setAddingImage(false);
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
      } else {
        alert("Failed to delete image");
      }
    } catch {
      alert("Error deleting image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeleteProduct = async () => {
    setDeletingProduct(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/studio");
        router.refresh();
      } else {
        alert("Failed to delete product");
        setDeletingProduct(false);
      }
    } catch {
      alert("Error deleting product");
      setDeletingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-4">
            Product not found
          </p>
          <Link
            href="/studio"
            className="text-[9px] font-bold uppercase tracking-widest text-white hover:text-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link
            href="/studio"
            className="text-gray-600 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-600 mb-1">
              STUDIO / EDIT
            </p>
            <h1 className="text-xl font-medium tracking-tight text-white">
              {form.name || product.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/product/${id}`}
            target="_blank"
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left: Main Fields */}
          <div className="flex flex-col gap-6">
            {/* Collection Tag */}
            <div className="bg-[#111] border border-white/5 p-6">
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                Collection Tag
              </label>
              <p className="text-[9px] text-gray-600 mb-3">
                Shown at the top of the product page (e.g., "BAGIFYYYY AW24")
              </p>
              <input
                name="collectionTag"
                value={form.collectionTag}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                placeholder="BAGIFYYYY AW24"
              />
            </div>

            {/* Product Name */}
            <div className="bg-[#111] border border-white/5 p-6">
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-3">
                Product Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                placeholder="Y2K Cyber Hoodie"
              />
            </div>

            {/* Price & Category row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] border border-white/5 p-6">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-3">
                  Price (₹)
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                  placeholder="15000"
                />
              </div>

              <div className="bg-[#111] border border-white/5 p-6">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-3">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-[#111] border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors appearance-none"
                >
                  <option value="accessories">Accessories</option>
                  <option value="topwear">Topwear</option>
                  <option value="bottomwear">Bottomwear</option>
                  <option value="footwear">Footwear</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#111] border border-white/5 p-6">
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                Description
              </label>
              <p className="text-[9px] text-gray-600 mb-3">
                Include size / fit info here — no size selector on the product page.
              </p>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={7}
                required
                className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
                placeholder="Oversized Y2K cyber hoodie in acid-washed black. This piece is a size L and fits chest 40–44in. Made in India."
              />
            </div>

            {/* Flags */}
            <div className="bg-[#111] border border-white/5 p-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                Status Flags
              </p>
              <div className="flex flex-wrap gap-6">
                {(
                  [
                    { name: "isNew", label: "New Arrival" },
                    { name: "isSoldOut", label: "Sold Out" },
                    { name: "isBestSeller", label: "Best Seller" },
                  ] as const
                ).map(({ name, label }) => (
                  <label
                    key={name}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      checked={form[name]}
                      onChange={handleChange}
                      className="w-4 h-4 accent-white"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Image Gallery */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#111] border border-white/5 p-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                Images ({images.length})
              </p>

              {/* Image grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative aspect-square bg-white/5 group overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-contain mix-blend-lighten"
                    />
                    {/* Delete overlay */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={deletingImageId === img.id}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      {deletingImageId === img.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <X className="w-5 h-5 text-red-400" />
                          <span className="text-[8px] font-bold uppercase tracking-widest text-red-400">
                            Remove
                          </span>
                        </div>
                      )}
                    </button>
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-black/70 text-[7px] font-bold uppercase tracking-widest text-gray-400 px-1.5 py-0.5">
                        Primary
                      </span>
                    )}
                  </div>
                ))}

                {images.length === 0 && (
                  <div className="col-span-2 aspect-square bg-white/3 flex items-center justify-center">
                    <p className="text-[9px] uppercase tracking-widest text-gray-700">
                      No images
                    </p>
                  </div>
                )}
              </div>

              {/* Add new image */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600 mb-3">
                  Add Image URL
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-transparent border border-white/10 text-white px-3 py-2 text-xs outline-none focus:border-white/30 transition-colors placeholder:text-gray-700"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={addingImage || !newImageUrl.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 disabled:opacity-40 transition-colors"
                  >
                    {addingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[8px] text-gray-700 mt-2">
                  Paste a public image URL and press Enter or +
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="mt-8 flex items-center gap-6 border-t border-white/5 pt-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 bg-white text-black px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>

          {saved && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
              Changes saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteProduct}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
