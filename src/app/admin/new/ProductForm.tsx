"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category"),
      description: formData.get("description"),
      isNew: formData.get("isNew") === "on",
      image: formData.get("image"),
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        alert("Failed to create product");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
        <input name="name" required className="border border-border p-3 bg-transparent font-medium" placeholder="BAGIFYYYY 'NEW DROP'" />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (₹)</label>
        <input name="price" type="number" step="0.01" required className="border border-border p-3 bg-transparent font-medium" placeholder="15000" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
        <select name="category" className="border border-border p-3 bg-transparent font-medium uppercase text-xs tracking-wider">
          <option value="accessories">Accessories</option>
          <option value="topwear">Topwear</option>
          <option value="bottomwear">Bottomwear</option>
          <option value="footwear">Footwear</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Image URL</label>
        <input name="image" required className="border border-border p-3 bg-transparent font-medium" placeholder="https://images.unsplash.com/..." />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <textarea name="description" required rows={4} className="border border-border p-3 bg-transparent font-medium" placeholder="Signature piece..." />
      </div>
      
      <div className="flex items-center gap-3">
        <input type="checkbox" name="isNew" id="isNew" className="w-4 h-4" />
        <label htmlFor="isNew" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mark as New Arrival</label>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="btn-bagify py-4 rounded-none uppercase font-bold tracking-wider disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
