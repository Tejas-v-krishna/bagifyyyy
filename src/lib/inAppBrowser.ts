/**
 * In-app browsers (Instagram, Facebook, WhatsApp, TikTok, …) are WebViews with
 * locked-down capabilities: UPI intent/app-switch hand-offs are silently
 * blocked and bank or wallet redirects are unreliable. Shoppers who reach
 * Checkout inside one of these browsers end up with failed UPI attempts in the
 * Razorpay dashboard ("payment_timed_out" at authentication, no Bank RRN), so
 * the store detects the environment and hands the shopper out to their real
 * browser before payment.
 */
const IN_APP_BROWSER_PATTERNS: RegExp[] = [
  /Instagram/i,
  /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook / Messenger
  /Barcelona/i, // Threads
  /TikTok|BytedanceWebview|musical_ly/i,
  /Snapchat/i,
  /Twitter/i, // X
  /LinkedInApp/i,
  /WhatsApp/i,
  /Line\//i,
  /MicroMessenger/i, // WeChat
  /; wv\)/i, // Generic Android WebView (any other app's built-in browser)
];

export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Best-effort href that asks the OS to open `url` outside the WebView:
 * - Android honours the `intent:` hand-off and resolves the user's default
 *   browser, with a plain-URL fallback when none is registered.
 * - iOS 17+ opens Safari with the `x-safari-https://` scheme.
 * Where no hand-off exists the plain URL is returned and the UI falls back to
 * the copy-the-link / overflow-menu guidance.
 */
export function externalBrowserHref(url: string, userAgent: string | null | undefined): string {
  const ua = userAgent ?? '';
  if (/Android/i.test(ua)) {
    const bare = url.replace(/^https?:\/\//i, '');
    return `intent://${bare}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(url)};end`;
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return url.replace(/^https?:\/\//i, 'x-safari-https://');
  }
  return url;
}
