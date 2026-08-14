"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";

export default function StudioNewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    collectionTag: "BAGIFYYYY AW24",
    category: "topwear",
    isNew: true,
    isSoldOut: false,
  });

  const [imageUrls, setImageUrls] = useState<string[]>([""]);

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

  const handleImageChange = (idx: number, value: string) => {
    setImageUrls((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addImageRow = () => setImageUrls((prev) => [...prev, ""]);

  const removeImageRow = (idx: number) =>
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validImages = imageUrls.filter((u) => u.trim());
    if (validImages.length === 0) {
      alert("Add at least one image URL.");
      setLoading(false);
      return;
    }

    try {
      // Create product via existing admin API
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description,
          isNew: form.isNew,
          isSoldOut: form.isSoldOut,
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

      // Add additional images (beyond the first)
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

      // Update brand (collection tag) — POST route hardcodes it to "BAGIFYYYY"
      if (form.collectionTag && form.collectionTag !== "BAGIFYYYY") {
        await fetch(`/api/admin/products/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionTag: form.collectionTag }),
        });
      }

      router.push("/studio");
      router.refresh();
    } catch {
      alert("Error creating product");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/studio"
          className="text-gray-600 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-gray-600 mb-1">
            STUDIO / NEW PRODUCT
          </p>
          <h1 className="text-xl font-medium tracking-tight text-white">
            Add Product
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 max-w-5xl">
          {/* Left: Fields */}
          <div className="flex flex-col gap-6">
            {/* Collection Tag */}
            <div className="bg-[#111] border border-white/5 p-6">
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                Collection Tag
              </label>
              <p className="text-[9px] text-gray-600 mb-3">
                Displayed at the top of the product page
              </p>
              <input
                name="collectionTag"
                value={form.collectionTag}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors"
                placeholder="BAGIFYYYY AW24"
              />
            </div>

            {/* Name */}
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

            {/* Price & Category */}
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
                Include size / fit info here.
              </p>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                required
                className="w-full bg-transparent border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
                placeholder="Oversized Y2K cyber hoodie in acid-washed black. This piece is a size L and fits chest 40–44in. Made in India."
              />
            </div>

            {/* Flags */}
            <div className="bg-[#111] border border-white/5 p-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                Status
              </p>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNew"
                    checked={form.isNew}
                    onChange={handleChange}
                    className="w-4 h-4 accent-white"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    New Arrival
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSoldOut"
                    checked={form.isSoldOut}
                    onChange={handleChange}
                    className="w-4 h-4 accent-white"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Sold Out
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Images */}
          <div className="bg-[#111] border border-white/5 p-6 h-fit">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-4">
              Images
            </p>
            <p className="text-[9px] text-gray-600 mb-4">
              Add one or more image URLs. First URL is the primary image.
            </p>

            <div className="flex flex-col gap-3">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600 w-6">
                        {idx + 1}
                      </span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-transparent border border-white/10 text-white px-3 py-2 text-xs outline-none focus:border-white/30 transition-colors placeholder:text-gray-700"
                      />
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageRow(idx)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {/* Mini preview */}
                    {url && (
                      <div className="ml-6 aspect-square w-16 bg-white/5 relative overflow-hidden">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-contain mix-blend-lighten"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display =
                              "none")
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addImageRow}
              className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Image
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 border-t border-white/5 pt-8 max-w-5xl">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-3 bg-white text-black px-10 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {loading ? "Creating…" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
