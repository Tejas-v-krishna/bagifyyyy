"use client";

import { useState } from "react";
import Link from "next/link";
import { Ruler, ArrowRight, Check } from "lucide-react";

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
    <div className="bg-y2k-ice text-y2k-gunmetal min-h-screen py-8 sm:py-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-y2k-slate mb-6">
          <Link href="/" className="hover:text-black">HOME</Link>
          <span>/</span>
          <span className="text-y2k-gunmetal">SIZE MATRIX</span>
        </div>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-y2k-gunmetal/15">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate block mb-1">
            FITTING &amp; PROPORTIONS
          </span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            SIZE GUIDE
          </h1>
          <p className="text-xs text-y2k-gunmetal/70 mt-1">
            Exact garment dimensions for our signature oversized boxy streetwear silhouettes.
          </p>
        </div>

        {/* Tab & Unit Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex border border-y2k-gunmetal/20 bg-white p-0.5">
            {[
              { id: "tops", label: "SHIRTS & TEES" },
              { id: "bottoms", label: "PANTS & CARGOS" },
              { id: "footwear", label: "FOOTWEAR" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-y2k-gunmetal text-white"
                    : "text-y2k-gunmetal/70 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex border border-y2k-gunmetal/20 bg-white p-0.5">
            <button
              onClick={() => setUnit("cm")}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                unit === "cm" ? "bg-y2k-gunmetal text-white" : "text-y2k-gunmetal/60"
              }`}
            >
              CM
            </button>
            <button
              onClick={() => setUnit("in")}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                unit === "in" ? "bg-y2k-gunmetal text-white" : "text-y2k-gunmetal/60"
              }`}
            >
              IN
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-y2k-gunmetal/15 overflow-hidden mb-6 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-y2k-gunmetal text-white text-[9px] font-bold uppercase tracking-widest">
                <th className="p-3">SIZE</th>
                {activeTab === "tops" && (
                  <>
                    <th className="p-3">CHEST</th>
                    <th className="p-3">LENGTH</th>
                    <th className="p-3">SHOULDER</th>
                  </>
                )}
                {activeTab === "bottoms" && (
                  <>
                    <th className="p-3">WAIST</th>
                    <th className="p-3">LENGTH</th>
                    <th className="p-3">THIGH</th>
                  </>
                )}
                {activeTab === "footwear" && (
                  <>
                    <th className="p-3">EU</th>
                    <th className="p-3">US</th>
                    <th className="p-3">INSOLE (CM)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-y2k-gunmetal/10 font-mono text-[11px]">
              {activeTab === "tops" &&
                topsData.map((row) => (
                  <tr key={row.size} className="hover:bg-y2k-ice/30">
                    <td className="p-3 font-bold font-sans">{row.size}</td>
                    <td className="p-3">{convert(row.chest)}</td>
                    <td className="p-3">{convert(row.length)}</td>
                    <td className="p-3">{convert(row.shoulder)}</td>
                  </tr>
                ))}

              {activeTab === "bottoms" &&
                bottomsData.map((row) => (
                  <tr key={row.size} className="hover:bg-y2k-ice/30">
                    <td className="p-3 font-bold font-sans">{row.size}</td>
                    <td className="p-3">{convert(row.waist)}</td>
                    <td className="p-3">{convert(row.length)}</td>
                    <td className="p-3">{convert(row.thigh)}</td>
                  </tr>
                ))}

              {activeTab === "footwear" &&
                footwearData.map((row) => (
                  <tr key={row.uk} className="hover:bg-y2k-ice/30">
                    <td className="p-3 font-bold font-sans">{row.uk}</td>
                    <td className="p-3">{row.eu}</td>
                    <td className="p-3">{row.us}</td>
                    <td className="p-3">{row.cm} cm</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Guide Notes */}
        <div className="bg-white border border-y2k-gunmetal/15 p-4 text-xs space-y-2 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-widest text-y2k-slate block mb-1">
            HOW TO MEASURE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-y2k-gunmetal/80">
            <div>
              <strong className="text-y2k-gunmetal block uppercase font-bold">Chest (Pit to Pit):</strong>
              Measure straight across chest from armpit to armpit, doubled.
            </div>
            <div>
              <strong className="text-y2k-gunmetal block uppercase font-bold">Length:</strong>
              Measure from highest shoulder point down to bottom hem.
            </div>
            <div>
              <strong className="text-y2k-gunmetal block uppercase font-bold">Waist:</strong>
              Measure horizontally across the waistband, doubled.
            </div>
            <div>
              <strong className="text-y2k-gunmetal block uppercase font-bold">Fit Note:</strong>
              Silhouettes are cut with signature boxy drape. Order true to size.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
