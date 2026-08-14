"use client";

import { useState } from "react";
import Link from "next/link";

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState("tops");
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const convert = (cm: number) => unit === "cm" ? cm : (cm / 2.54).toFixed(1);

  const tabs = [
    { id: "tops", label: "TOPS" },
    { id: "bottoms", label: "BOTTOMS" },
    { id: "footwear", label: "FOOTWEAR" },
  ];

  const topsData = [
    { size: "XS", chest: 86, waist: 71, length: 66, shoulder: 40 },
    { size: "S", chest: 91, waist: 76, length: 68, shoulder: 42 },
    { size: "M", chest: 96, waist: 81, length: 70, shoulder: 44 },
    { size: "L", chest: 101, waist: 86, length: 72, shoulder: 46 },
    { size: "XL", chest: 106, waist: 91, length: 74, shoulder: 48 },
    { size: "XXL", chest: 111, waist: 96, length: 76, shoulder: 50 },
  ];

  const bottomsData = [
    { size: "XS", waist: 71, hip: 86, inseam: 76, rise: 25 },
    { size: "S", waist: 76, hip: 91, inseam: 78, rise: 26 },
    { size: "M", waist: 81, hip: 96, inseam: 80, rise: 27 },
    { size: "L", waist: 86, hip: 101, inseam: 82, rise: 28 },
    { size: "XL", waist: 91, hip: 106, inseam: 84, rise: 29 },
    { size: "XXL", waist: 96, hip: 111, inseam: 86, rise: 30 },
  ];

  const footwearData = [
    { uk: 6, eu: 40, us: 7, cm: 25 },
    { uk: 7, eu: 41, us: 8, cm: 26 },
    { uk: 8, eu: 42, us: 9, cm: 27 },
    { uk: 9, eu: 43, us: 10, cm: 28 },
    { uk: 10, eu: 44, us: 11, cm: 29 },
    { uk: 11, eu: 45, us: 12, cm: 30 },
    { uk: 12, eu: 46, us: 13, cm: 31 },
    { uk: 13, eu: 47, us: 14, cm: 32 },
  ];

  return (
    <div className="bg-y2k-ice min-h-screen pt-24 pb-24 text-y2k-gunmetal">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tighter mb-12 text-center">
          SIZE GUIDE
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-y2k-gunmetal/20 pb-4">
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? "underline underline-offset-8" : "opacity-50 hover:opacity-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex bg-white border border-y2k-gunmetal">
            <button 
              onClick={() => setUnit("cm")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${unit === "cm" ? "bg-y2k-gunmetal text-[#F8F5E9]" : "text-y2k-gunmetal"}`}
            >
              CM
            </button>
            <button 
              onClick={() => setUnit("in")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${unit === "in" ? "bg-y2k-gunmetal text-[#F8F5E9]" : "text-y2k-gunmetal"}`}
            >
              IN
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white border border-y2k-gunmetal/20 mb-12 shadow-sm">
          <table className="w-full text-center border-collapse text-sm">
            <thead className="bg-[#232D3B] text-[#F8F5E9] font-bold uppercase tracking-widest text-xs">
              {activeTab === "tops" && (
                <tr>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Size</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Chest</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Waist</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Length</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Shoulder</th>
                </tr>
              )}
              {activeTab === "bottoms" && (
                <tr>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Size</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Waist</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Hip</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Inseam</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">Rise</th>
                </tr>
              )}
              {activeTab === "footwear" && (
                <tr>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">UK</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">EU</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">US</th>
                  <th className="py-4 px-4 border border-y2k-gunmetal/20">CM</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === "tops" && topsData.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-y2k-ice"}>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20 font-bold">{row.size}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.chest)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.waist)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.length)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.shoulder)}</td>
                </tr>
              ))}
              {activeTab === "bottoms" && bottomsData.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-y2k-ice"}>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20 font-bold">{row.size}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.waist)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.hip)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.inseam)}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.rise)}</td>
                </tr>
              ))}
              {activeTab === "footwear" && footwearData.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-y2k-ice"}>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20 font-bold">{row.uk}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{row.eu}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{row.us}</td>
                  <td className="py-4 px-4 border border-y2k-gunmetal/20">{convert(row.cm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-y2k-gunmetal/20 p-8 mb-12">
          <h2 className="font-bold uppercase tracking-widest mb-6">How To Measure</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-bold uppercase inline">Chest:</dt>
              <dd className="inline ml-2 opacity-80">Measure under your arms, around the fullest part of your chest.</dd>
            </div>
            <div>
              <dt className="font-bold uppercase inline">Waist:</dt>
              <dd className="inline ml-2 opacity-80">Measure around your natural waistline, keeping the tape a bit loose.</dd>
            </div>
            <div>
              <dt className="font-bold uppercase inline">Hip:</dt>
              <dd className="inline ml-2 opacity-80">Measure around the fullest part of your body at the top of your leg.</dd>
            </div>
            <div>
              <dt className="font-bold uppercase inline">Inseam:</dt>
              <dd className="inline ml-2 opacity-80">Measure from the top of your inner leg along the inside seam to the bottom of your leg.</dd>
            </div>
          </dl>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium mb-4">Still unsure? Chat with us</p>
          <Link 
            href="/contact"
            className="inline-block bg-[#232D3B] text-[#F8F5E9] px-8 py-3 rounded-none font-bold uppercase tracking-widest text-sm hover:opacity-90"
          >
            CONTACT SUPPORT
          </Link>
        </div>
      </div>
    </div>
  );
}
