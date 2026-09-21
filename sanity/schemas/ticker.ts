import { defineField, defineType } from "sanity";

/**
 * Scrolling phrases under the hero ("FW26 small-run pieces", ...).
 * Content-only: purely presentational banner text.
 */
export default defineType({
  name: "ticker",
  title: "Hero Ticker Phrases",
  type: "document",
  fields: [
    defineField({
      name: "phrases",
      title: "Phrases (shown in rotation)",
      type: "array",
      of: [{ type: "string" }],
      validation: (rule) => rule.min(1).max(8),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Hero ticker phrases" };
    },
  },
});
