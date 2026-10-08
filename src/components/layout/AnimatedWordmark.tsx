import { useState } from 'react';

interface AnimatedWordmarkProps {
  /** Sizing for the wrapper (e.g. "w-[120px] lg:w-[160px]"). */
  className?: string;
  /** Extra classes for the base logo image (e.g. dark-mode invert filter). */
  staticClassName?: string;
}

/**
 * Animated chrome wordmark — the same footer loop, keyed through the logo
 * silhouette via mask so its opaque black background never paints as a
 * box, on light and dark headers alike. The static webp underneath paints
 * instantly and stays as the fallback until the loop is playing.
 */
export default function AnimatedWordmark({ className = '', staticClassName = '' }: AnimatedWordmarkProps) {
  const [playing, setPlaying] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  return (
    <span className={`relative inline-block align-middle ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bagifyyyy-wordmark.webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={166}
        draggable={false}
        className={`block h-auto w-full object-contain ${staticClassName}`}
      />
      {!reducedMotion && (
        <video
          className={`wordmark-video-mask absolute inset-0 block h-full w-full object-contain transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
          src="/header-wordmark.mp4"
          aria-hidden="true"
          tabIndex={-1}
          loop
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
        />
      )}
    </span>
  );
}
