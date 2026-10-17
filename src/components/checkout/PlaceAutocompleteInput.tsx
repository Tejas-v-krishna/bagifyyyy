'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getPlacesLibrary,
  isGoogleMapsEnabled,
  loadGoogleMaps,
  parsePlace,
  type ParsedPlace,
  type PlacePrediction,
} from '@/lib/googleMaps';

type Props = {
  value: string;
  /** Keeps the page's existing per-keystroke handler (validation, formatting). */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Fills the other fields (and the field itself) once a suggestion is picked. */
  onPlace: (place: ParsedPlace) => void;
  className: string;
  /** DOM id — also names the listbox/option ids. */
  id?: string;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
};

type SuggestionItem = {
  main: string;
  secondary: string;
  prediction: PlacePrediction;
};

/**
 * An address input wired to Google Places autocomplete. With a key configured
 * it gains an India-only suggestions dropdown; without one it degrades to a
 * plain input (browser autofill included) and the rest of the form still works.
 */
export default function PlaceAutocompleteInput({
  value,
  onChange,
  onPlace,
  className,
  id = 'checkout-street',
  placeholder = 'Flat 402, Lotus Heights, MG Road',
  required = true,
  hasError = false,
}: Props) {
  const placesEnabled = isGoogleMapsEnabled();
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);

  const seqRef = useRef(0);
  const debounceRef = useRef<number | null>(null);
  const blurRef = useRef<number | null>(null);
  // One session token per typing session; renewed after each selection so
  // Google bills a single session instead of itemised per-request charges.
  const sessionRef = useRef<object | null>(null);
  const itemsRef = useRef<SuggestionItem[]>([]);
  const loadKickedRef = useRef(false);
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;
  itemsRef.current = items;

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (blurRef.current) window.clearTimeout(blurRef.current);
    },
    []
  );

  const closeList = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      const seq = ++seqRef.current;
      setBusy(true);
      try {
        const places = await getPlacesLibrary();
        if (seq !== seqRef.current) return;
        if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionRef.current ?? undefined,
          includedRegionCodes: ['in'],
          language: 'en',
          region: 'in',
        });
        if (seq !== seqRef.current) return;
        const next = (suggestions ?? [])
          .map((s) => s.placePrediction)
          .filter((p): p is PlacePrediction => Boolean(p))
          .slice(0, 5)
          .map((prediction) => ({
            main: prediction.mainText?.toString() || prediction.text?.toString() || '',
            secondary: prediction.secondaryText?.toString() || '',
            prediction,
          }));
        setItems(next);
        setOpen(next.length > 0);
        setActive(-1);
      } catch {
        if (seq === seqRef.current) {
          setItems([]);
          closeList();
        }
      } finally {
        if (seq === seqRef.current) setBusy(false);
      }
    },
    [closeList]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (!placesEnabled) return;
    const q = e.target.value.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.length < 3) {
      seqRef.current++;
      setItems([]);
      closeList();
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void fetchSuggestions(q);
    }, 300);
  };

  const choose = useCallback(
    async (index: number) => {
      const item = itemsRef.current[index];
      if (!item) return;
      closeList();
      setItems([]);
      const seq = ++seqRef.current;
      setBusy(true);
      try {
        const place = item.prediction.toPlace();
        await place.fetchFields({
          fields: ['addressComponents', 'formattedAddress', 'displayName', 'location'],
        });
        if (seq !== seqRef.current) return;
        onPlaceRef.current(parsePlace(place, item.main));
        // A selection closes the billing session; next typing starts a new one.
        sessionRef.current = null;
      } catch {
        // Keep whatever the shopper typed — the plain form still works.
      } finally {
        if (seq === seqRef.current) setBusy(false);
      }
    },
    [closeList]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!items.length) return;
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setActive(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        void choose(active);
      }
    } else if (e.key === 'Escape') {
      closeList();
    }
  };

  const handleFocus = () => {
    if (!placesEnabled || loadKickedRef.current) return;
    loadKickedRef.current = true;
    // Warm the SDK in the background so the first suggestions feel instant.
    void loadGoogleMaps().catch(() => {});
  };

  const handleBlur = () => {
    if (blurRef.current) window.clearTimeout(blurRef.current);
    blurRef.current = window.setTimeout(() => closeList(), 160);
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        /* Browser autofill fights the Google dropdown for the same corner. */
        autoComplete={placesEnabled ? 'off' : 'street-address'}
        required={required}
        role={placesEnabled ? 'combobox' : undefined}
        aria-autocomplete={placesEnabled ? 'list' : undefined}
        aria-expanded={placesEnabled ? open : undefined}
        aria-controls={placesEnabled ? `${id}-listbox` : undefined}
        aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={className}
      />

      {busy && !open && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black/35" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}

      {open && items.length > 0 && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Address suggestions"
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-black/10 bg-white shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
        >
          <ul className="max-h-64 overflow-auto">
            {items.map((item, i) => (
              <li
                key={item.prediction.placeId || `${item.main}-${i}`}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => void choose(i)}
                className={`cursor-pointer border-b border-black/[0.04] px-3.5 py-2.5 last:border-b-0 transition-colors ${
                  i === active ? 'bg-black/[0.05]' : 'bg-white hover:bg-black/[0.035]'
                }`}
              >
                <span className="block text-sm leading-snug text-black">{item.main}</span>
                {item.secondary && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-black/50">{item.secondary}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end border-t border-black/[0.06] bg-[#FCFCFA] px-3 py-1.5">
            {/* Places policy: predictions shown outside Google's own widget keep the attribution. */}
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              className="h-[12px] w-auto opacity-70"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
