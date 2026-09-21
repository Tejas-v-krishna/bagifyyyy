import { defineField, defineType } from "sanity";

/**
 * FAQ page copy. Categories with questions and answers — support text only.
 */
export default defineType({
  name: "faqPage",
  title: "FAQ Page",
  type: "document",
  fields: [
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "category", title: "Category name", type: "string" }),
            defineField({
              name: "items",
              title: "Questions",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "question", title: "Question", type: "string" }),
                    defineField({ name: "answer", title: "Answer", type: "text", rows: 4 }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "FAQ page" };
    },
  },
});
