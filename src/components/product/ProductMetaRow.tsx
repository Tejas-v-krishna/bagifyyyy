type ProductMetaRowProps = {
  name: string;
  price?: number;
  className?: string;
  tone?: "light" | "dark";
};

export default function ProductMetaRow({ name, price, className = "", tone = "light" }: ProductMetaRowProps) {
  const textColor = tone === "dark" ? "text-white" : "text-black";

  return (
    <div className={`flex w-full items-baseline justify-between gap-4 pt-3 ${className}`}>
      <h3 className={`min-w-0 flex-1 truncate text-[10px] font-medium leading-none tracking-[-0.025em] sm:text-[11px] lg:text-xs ${textColor}`} title={name}>
        {name}
      </h3>
      {typeof price === "number" && (
        <span className={`shrink-0 text-[10px] font-medium leading-none tracking-[-0.025em] sm:text-[11px] lg:text-xs ${textColor}`}>
          ₹{price.toLocaleString("en-IN")}
        </span>
      )}
    </div>
  );
}
