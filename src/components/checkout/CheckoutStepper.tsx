type Props = {
  /** 1-based checkpoint the shopper is on (3 = confirmation screen). */
  current: 1 | 2 | 3;
  steps?: string[];
  className?: string;
};

const DEFAULT_STEPS = ['Address', 'Payment', 'Confirmation'];

/**
 * Minimal checkpoint rail: filled dot = done/current, hollow = upcoming.
 * The connector left of a step turns black once that step is reached.
 * Pure presentational — safe on the checkout and confirmation screens.
 */
export default function CheckoutStepper({ current, steps, className }: Props) {
  const labels = steps ?? DEFAULT_STEPS;

  return (
    <div className={className} aria-label="Checkout progress">
      <div className="flex">
        {labels.map((label, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <div
              key={label}
              className="relative flex flex-1 flex-col items-center"
              aria-current={active ? 'step' : undefined}
            >
              {/* Connectors run centre-to-centre, so the rail reads evenly at any width. */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-[5px] h-px w-full ${step <= current ? 'bg-black' : 'bg-black/15'}`}
                />
              )}
              {i < labels.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[5px] h-px w-full ${step < current ? 'bg-black' : 'bg-black/15'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-[11px] w-[11px] items-center justify-center rounded-full border transition-colors ${
                  done || active ? 'border-black bg-black' : 'border-black/50 bg-white'
                }`}
              >
                {active && (
                  <span aria-hidden="true" className="absolute inset-[-5px] rounded-full border border-black/15" />
                )}
              </span>
              <span
                className={`mt-2.5 text-[9px] font-mono uppercase tracking-[0.16em] ${
                  active ? 'font-bold text-black' : done ? 'text-black/55' : 'text-black/35'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
