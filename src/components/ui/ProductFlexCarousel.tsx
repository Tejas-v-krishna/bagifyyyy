'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import FlexCarousel, { type FlexCarouselItem } from '@/components/ui/FlexCarousel';
import { useSvgPageTransition } from '@/components/ui/SvgPathTransition';

export type ProductFlexItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const formatINR = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function ProductFlexCarousel({ products }: { products: ProductFlexItem[] }) {
  const transitionTo = useSvgPageTransition();
  const [activeIndex, setActiveIndex] = useState(0);

  const items: FlexCarouselItem[] = useMemo(
    () =>
      products.map((p) => ({
        src: p.image || '/placeholder.jpg',
        alt: p.name,
        title: p.name,
        subtitle: formatINR(p.price),
      })),
    [products]
  );

  if (!items.length) return null;

  const activeProduct = products[Math.min(activeIndex, products.length - 1)];

  return (
    <div className="w-full">
    <div style={{ width: '100%', height: '740px', position: 'relative', overflow: 'hidden' }}>
      <FlexCarousel
        items={items}
        preset="liquid"
        intro="rise"
        fit="portrait"
        cardHeight={0.7}
        gap={64}
        radius={0}
        lensWidth={0.84}
        lensHeight={0.2}
        tilt={-90}
        roundness={0.88}
        bend={0}
        reach={0.9}
        curl="rise"
        dispersion={0.45}
        liquid={0}
        followCursor={false}
        squeeze={0.21}
        focusOnClick
        autoplay
        interval={3}
        captions
        captureWheel={false}
        onChange={(index) => setActiveIndex(index)}
        onSelect={(index) => {
          const product = products[index];
          if (product) transitionTo(`/product/${product.id}`);
        }}
      />
    </div>
    {activeProduct && (
      <div className="flex justify-center pt-2 pb-1">
        <Link
          href={`/product/${activeProduct.id}`}
          prefetch
          onClick={(e) => {
            e.preventDefault();
            transitionTo(`/product/${activeProduct.id}`);
          }}
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] underline underline-offset-4 opacity-70 transition-all duration-150 hover:opacity-100 hover:gap-3 active:scale-95"
        >
          <span>View {activeProduct.name}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    )}
    </div>
  );
}
