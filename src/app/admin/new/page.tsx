import ProductForm from "./ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-y2k-gunmetal transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl uppercase tracking-tighter mb-2">New Product</h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Add a new drop to the archive</p>
      </div>

      <ProductForm />
    </div>
  );
}
