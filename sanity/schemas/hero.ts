import { defineField, defineType } from "sanity";

/**
 * Homepage hero — media and CTA only. The "WEAR HISTORY" lockup is a crafted
 * SVG in code and stays there; Sanity owns the campaign image, alt text,
 * and the Shop-now button.
 */
export default defineType({
  name: "hero",
  title: "Homepage Hero",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Campaign image",
      type: "image",
      options: { hotspot: true },
      description: "Full-bleed hero. Served responsively from the Sanity CDN.",
    }),
    defineField({ name: "alt", title: "Alt text", type: "string" }),
    defineField({
      name: "ctaLabel",
      title: "CTA label",
      type: "string",
      initialValue: "Shop now",
    }),
    defineField({
      name: "ctaHref",
      title: "CTA link",
      type: "string",
      initialValue: "/new-arrivals",
      description: "Site path, e.g. /new-arrivals",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage hero" };
    },
  },
});
