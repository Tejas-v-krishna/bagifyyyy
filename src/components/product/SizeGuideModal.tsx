"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = "topwears",
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const isBottom =
    category.toLowerCase().includes("bottom") ||
    category.toLowerCase().includes("pant") ||
    category.toLowerCase().includes("cargo");

  const topSizes = [
    { size: "S", chest: { cm: 104, in: 41 }, length: { cm: 70, in: 27.5 }, shoulder: { cm: 52, in: 20.5 } },
    { size: "M", chest: { cm: 110, in: 43.3 }, length: { cm: 72, in: 28.3 }, shoulder: { cm: 54, in: 21.2 } },
    { size: "L", chest: { cm: 116, in: 45.6 }, length: { cm: 74, in: 29.1 }, shoulder: { cm: 56, in: 22.0 } },
    { size: "XL", chest: { cm: 122, in: 48.0 }, length: { cm: 76, in: 30.0 }, shoulder: { cm: 58, in: 22.8 } },
  ];

  const bottomSizes = [
    { size: "30", waist: { cm: 78, in: 30.7 }, length: { cm: 104, in: 41 }, thigh: { cm: 64, in: 25.2 } },
    { size: "32", waist: { cm: 83, in: 32.7 }, length: { cm: 106, in: 41.7 }, thigh: { cm: 66, in: 26.0 } },
    { size: "34", waist: { cm: 88, in: 34.6 }, length: { cm: 108, in: 42.5 }, thigh: { cm: 68, in: 26.8 } },
    { size: "36", waist: { cm: 93, in: 36.6 }, length: { cm: 110, in: 43.3 }, thigh: { cm: 70, in: 27.5 } },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="editorial-panel relative z-10 w-full max-w-md bg-white border border-y2k-gunmetal/10 p-6 text-y2k-gunmetal font-sans"
          >
            <div className="flex items-center justify-between border-b border-y2k-gunmetal/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-y2k-gunmetal" />
                <span className="font-display text-lg uppercase tracking-tight font-medium">
                   SIZE GUIDE
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-y2k-gunmetal/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center justify-between mb-4 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-y2k-slate">
                 {isBottom ? "Pants fit" : "Top fit"}
              </span>
              <div className="flex items-center border border-y2k-gunmetal/10 bg-y2k-ice p-0.5">
                <button
                  onClick={() => setUnit("cm")}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                    unit === "cm" ? "bg-y2k-gunmetal text-white" : "text-y2k-gunmetal/60"
                  }`}
                >
                  CM
                </button>
                <button
                  onClick={() => setUnit("in")}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                    unit === "in" ? "bg-y2k-gunmetal text-white" : "text-y2k-gunmetal/60"
                  }`}
                >
                  IN
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-y2k-gunmetal/15 overflow-hidden mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-y2k-gunmetal text-white text-[9px] font-bold uppercase tracking-wider">
                    <th className="p-2.5">SIZE</th>
                    {isBottom ? (
                      <>
                        <th className="p-2.5">WAIST</th>
                        <th className="p-2.5">LENGTH</th>
                        <th className="p-2.5">THIGH</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2.5">CHEST</th>
                        <th className="p-2.5">LENGTH</th>
                        <th className="p-2.5">SHOULDER</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-y2k-gunmetal/10">
                  {isBottom
                    ? bottomSizes.map((row) => (
                        <tr key={row.size} className="hover:bg-y2k-ice/40 font-mono text-[11px]">
                          <td className="p-2.5 font-bold font-sans">{row.size}</td>
                          <td className="p-2.5">{row.waist[unit]} {unit}</td>
                          <td className="p-2.5">{row.length[unit]} {unit}</td>
                          <td className="p-2.5">{row.thigh[unit]} {unit}</td>
                        </tr>
                      ))
                    : topSizes.map((row) => (
                        <tr key={row.size} className="hover:bg-y2k-ice/40 font-mono text-[11px]">
                          <td className="p-2.5 font-bold font-sans">{row.size}</td>
                          <td className="p-2.5">{row.chest[unit]} {unit}</td>
                          <td className="p-2.5">{row.length[unit]} {unit}</td>
                          <td className="p-2.5">{row.shoulder[unit]} {unit}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-y2k-gunmetal/60 leading-relaxed">
               * Measurements are taken by hand. Choose your usual size for a relaxed fit, then compare the numbers with a piece you already own.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
