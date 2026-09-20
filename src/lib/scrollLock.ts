/**
 * Ref-counted body scroll lock shared by every overlay (cart drawer, search,
 * auth modal, bug-report modal, ...). Each consumer acquires and releases
 * independently; the page scrolls again only once the LAST overlay closes,
 * and the pre-lock body overflow value is restored exactly. Without the
 * counter, two overlapping overlays stomp each other: closing one either
 * re-enables background scroll while the other is still open, or leaves the
 * page locked after everything closed.
 */
let lockCount = 0;
let savedOverflow: string | null = null;

export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('lenis-stopped');
    (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow ?? '';
    document.documentElement.classList.remove('lenis-stopped');
    (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
    savedOverflow = null;
  }
}
