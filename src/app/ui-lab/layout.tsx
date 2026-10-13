import type { Metadata } from "next";

/**
 * Internal demo surface for the interaction kit. Kept out of search indexes —
 * it documents the pointer primitives but is not a shopping route.
 */
export const metadata: Metadata = {
  title: "Interaction Kit",
  robots: { index: false, follow: false },
};

export default function UiLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
