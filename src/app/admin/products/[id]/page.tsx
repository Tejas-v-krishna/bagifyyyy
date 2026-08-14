"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Loader2, CheckCircle } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    collectionTag: "",
    image: "",
    isNew: false,
    isSoldOut: false,
  });

  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setForm({
            name: data.name || "",
            description: data.description || "",
            price: data.price?.toString() || "",
            collectionTag: data.brand || "BAGIFYYYY AW24",
            image: data.images?.[0] || "",
            isNew: data.isNew || false,
            isSoldOut: data.isSoldOut || false,
          });
          setImagePreview(data.images?.[0] || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value =
      target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
    if (target.name === "image") {
      setImagePreview(target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        alert("Failed to save changes");
      }
    } catch {
      alert("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">
                ADMIN / EDIT PRODUCT
              </p>
              <h1 className="font-sans font-medium text-3xl tracking-tight text-black">
                {form.name || "Loading…"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={`/product/${id}`}
              target="_blank"
              className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              View Product →
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
            {/* Left: Form Fields */}
            <div className="flex flex-col gap-8">
              {/* Collection Tag */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Collection Tag
                </label>
                <p className="text-[9px] text-gray-400 -mt-1">
                  Shown at the top of the product page (e.g., "BAGIFYYYY AW24")
                </p>
                <input
                  name="collectionTag"
                  value={form.collectionTag}
                  onChange={handleChange}
                  className="border border-black px-4 py-3 text-sm font-medium tracking-wide outline-none focus:bg-gray-50 transition-colors"
                  placeholder="BAGIFYYYY AW24"
                />
              </div>

              {/* Product Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Product Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="border border-black px-4 py-3 text-sm font-medium tracking-wide outline-none focus:bg-gray-50 transition-colors"
                  placeholder="Y2K Cyber Hoodie"
                />
              </div>

              {/* Price */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Price (₹)
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="border border-black px-4 py-3 text-sm font-medium tracking-wide outline-none focus:bg-gray-50 transition-colors"
                  placeholder="15000"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Description
                </label>
                <p className="text-[9px] text-gray-400 -mt-1">
                  Include size info here since the size selector is removed from the product page.
                </p>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={(e) => handleChange(e)}
                  rows={6}
                  required
                  className="border border-black px-4 py-3 text-sm font-medium leading-relaxed outline-none focus:bg-gray-50 transition-colors resize-none"
                  placeholder="Oversized Y2K cyber hoodie in acid-washed black. Size L fits chest 40–44in. Made in India."
                />
              </div>

              {/* Image URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Image URL
                </label>
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  className="border border-black px-4 py-3 text-sm font-medium tracking-wide outline-none focus:bg-gray-50 transition-colors"
                  placeholder="https://..."
                />
              </div>

              {/* Flags */}
              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNew"
                    checked={form.isNew}
                    onChange={handleChange}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                    Mark as New Arrival
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSoldOut"
                    checked={form.isSoldOut}
                    onChange={handleChange}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                    Mark as Sold Out
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Image Preview */}
            <div className="flex flex-col gap-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Image Preview
              </p>
              <div className="aspect-[3/4] bg-gray-50 border border-gray-200 relative overflow-hidden">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={form.name}
                    fill
                    className="object-contain object-top mix-blend-multiply p-4"
                    onError={() => setImagePreview("")}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[8px] uppercase tracking-widest">
                    No Image
                  </div>
                )}
              </div>
              <p className="text-[8px] text-gray-400 leading-relaxed">
                Paste a URL in the Image URL field above to preview. The first product image will be replaced.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-12 flex items-center gap-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-12 py-4 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-3"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>

            {saved && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-600">
                Changes saved successfully
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
