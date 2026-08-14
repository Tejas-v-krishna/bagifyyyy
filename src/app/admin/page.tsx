import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";

export default async function AdminDashboard() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: true }
  });

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="font-display text-4xl uppercase tracking-tighter">Admin Dashboard</h1>
        <Link 
          href="/admin/new" 
          className="btn-bagify px-6 py-2 rounded-none inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-y2k-pale border-b border-border uppercase tracking-widest text-[10px] text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-bold">Product</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Price</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-y2k-ice/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-y2k-soft relative overflow-hidden rounded-sm">
                      {product.images[0] && (
                        <img src={product.images[0].url} alt={product.name} className="object-cover w-full h-full mix-blend-multiply" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold uppercase tracking-wide">{product.name}</div>
                      <div className="text-xs text-muted-foreground tracking-widest">0-{product.id.substring(0,3)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 uppercase tracking-widest text-xs">{product.category}</td>
                <td className="px-6 py-4 font-medium">₹{product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  {product.isNew && (
                    <span className="bg-y2k-gunmetal text-y2k-ice text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">New</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-muted-foreground hover:text-y2k-gunmetal transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground uppercase tracking-widest font-bold">
                  No products found. Add your first product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
