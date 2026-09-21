import FaqClient, { FAQ_FALLBACK } from "./FaqClient";
import { getFaqContent } from "@/lib/sanity";

// FAQ copy comes from Sanity when configured; the hardcoded fallback keeps
// the page identical when it isn't.
export default async function FAQPage() {
  const content = await getFaqContent();
  const categories =
    content?.categories && content.categories.length > 0
      ? content.categories
      : FAQ_FALLBACK;
  return <FaqClient data={categories} />;
}
