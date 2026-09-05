"use client";

import { useEffect } from "react";

export default function InteractionGuard() {
  useEffect(() => {
    const preventDrag = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("img, video, svg, canvas")) {
        event.preventDefault();
      }
    };
    document.addEventListener("dragstart", preventDrag, true);

    return () => {
      document.removeEventListener("dragstart", preventDrag, true);
    };
  }, []);

  return null;
}
