"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Copy, Check, Smartphone, RefreshCw, Lock } from "lucide-react";

export default function Setup2FAPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    configured: boolean;
    secret: string;
    otpauthUri: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<"idle" | "testing" | "success" | "failure">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchSetup();
  }, []);

  const fetchSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/studio/2fa/setup");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setErrorMessage("Failed to load 2FA configuration. Please ensure you are logged in.");
      }
    } catch {
      setErrorMessage("Network error fetching 2FA details.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const testSync = async () => {
    if (!data?.secret || testCode.trim().length !== 6) return;
    setTestResult("testing");

    try {
      const res = await fetch("/api/studio/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: data.secret, code: testCode.trim() }),
      });
      const resData = await res.json();
      if (res.ok && resData.valid) {
        setTestResult("success");
      } else {
        setTestResult("failure");
      }
    } catch {
      setTestResult("failure");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">
              Access & Authentication
            </span>
            {data?.configured ? (
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active on Server
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Setup Needed
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-black">
            Two-Factor Authentication (2FA)
          </h1>
          <p className="text-xs text-black/60 mt-1 max-w-xl leading-relaxed">
            Configure Google Authenticator (or Apple Passwords / 1Password) to require a dynamic 6-digit cryptographic code when unlocking Studio operations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider self-start sm:self-auto shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>RFC 6238 TOTP</span>
        </div>
      </div>

      {loading ? (
        <div className="border border-black/10 bg-white p-12 text-center rounded-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-black/40 mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-black/60">
            Initializing Cryptographic Key...
          </p>
        </div>
      ) : errorMessage ? (
        <div className="border border-red-200 bg-red-50 p-6 text-center rounded-sm">
          <p className="text-xs text-red-600 font-bold uppercase tracking-wider">{errorMessage}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Steps 1 & 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Scan QR Code */}
            <div className="bg-white border border-black/15 p-6 flex flex-col items-center text-center shadow-xs rounded-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 block mb-4">
                Step 1: Scan with Authenticator App
              </span>

              <div className="p-4 bg-white border border-black/10 rounded-xl mb-4 shadow-sm">
                {data?.otpauthUri && (
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      data.otpauthUri
                    )}`}
                    alt="Google Authenticator QR Code"
                    width={220}
                    height={220}
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>

              <p className="text-xs text-black/70 leading-relaxed max-w-xs">
                Open <strong>Google Authenticator</strong> on your smartphone, tap the <strong>+</strong> button, and select <strong>Scan a QR code</strong>.
              </p>
            </div>

            {/* Step 2: Manual Key */}
            <div className="bg-white border border-black/15 p-6 flex flex-col justify-between shadow-xs rounded-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 block mb-4">
                  Step 2: Or Enter Key Manually
                </span>
                <p className="text-xs text-black/70 mb-5 leading-relaxed">
                  If you prefer typing or are configuring from the same device, select <strong>Enter a setup key</strong>:
                </p>

                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-black/50 block mb-1">
                      Account Name:
                    </span>
                    <p className="font-mono text-xs text-black bg-[#f5f5f2] border border-black/10 px-3 py-2 font-medium">
                      admin@bagifyyyy.com
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-black/50 block mb-1">
                      Setup Secret Key:
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-black bg-[#f5f5f2] border border-black/10 px-3 py-2 flex-1 tracking-wider break-all font-bold select-all">
                        {data?.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => data?.secret && copyToClipboard(data.secret)}
                        className="bg-black text-white p-2 hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-black/10 mt-6 flex items-center gap-2 text-xs text-black/60">
                <Smartphone className="w-4 h-4 text-black" />
                <span>Type: Time-based (TOTP, 30 seconds interval)</span>
              </div>
            </div>
          </div>

          {/* Step 3: Test Sync */}
          <div className="bg-white border border-black/15 p-6 sm:p-8 shadow-xs rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 block mb-2">
              Step 3: Verify Live Code Sync
            </span>
            <p className="text-xs text-black/70 mb-4">
              Enter the 6-digit number showing on your Google Authenticator app right now to verify it matches:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="bg-[#f5f5f2] border border-black/20 text-black px-4 py-2.5 font-mono text-lg tracking-[0.25em] text-center font-bold outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={testSync}
                disabled={testCode.length !== 6 || testResult === "testing"}
                className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black/85 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {testResult === "testing" ? "Testing…" : "Test Sync"}
              </button>
            </div>

            {testResult === "success" && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Success! Your Google Authenticator app is generating synchronized, valid codes.</span>
              </div>
            )}

            {testResult === "failure" && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-300 text-red-700 text-xs font-semibold uppercase tracking-wider rounded-sm">
                Code does not match. Please verify that the key is entered accurately and your phone time is set to automatic.
              </div>
            )}
          </div>

          {/* Step 4: Environment Variable */}
          <div className="bg-white border border-black/15 p-6 sm:p-8 shadow-xs rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 block mb-2 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-black" />
              <span>Step 4: Lock in Environment Variables</span>
            </span>
            <p className="text-xs text-black/70 mb-4 leading-relaxed">
              To enforce this 2FA requirement for every login on <strong>admin.bagifyyyy.in</strong>, add this variable to your <strong>Vercel Project Settings → Environment Variables</strong>:
            </p>

            <div className="bg-[#111] border border-black/20 p-4 font-mono text-xs text-emerald-400 flex items-center justify-between gap-4 rounded-sm">
              <span className="break-all font-semibold">ADMIN_TOTP_SECRET=&quot;{data?.secret}&quot;</span>
              <button
                type="button"
                onClick={() => data?.secret && copyToClipboard(`ADMIN_TOTP_SECRET="${data.secret}"`)}
                className="bg-white text-black p-2 hover:bg-white/90 transition-colors cursor-pointer shrink-0"
                title="Copy Variable"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-black/50 mt-3">
              Once saved in Vercel, the login page will require both your password and the Google Authenticator 6-digit code to access the Studio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
