import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-lg animate-fade-in-up">
      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <XCircle className="w-10 h-10 text-white" />
      </div>
      <h1 className="font-display text-4xl uppercase tracking-tighter mb-4">Checkout Cancelled</h1>
      <p className="text-muted-foreground mb-8">
        Your payment was cancelled. Your cart items have been saved.
      </p>
      <Link 
        href="/checkout" 
        className="inline-block bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-foreground transition-colors"
      >
        Return to Checkout
      </Link>
    </div>
  );
}
