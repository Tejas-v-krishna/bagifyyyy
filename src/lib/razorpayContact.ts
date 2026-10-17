/**
 * Razorpay Checkout's `prefill.contact` must be digits only, prefixed with the
 * country code: "+919876543210". Checkout uses it to pre-fill the customer's
 * number for the UPI intent/QR flows, so a malformed value degrades exactly
 * the flow shoppers rely on.
 *
 * The checkout form keeps bare 10-digit Indian numbers, but address-book
 * values saved earlier can still carry "+91", spaces or a leading zero, so
 * every number is normalised to the documented shape before it reaches
 * Checkout.
 */
export function toRazorpayContact(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.startsWith('91')) return `+${digits}`;
  // Anything else is assumed to already carry its country code.
  return `+${digits}`;
}
