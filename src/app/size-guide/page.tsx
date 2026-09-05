"use client";

import { useState } from "react";
import EditorialPageShell from "@/components/layout/EditorialPageShell";

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<"tops" | "bottoms" | "footwear">("tops");
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const convert = (cm: number) => (unit === "cm" ? `${cm} cm` : `${(cm / 2.54).toFixed(1)} in`);

  const topsData = [
    { size: "S", chest: 104, length: 70, shoulder: 52 },
    { size: "M", chest: 110, length: 72, shoulder: 54 },
    { size: "L", chest: 116, length: 74, shoulder: 56 },
    { size: "XL", chest: 122, length: 76, shoulder: 58 },
  ];

  const bottomsData = [
    { size: "30", waist: 78, length: 104, thigh: 64 },
    { size: "32", waist: 83, length: 106, thigh: 66 },
    { size: "34", waist: 88, length: 108, thigh: 68 },
    { size: "36", waist: 93, length: 110, thigh: 70 },
  ];

  const footwearData = [
    { uk: "UK 7", eu: "EU 41", us: "US 8", cm: 26 },
    { uk: "UK 8", eu: "EU 42", us: "US 9", cm: 27 },
    { uk: "UK 9", eu: "EU 43", us: "US 10", cm: 28 },
    { uk: "UK 10", eu: "EU 44", us: "US 11", cm: 29 },
  ];

  return (
    <EditorialPageShell
       eyebrow="Fitting / Measurements"
      title="Size guide"
       description="Measure a piece you already own and compare it with the numbers below."
    >
      <div className="w-full">
        {/* Tab & Unit Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex rounded-lg border border-black/10 bg-white p-1 shadow-sm">
            {([
              { id: "tops", label: "SHIRTS & TEES" },
              { id: "bottoms", label: "PANTS & CARGOS" },
              { id: "footwear", label: "FOOTWEAR" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.16em] rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-black text-white"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-black/10 bg-white p-1 shadow-sm">
            <button
              onClick={() => setUnit("cm")}
              className={`px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] rounded-md transition-all cursor-pointer ${
                unit === "cm" ? "bg-black text-white" : "text-black/55 hover:text-black"
              }`}
            >
              CM
            </button>
            <button
              onClick={() => setUnit("in")}
              className={`px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] rounded-md transition-all cursor-pointer ${
                unit === "in" ? "bg-black text-white" : "text-black/55 hover:text-black"
              }`}
            >
              IN
            </button>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black text-white text-[9.5px] font-bold uppercase tracking-[0.18em]">
                  <th className="p-4">SIZE</th>
                  {activeTab === "tops" && (
                    <>
                      <th className="p-4">CHEST</th>
                      <th className="p-4">LENGTH</th>
                      <th className="p-4">SHOULDER</th>
                    </>
                  )}
                  {activeTab === "bottoms" && (
                    <>
                      <th className="p-4">WAIST</th>
                      <th className="p-4">LENGTH</th>
                      <th className="p-4">THIGH</th>
                    </>
                  )}
                  {activeTab === "footwear" && (
                    <>
                      <th className="p-4">EU</th>
                      <th className="p-4">US</th>
                      <th className="p-4">INSOLE (CM)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-mono text-xs">
                {activeTab === "tops" &&
                  topsData.map((row) => (
                    <tr key={row.size} className="hover:bg-black/[0.02] transition-colors">
                      <td className="p-4 font-bold font-sans text-black">{row.size}</td>
                      <td className="p-4 text-black/75">{convert(row.chest)}</td>
                      <td className="p-4 text-black/75">{convert(row.length)}</td>
                      <td className="p-4 text-black/75">{convert(row.shoulder)}</td>
                    </tr>
                  ))}

                {activeTab === "bottoms" &&
                  bottomsData.map((row) => (
                    <tr key={row.size} className="hover:bg-black/[0.02] transition-colors">
                      <td className="p-4 font-bold font-sans text-black">{row.size}</td>
                      <td className="p-4 text-black/75">{convert(row.waist)}</td>
                      <td className="p-4 text-black/75">{convert(row.length)}</td>
                      <td className="p-4 text-black/75">{convert(row.thigh)}</td>
                    </tr>
                  ))}

                {activeTab === "footwear" &&
                  footwearData.map((row) => (
                    <tr key={row.uk} className="hover:bg-black/[0.02] transition-colors">
                      <td className="p-4 font-bold font-sans text-black">{row.uk}</td>
                      <td className="p-4 text-black/75">{row.eu}</td>
                      <td className="p-4 text-black/75">{row.us}</td>
                      <td className="p-4 text-black/75">{row.cm} cm</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Measuring Guide Notes */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45 block mb-4">
            HOW TO MEASURE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-black/70">
            <div>
              <strong className="text-black block uppercase font-bold text-[11px] mb-1">Chest (Pit to Pit):</strong>
              Measure straight across chest from armpit to armpit, doubled.
            </div>
            <div>
              <strong className="text-black block uppercase font-bold text-[11px] mb-1">Length:</strong>
              Measure from highest shoulder point down to bottom hem.
            </div>
            <div>
              <strong className="text-black block uppercase font-bold text-[11px] mb-1">Waist:</strong>
              Measure horizontally across the waistband, doubled.
            </div>
            <div>
              <strong className="text-black block uppercase font-bold text-[11px] mb-1">Fit Note:</strong>
               Most pieces have a relaxed fit. Compare these measurements with a garment you already like before choosing a size.
            </div>
          </div>
        </div>
      </div>
    </EditorialPageShell>
  );
}
