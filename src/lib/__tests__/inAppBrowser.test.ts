import { describe, expect, it } from 'vitest';
import { externalBrowserHref, isInAppBrowser } from '../inAppBrowser';

describe('isInAppBrowser', () => {
  it('flags the social/webview browsers that block UPI hand-offs', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.32.111'
      )
    ).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 [FBAN/FBIOS;FBAV/430.0;FBBV/500000]')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 WhatsApp/2.24.1')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36')).toBe(true);
  });

  it('does not flag real mobile or desktop browsers', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
      )
    ).toBe(false);
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      )
    ).toBe(false);
    expect(isInAppBrowser('')).toBe(false);
    expect(isInAppBrowser(undefined)).toBe(false);
  });
});

describe('externalBrowserHref', () => {
  it('builds the Android intent hand-off without pinning a browser package', () => {
    const href = externalBrowserHref(
      'https://shop.example.com/checkout?promo=Y2K10',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36'
    );
    expect(href.startsWith('intent://shop.example.com/checkout?promo=Y2K10#Intent;')).toBe(true);
    expect(href).toContain('scheme=https');
    expect(href).toContain('S.browser_fallback_url=https%3A%2F%2Fshop.example.com%2Fcheckout%3Fpromo%3DY2K10');
    expect(href.endsWith(';end')).toBe(true);
  });

  it('uses the x-safari-https escape on iOS', () => {
    expect(externalBrowserHref('https://shop.example.com/checkout', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Safari')).toBe(
      'x-safari-https://shop.example.com/checkout'
    );
  });

  it('falls back to the plain URL elsewhere', () => {
    expect(externalBrowserHref('https://shop.example.com/checkout', 'Mozilla/5.0 (Windows NT 10.0) Chrome/126.0.0.0')).toBe(
      'https://shop.example.com/checkout'
    );
  });
});
