'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';
import ExactLocationMap, { type PickedSpot } from './ExactLocationMap';
import {
  getMapLibraries,
  isGoogleMapsEnabled,
  type GoogleMapHandle,
  type LngLat,
  type ParsedPlace,
} from '@/lib/googleMaps';

type Props = {
  /** Google-formatted area text shown in the field ('' until picked). */
  areaText: string;
  /** The pinned coordinates, if any — drives the mini map thumbnail. */
  spot: LngLat | null;
  /** Where the big map opens when nothing is pinned yet. */
  fallbackCenter: LngLat | null;
  /** A suggestion was picked in the Google search box. */
  onPlaceSelected: (place: ParsedPlace) => void;
  /** A pin was dropped/moved on the map (or found via GPS). */
  onPicked: (spot: PickedSpot) => void;
  onCleared: () => void;
};

/**
 * The "Area" field: a Google-Maps picker shaped like the reference design.
 * Collapsed it shows the resolved area text plus a live mini-map thumbnail
 * with a Change chip; expanded it reveals the Places search box and the
 * full pick-your-spot map. Both paint the same pin.
 */
export default function AreaPicker({
  areaText,
  spot,
  fallbackCenter,
  onPlaceSelected,
  onPicked,
  onCleared,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const toggle = () => setOpen((v) => !v);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex min-h-[58px] items-stretch gap-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="checkout-flat min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-left transition-colors hover:border-black/30 cursor-pointer"
        >
          {areaText ? (
            <span className="block text-[13px] leading-snug text-black/75">{areaText}</span>
          ) : (
            <span className="block text-sm leading-snug text-black/35">
              Area · search or pin on Google Maps
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={areaText ? 'Change area on the map' : 'Pick the area on the map'}
          className="checkout-flat relative w-[76px] shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#ECEAE4] cursor-pointer"
        >
          {spot && <MiniMapPreview lat={spot.lat} lng={spot.lng} />}
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-black">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span className="rounded-sm bg-white/90 px-1.5 py-px text-[9px] font-mono font-bold uppercase tracking-wider">
              {spot ? 'Change' : 'Map'}
            </span>
          </span>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-[#FAFAF8] p-3">
          <div className="flex items-center rounded-xl border border-black/10 bg-white px-3.5 transition-colors focus-within:border-black">
            <PlaceAutocompleteInput
              id="checkout-area-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPlace={onPlaceSelected}
              placeholder="Search area, street, landmark…"
              required={false}
              className="w-full bg-transparent px-0 py-3 text-sm text-black outline-none placeholder:text-black/35 rounded-none"
            />
          </div>

          <ExactLocationMap
            spot={spot}
            fallbackCenter={fallbackCenter}
            onPicked={onPicked}
            onCleared={onCleared}
            alwaysOpen
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black underline underline-offset-4 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Decorative mini map for the thumbnail. Created once, on the first pick, so
 * an ordinary checkout visit does not pay for a second billed map load.
 */
function MiniMapPreview({ lat, lng }: { lat: number; lng: number }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapHandle | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current || !isGoogleMapsEnabled() || !elRef.current) return;
    createdRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const { maps } = await getMapLibraries();
        if (cancelled || !elRef.current) return;
        mapRef.current = new maps.Map(elRef.current, {
          center: { lat, lng },
          zoom: 16,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          clickableIcons: false,
          keyboardShortcuts: false,
          gestureHandling: 'none',
        }) as unknown as GoogleMapHandle;
      } catch {
        // The thumbnail is decorative — the text and the big map still work.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setCenter({ lat, lng });
  }, [lat, lng]);

  return <div ref={elRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
