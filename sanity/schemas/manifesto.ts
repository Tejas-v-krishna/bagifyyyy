import { defineField, defineType } from "sanity";

/**
 * Homepage manifesto section — image and copy. Garment spec pins stay in
 * code (they are positioned against the artwork); Sanity owns the words
 * and the backdrop image.
 */
export default defineType({
  name: "manifesto",
  title: "Homepage Manifesto",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Editorial image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "alt", title: "Alt text", type: "string" }),
    defineField({ name: "headingLine1", title: "Heading — line 1", type: "string" }),
    defineField({ name: "headingLine2", title: "Heading — line 2", type: "string" }),
    defineField({ name: "intro", title: "Intro paragraph", type: "text", rows: 3 }),
    defineField({ name: "statementA", title: "Statement — line 1", type: "string" }),
    defineField({ name: "statementB", title: "Statement — line 2", type: "string" }),
    defineField({ name: "closingA", title: "Closing — line 1", type: "string" }),
    defineField({ name: "closingB", title: "Closing — line 2", type: "string" }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage manifesto" };
    },
  },
});
