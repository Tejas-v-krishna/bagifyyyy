"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { thumbUrlFor } from "@/lib/imageVariants";

type ThumbImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/**
 * `<Image>` that requests the small `_thumb.webp` card variant and silently
 * falls back to the full-size original if that variant is missing.
 *
 * The fallback matters because thumbnails are generated out-of-band: images
 * uploaded before the variant pipeline existed, or formats sharp cannot decode,
 * may not have a `_thumb.webp` sibling yet. A missing variant should cost one
 * 404, never a broken product card.
 *
 * Use this only for grid / card contexts. The product detail hero should keep
 * plain `<Image>` so it gets the full-resolution file.
 */
export default function ThumbImage({ src, ...rest }: ThumbImageProps) {
  // Tracked per-src so hover image rotation (which swaps `src` repeatedly)
  // does not carry a stale failure across to the next photo.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = failedSrc === src ? src : thumbUrlFor(src);

  return (
    <Image
      {...rest}
      src={resolved}
      onError={() => {
        if (failedSrc !== src) setFailedSrc(src);
      }}
    />
  );
}
