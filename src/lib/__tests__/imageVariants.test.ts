import { describe, it, expect } from "vitest";
import { isThumbUrl, thumbKeyFor, thumbUrlFor } from "@/lib/imageVariants";

const R2 = "https://pub-ed35bff2af374ece8b91c607c15b8a26.r2.dev";

describe("thumbnail URL derivation", () => {
  it("inserts the _thumb marker before the extension", () => {
    expect(thumbKeyFor("prod_123_abc_img_0084.webp")).toBe("prod_123_abc_img_0084_thumb.webp");
    expect(thumbKeyFor("migrated_1_x.jpeg")).toBe("migrated_1_x_thumb.webp");
    expect(thumbKeyFor("photo.PNG")).toBe("photo_thumb.webp");
  });

  it("appends a webp extension when the key has none", () => {
    expect(thumbKeyFor("no-extension")).toBe("no-extension_thumb.webp");
  });

  it("rewrites an R2 original to its thumbnail sibling", () => {
    expect(thumbUrlFor(`${R2}/prod_1_a.webp`)).toBe(`${R2}/prod_1_a_thumb.webp`);
  });

  it("leaves an existing thumbnail untouched", () => {
    const thumb = `${R2}/prod_1_a_thumb.webp`;
    expect(thumbUrlFor(thumb)).toBe(thumb);
    expect(isThumbUrl(thumb)).toBe(true);
  });

  it("preserves a query string", () => {
    expect(thumbUrlFor(`${R2}/prod_1_a.webp?v=2`)).toBe(`${R2}/prod_1_a_thumb.webp?v=2`);
  });

  it("rewrites relative dev uploads", () => {
    expect(thumbUrlFor("/uploads/prod_1_a.webp")).toBe("/uploads/prod_1_a_thumb.webp");
  });

  it("never rewrites third-party CDNs that have no thumbnail sibling", () => {
    const unsplash = "https://images.unsplash.com/photo-123.webp";
    const cloudinary = "https://res.cloudinary.com/demo/image/upload/a.webp";
    expect(thumbUrlFor(unsplash)).toBe(unsplash);
    expect(thumbUrlFor(cloudinary)).toBe(cloudinary);
  });

  it("leaves non-image and empty sources alone", () => {
    expect(thumbUrlFor("/placeholder.jpg")).toBe("/placeholder.jpg");
    expect(thumbUrlFor("/placeholder")).toBe("/placeholder");
    expect(thumbUrlFor("")).toBe("");
    expect(thumbUrlFor("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
});
