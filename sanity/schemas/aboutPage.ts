import { defineField, defineType } from "sanity";

/**
 * About page copy and imagery. Brand storytelling only — no prices,
 * stock, or anything transactional.
 */
export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  fields: [
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "heroAlt", title: "Hero alt text", type: "string" }),
    defineField({ name: "kicker", title: "Kicker (e.g. BAGIFYYYY / ABOUT)", type: "string" }),
    defineField({ name: "quoteLine1", title: "Quote — line 1", type: "string" }),
    defineField({ name: "quoteLine2", title: "Quote — line 2", type: "string" }),
    defineField({ name: "tagline", title: "Tagline under the quote", type: "string" }),
    defineField({ name: "ideaTitle", title: "Manifesto title", type: "string" }),
    defineField({
      name: "ideaBody",
      title: "Manifesto paragraphs",
      type: "array",
      of: [{ type: "text", rows: 4 }],
    }),
    defineField({
      name: "pillars",
      title: "Stat pillars",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "value", title: "Value (e.g. 480GSM)", type: "string" }),
            defineField({ name: "label", title: "Label (e.g. Dense Cotton)", type: "string" }),
          ],
        },
      ],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "panels",
      title: "Direction panels",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "kicker", title: "Kicker", type: "string" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "body", title: "Body", type: "text", rows: 4 }),
          ],
        },
      ],
      validation: (rule) => rule.max(2),
    }),
    defineField({ name: "closingKicker", title: "Closing kicker", type: "string" }),
    defineField({ name: "closingTitle", title: "Closing title", type: "string" }),
  ],
  preview: {
    prepare() {
      return { title: "About page" };
    },
  },
});
