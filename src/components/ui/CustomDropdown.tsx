"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  labelPrefix?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

export default function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  labelPrefix,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  align = "right",
  ariaLabel = "Select option",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  const handleSelect = (val: T) => {
    onChange(val);
    close();
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`group inline-flex items-center gap-2 py-1 px-2.5 rounded-lg text-[13px] font-medium tracking-tight text-black hover:bg-black/5 transition-all duration-150 cursor-pointer select-none ${
          isOpen ? "bg-black/5" : ""
        } ${buttonClassName}`}
      >
        <span className="truncate">
          {labelPrefix && <span className="text-black/50 font-normal mr-1">{labelPrefix}</span>}
          <span>{selectedOption?.shortLabel || selectedOption?.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-black/45 transition-transform duration-200 group-hover:text-black ${
            isOpen ? "rotate-180 text-black" : ""
          }`}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            aria-label={ariaLabel}
            className={`absolute top-full mt-1.5 z-50 min-w-[185px] w-max max-w-[280px] p-1.5 rounded-xl bg-white/95 backdrop-blur-xl border border-black/10 shadow-[0_16px_38px_rgba(0,0,0,0.12)] font-sans ${
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
            } ${menuClassName}`}
          >
            <div className="flex flex-col gap-0.5">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left text-[12.5px] transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-black text-white font-semibold shadow-xs"
                        : "text-black/75 hover:text-black hover:bg-black/[0.05] font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
