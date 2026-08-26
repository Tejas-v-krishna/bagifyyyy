import Link from "next/link";

/**
 * Shown when /product/[id] has no matching row. This is the same screen the
 * page used to render inline from client state — but now it arrives with a real
 * 404 status, so crawlers drop the URL instead of indexing an empty product.
 */
export default function ProductNotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-y2k-ice font-sans px-4 text-center">
      <div className="w-px h-16 bg-y2k-gunmetal/15 mb-12" />
      <h1 className="font-display text-4xl uppercase tracking-[-0.04em] mb-3 text-y2k-gunmetal">
        PRODUCT NOT FOUND
      </h1>
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-y2k-gunmetal/50 mb-10">
        This product is currently unavailable.
      </p>
      <Link
        href="/products"
        className="btn-bagify px-10 py-4 text-[10px] uppercase tracking-[0.18em]"
      >
        Browse All Products
      </Link>
    </div>
  );
}
