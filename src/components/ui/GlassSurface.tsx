"use client";

import React, { useEffect, useState, useRef, useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import './GlassSurface.css';

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    if (!mounted) return;

    const updateDisplacementMap = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 400;
      const h = rect?.height || 200;
      const edge = Math.min(w, h) * (borderWidth * 0.5);
      const parts = [
        `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`,
        `<defs>`,
        `<linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">`,
        `<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>`,
        `</linearGradient>`,
        `<linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">`,
        `<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>`,
        `</linearGradient></defs>`,
        `<rect x="0" y="0" width="${w}" height="${h}" fill="black"/>`,
        `<rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})"/>`,
        `<rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${mixBlendMode}"/>`,
        `<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/>`,
        `</svg>`
      ];
      feImageRef.current?.setAttribute(
        'href',
        'data:image/svg+xml,' + encodeURIComponent(parts.join(''))
      );
    };

    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', String(distortionScale + offset));
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });
    gaussianBlurRef.current?.setAttribute('stdDeviation', String(displace));
    const timer = setTimeout(updateDisplacementMap, 0);
    const observer = new ResizeObserver(() => setTimeout(updateDisplacementMap, 0));
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [mounted, width, height, borderRadius, borderWidth, brightness, opacity, blur,
      displace, distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel,
      mixBlendMode, redGradId, blueGradId]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const div = document.createElement("div");
    div.style.backdropFilter = `url(#${filterId})`;
    queueMicrotask(() => {
      if (!cancelled) setSvgSupported(!isWebkit && !isFirefox && div.style.backdropFilter !== '');
    });
    return () => {
      cancelled = true;
    };
  }, [filterId, mounted]);

  const containerStyle: React.CSSProperties = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    // @ts-expect-error CSS custom properties
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`
  };

  // Portal SVG filter to document.body — required for backdrop-filter: url(#id)
  // to resolve correctly outside any composited/transformed ancestor element.
  const filterPortal = mounted ? createPortal(
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
          <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
          <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
          <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
          <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
        </filter>
      </defs>
    </svg>,
    document.body
  ) : null;

  return (
    <>
      {filterPortal}
      <div
        ref={containerRef}
        className={`glass-surface ${svgSupported ? "glass-surface--svg" : "glass-surface--fallback"} ${className}`}
        style={containerStyle}
      >
        <div className="glass-surface__content">{children}</div>
      </div>
    </>
  );
};

export default GlassSurface;
