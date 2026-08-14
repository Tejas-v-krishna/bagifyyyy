"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, User, CheckCircle2, Package, Truck, Clock } from "lucide-react";
import Image from "next/image";

export default function AccountPage() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (activeTab === "loyalty" && user?.email) {
      fetch(`/api/loyalty?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => setLoyaltyData(data))
        .catch(console.error);
    }

    if (activeTab === "orders" && isAuthenticated) {
      setLoadingOrders(true);
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch(console.error)
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab, user?.email, isAuthenticated]);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "loyalty", label: "Chrome Points" },
    { id: "addresses", label: "Addresses" },
    { id: "wishlist", label: "Wishlist" },
    { id: "payment", label: "Payment Methods" },
    { id: "profile", label: "Profile & Security" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="bg-y2k-ice min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center text-y2k-gunmetal">
        <div className="w-16 h-16 rounded-full bg-white border border-y2k-gunmetal/20 flex items-center justify-center mb-6 shadow-sm">
          <User className="w-8 h-8 text-y2k-gunmetal/60" />
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tighter mb-4">
          ACCOUNT ACCESS REQUIRED
        </h1>
        <p className="text-sm text-y2k-gunmetal/70 max-w-md mb-8">
          Sign in with Google or your Bagify account to view your orders, Chrome points, and saved addresses.
        </p>
        <button
          onClick={openAuthModal}
          className="btn-bagify px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
        >
          SIGN IN / REGISTER →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-y2k-ice min-h-screen pt-20 pb-24 text-y2k-gunmetal">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* User Greeting Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-y2k-gunmetal/15 pb-8">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User Avatar"}
                className="w-16 h-16 rounded-full object-cover border-2 border-y2k-gunmetal/20 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-y2k-gunmetal text-white flex items-center justify-center text-xl font-bold">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight">
                  {user?.name || "BAGIFYYYY MEMBER"}
                </h1>
                {user?.googleId && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full shadow-xs">
                    <CheckCircle2 className="w-3 h-3" /> Google Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-y2k-gunmetal/70 font-medium">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 hover:underline underline-offset-4 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Sidebar (Nav) */}
          <div className="w-full md:w-1/4 flex flex-col gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left text-xs uppercase tracking-widest py-2 px-3 transition-all ${
                  activeTab === tab.id
                    ? "font-bold bg-white border-l-2 border-y2k-gunmetal shadow-xs"
                    : "font-medium hover:bg-white/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content (Tab Panels) */}
          <div className="w-full md:w-3/4">
            {activeTab === "orders" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Order History</h2>
                
                {loadingOrders ? (
                  <div className="bg-white border border-y2k-gunmetal/20 p-12 text-center text-xs font-bold uppercase tracking-widest">
                    Loading orders…
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white border border-y2k-gunmetal/20 p-12 text-center">
                    <p className="mb-6 font-medium text-sm text-y2k-gunmetal/80">No orders placed yet.</p>
                    <Link 
                      href="/products"
                      className="inline-block bg-[#232D3B] text-[#F8F5E9] px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs hover:opacity-90"
                    >
                      EXPLORE DROPS →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {orders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-y2k-gunmetal/20 p-6 flex flex-col gap-4 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-y2k-gunmetal/10 pb-3">
                          <div>
                            <p className="font-bold text-xs uppercase tracking-wider">Order #{ord.orderNumber}</p>
                            <p className="text-[11px] text-y2k-gunmetal/60 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-xs border ${ord.paymentStatus === 'PAID' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                              {ord.paymentStatus === 'PAID' ? 'PAID' : 'COD PENDING'}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-xs bg-y2k-ice border border-y2k-gunmetal/20">
                              {ord.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-3">
                          {ord.items?.map((it: any) => (
                            <div key={it.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-12 bg-gray-100 shrink-0">
                                  <Image src={it.image || '/placeholder.jpg'} alt={it.name} fill className="object-cover" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold uppercase">{it.name}</h4>
                                  <p className="text-[10px] text-y2k-gunmetal/60 uppercase">Qty: {it.quantity} | Size: {it.size} | {it.color}</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold">₹{(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer Info */}
                        <div className="border-t border-y2k-gunmetal/10 pt-3 flex flex-wrap items-center justify-between text-xs gap-2">
                          <p className="text-y2k-gunmetal/70 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-600" /> Delivery: <b>{ord.shippingAddress?.city || 'India'} ({ord.shippingAddress?.pincode || ''})</b>
                          </p>
                          <p className="font-bold text-sm">Total: ₹{ord.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "loyalty" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Loyalty Rewards</h2>
                <div className="bg-[#232D3B] text-[#F8F5E9] p-8 md:p-12 mb-8">
                  <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tighter mb-8">BAGIFYYYY CHROME POINTS</h3>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Current Balance</p>
                      <p className="font-display text-6xl md:text-7xl">{loyaltyData?.points || 0} pts</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Current Tier</p>
                      <p className="text-xl md:text-2xl font-bold">{loyaltyData?.tier || 'CHROME'}</p>
                    </div>
                  </div>

                  <div className="mb-10">
                    <div className="w-full bg-black/20 h-2 mb-2 relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-[#F8F5E9]" 
                        style={{ width: `${Math.min(100, ((loyaltyData?.points || 0) / 500) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                      {(loyaltyData?.points || 0) < 500 
                        ? `${500 - (loyaltyData?.points || 0)} pts to STEEL tier` 
                        : 'Top Tier Status'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Current Perks</p>
                    <ul className="list-disc list-inside text-sm space-y-2">
                      <li>Early access to new drop announcements</li>
                      <li>Double points on exclusive drops</li>
                      <li>Free express delivery eligibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Saved Addresses</h2>
                <div className="bg-white border border-y2k-gunmetal/20 p-12 text-center flex flex-col items-center">
                  <p className="mb-6 font-medium text-sm text-y2k-gunmetal/80">Addresses are automatically saved when placing orders.</p>
                  <Link 
                    href="/checkout"
                    className="bg-[#232D3B] text-[#F8F5E9] px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs hover:opacity-90"
                  >
                    Go to Checkout
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Your Wishlist</h2>
                <div className="bg-white border border-y2k-gunmetal/20 p-12 text-center">
                  <Link 
                    href="/wishlist"
                    className="inline-block bg-[#232D3B] text-[#F8F5E9] px-8 py-3 rounded-none font-bold uppercase tracking-widest text-xs hover:opacity-90"
                  >
                    VIEW SAVED ITEMS →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Payment Methods</h2>
                <div className="bg-white border border-y2k-gunmetal/20 p-12 text-center">
                  <p className="font-medium text-sm text-y2k-gunmetal/80">Payments are processed securely via Razorpay (UPI, Cards & NetBanking).</p>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <h2 className="font-bold uppercase tracking-widest mb-6">Profile & Account Info</h2>
                <div className="bg-white border border-y2k-gunmetal/20 p-8 flex flex-col gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-y2k-gunmetal/70">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name || ""} 
                      readOnly 
                      className="w-full border border-y2k-gunmetal/20 bg-gray-50 px-4 py-3 text-sm outline-none text-y2k-gunmetal" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-y2k-gunmetal/70">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ""} 
                      readOnly 
                      className="w-full border border-y2k-gunmetal/20 bg-gray-50 px-4 py-3 text-sm outline-none text-y2k-gunmetal" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-y2k-gunmetal/70">Account Type</label>
                    <div className="border border-y2k-gunmetal/20 bg-gray-50 px-4 py-3 text-sm text-y2k-gunmetal flex items-center justify-between">
                      <span>{user?.googleId ? "Google Account (OAuth 2.0)" : "Email & Password"}</span>
                      {user?.googleId && (
                        <span className="text-xs text-green-600 font-bold uppercase">✦ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
