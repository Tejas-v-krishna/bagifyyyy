"use client";

import type { ButtonHTMLAttributes } from "react";

/**
 * Single design-system button.
 *
 * Composes the existing `btn-bagify` treatments so visuals stay identical,
 * while enforcing the three things ad-hoc buttons kept missing:
 * 48px minimum touch target, visible keyboard focus, and disabled behavior.
 * Text size/tracking stay at the call site (10–12px across surfaces).
 *
 * Variants:
 * - primary: bordered light CTA (current `btn-bagify` look)
 * - dark:    solid black CTA (current `btn-bagify-dark` look)
 */
type ButtonVariant = "primary" | "dark";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn-bagify",
  dark: "btn-bagify btn-bagify-dark",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${VARIANT_CLASSES[variant]} inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
