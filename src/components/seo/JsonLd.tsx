/**
 * Renders a JSON-LD document into the page.
 *
 * Product names and descriptions are operator-supplied, so the payload is
 * escaped before it goes into the script tag: a `</script>` inside a product
 * description would otherwise close the tag early and let the rest of the
 * string run as markup. Escaping `<` is what the Next.js JSON-LD guide
 * recommends for exactly this reason.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
