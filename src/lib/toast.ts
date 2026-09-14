/**
 * Minimal DOM toast in the site's editorial styling. Used for stock signals
 * (e.g. "someone else just claimed this piece") from non-React code paths.
 */
export function showToast(message: string) {
  if (typeof document === 'undefined' || !message) return;

  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:24px',
    'transform:translateX(-50%)',
    'z-index:10001',
    'background:#050505',
    'color:#fff',
    'padding:14px 22px',
    'font-size:11px',
    'font-weight:700',
    'letter-spacing:0.14em',
    'text-transform:uppercase',
    'line-height:1.5',
    'box-shadow:0 12px 40px rgba(0,0,0,0.35)',
    'opacity:0',
    'transition:opacity 0.3s ease',
    'pointer-events:none',
    'max-width:calc(100vw - 32px)',
    'text-align:center',
  ].join(';');

  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });
  window.setTimeout(() => {
    el.style.opacity = '0';
    window.setTimeout(() => el.remove(), 350);
  }, 3400);
}
