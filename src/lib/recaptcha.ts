"use client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let scriptLoaded = false;

function loadScript(siteKey: string): Promise<void> {
  if (scriptLoaded || typeof window === "undefined") return Promise.resolve();
  if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => { scriptLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return undefined;
  try {
    await loadScript(siteKey);
    if (!window.grecaptcha) return undefined;
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch (e) { reject(e); }
      });
    });
  } catch { return undefined; }
}
