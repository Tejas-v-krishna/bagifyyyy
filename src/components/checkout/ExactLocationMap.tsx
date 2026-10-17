'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import {
  getMapLibraries,
  isGoogleMapsEnabled,
  readLatLng,
  type GoogleMapHandle,
  type GoogleMarkerHandle,
  type LngLat,
} from '@/lib/googleMaps';

export type PickedSpot = {
  lat: number;
  lng: number;
  pincode: string;
  city: string;
  state: string;
  /** Human-readable area line from the free reverse lookup (may be ''). */
  areaLabel: string;
};

type Props = {
  /** The spot currently attached to the order (drives the initial pin). */
  spot: LngLat | null;
  /** Where to open the map when no spot is set yet (e.g. a previous pick). */
  fallbackCenter: LngLat | null;
  onPicked: (spot: PickedSpot) => void;
  onCleared: () => void;
  /**
   * Renders the map immediately with no toggle row — used inside the Area
   * picker, whose own "Change" button owns the open/close state.
   */
  alwaysOpen?: boolean;
};

const INDIA_CENTER: LngLat = { lat: 20.5937, lng: 78.9629 };

/**
 * "Pin your exact spot" map. Optional for the shopper and lazy by design: the
 * billed map load only happens the first time this is opened, and the reverse
 * lookup reuses the free BigDataCloud endpoint the GPS button already relies on.
 */
export default function ExactLocationMap({ spot, fallbackCenter, onPicked, onCleared, alwaysOpen = false }: Props) {
  const enabled = isGoogleMapsEnabled();
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState('');
  const [pin, setPin] = useState<LngLat | null>(spot);

  const isOpen = alwaysOpen || opened;

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapHandle | null>(null);
  const markerRef = useRef<GoogleMarkerHandle | null>(null);
  const markerLibRef = useRef<{ AdvancedMarkerElement: new (options: Record<string, unknown>) => unknown } | null>(null);
  const revSeqRef = useRef(0);
  const callbacksRef = useRef({ onPicked, onCleared });
  callbacksRef.current = { onPicked, onCleared };

  // Parent stays the source of truth for the pin.
  useEffect(() => {
    setPin(spot);
  }, [spot]);

  const reverseLookup = async (ll: LngLat) => {
    const seq = ++revSeqRef.current;
    setStatus('Reading the address…');
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${ll.lat}&longitude=${ll.lng}&localityLanguage=en`
      );
      const data = await res.json();
      if (seq !== revSeqRef.current) return;
      const pcode = String(data?.postcode || '').replace(/\D/g, '').slice(0, 6);
      const locality = String(data?.locality || '').trim();
      const cityName = String(data?.city || '').trim();
      const region = String(data?.principalSubdivision || '').trim();
      // "Baner, Pune, Maharashtra 411045" — what the courier would call the area.
      const areaLabel =
        Array.from(new Set([locality, cityName, region].filter((v) => v.length > 0))).join(', ') +
        (pcode ? ` ${pcode}` : '');
      callbacksRef.current.onPicked({
        lat: ll.lat,
        lng: ll.lng,
        pincode: pcode,
        city: cityName || locality,
        state: region,
        areaLabel,
      });
      setStatus('Exact spot saved — drag the pin to fine-tune.');
    } catch {
      if (seq !== revSeqRef.current) return;
      // The pin is still worth keeping even when the free lookup is down.
      callbacksRef.current.onPicked({ lat: ll.lat, lng: ll.lng, pincode: '', city: '', state: '', areaLabel: '' });
      setStatus('Spot saved (address lookup skipped).');
    }
  };

  /** Moves (or creates) the draggable marker and runs the reverse lookup. */
  const placePin = (ll: LngLat, recenter: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      let marker = markerRef.current;
      if (!marker && markerLibRef.current) {
        marker = new markerLibRef.current.AdvancedMarkerElement({
          map,
          position: ll,
          gmpDraggable: true,
          title: 'Drag to your exact entrance',
        }) as unknown as GoogleMarkerHandle;
        marker.addListener('dragend', () => {
          const moved = readLatLng(markerRef.current?.position);
          if (!moved) return;
          setPin(moved);
          void reverseLookup(moved);
        });
        markerRef.current = marker;
      } else if (marker) {
        marker.position = ll;
      }
      if (recenter) {
        map.setCenter(ll);
        map.setZoom(17);
      }
      setPin(ll);
      void reverseLookup(ll);
    } catch {
      setFailed(true);
    }
  };

  // Create the map once, the first time the panel becomes visible.
  useEffect(() => {
    if (!isOpen || !enabled || mapRef.current || failed || !mapElRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { maps, marker } = await getMapLibraries();
        if (cancelled || !mapElRef.current) return;
        markerLibRef.current = marker;
        const start = spot ?? fallbackCenter ?? INDIA_CENTER;
        const isLocal = Boolean(spot || fallbackCenter);
        const map = new maps.Map(mapElRef.current, {
          center: start,
          zoom: isLocal ? 17 : 5,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          fullscreenControl: false,
          streetViewControl: false,
          // Two-finger pan so the checkout page can still be scrolled on phones.
          gestureHandling: 'cooperative',
        }) as unknown as GoogleMapHandle;
        mapRef.current = map;
        map.addListener('click', (e) => {
          const ll = readLatLng(e?.latLng);
          if (ll) placePin(ll, false);
        });
        if (spot || fallbackCenter) {
          // Marker only when we already know where the shopper is.
          const seed = spot ?? fallbackCenter;
          if (seed) placePin(seed, false);
        }
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // map is created once per checkout visit; later spot changes move the pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, enabled, failed]);

  const handleGps = () => {
    if (!navigator.geolocation) {
      setStatus('GPS not available on this device — tap the map instead.');
      return;
    }
    setStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placePin({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true);
      },
      () => setStatus('Could not get your location — tap the map instead.'),
      { timeout: 10000 }
    );
  };

  const clearPin = () => {
    revSeqRef.current++;
    if (markerRef.current) markerRef.current.map = null;
    markerRef.current = null;
    setPin(null);
    setStatus('Pin removed.');
    callbacksRef.current.onCleared();
  };

  if (!enabled) return null;

  // Inside the Area picker: the surrounding panel owns open/close, so the map
  // renders straight away and the toggle row is dropped.
  if (alwaysOpen) {
    if (failed) {
      return (
        <p className="text-[11px] font-mono text-black/55" role="status">
          Map unavailable — search the area above instead.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2.5">
        <div
          ref={mapElRef}
          className="h-56 w-full overflow-hidden rounded-xl border border-black/10 bg-black/[0.03] sm:h-64"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGps}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black underline-offset-4 hover:underline transition-colors cursor-pointer"
          >
            <MapPin className="w-3 h-3" aria-hidden="true" />
            <span>Use my GPS</span>
          </button>
          {pin && (
            <button
              type="button"
              onClick={clearPin}
              className="text-[10px] font-mono uppercase tracking-[0.12em] text-black/50 underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Remove pin
            </button>
          )}
          {!ready && !failed && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-black/45" aria-hidden="true">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading map…
            </span>
          )}
        </div>
        {status && (
          <p className="text-[11px] font-mono text-black/55" role="status">
            {status}
          </p>
        )}
        {!status && (
          <p className="text-[10px] font-mono text-black/40">
            {pin
              ? `PINNED ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
              : 'Tap the map where you live, then drag the pin to your entrance.'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setOpened(true);
            setExpanded((v) => !v);
          }}
          disabled={failed}
          aria-expanded={opened ? expanded : false}
          className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black underline-offset-4 hover:underline transition-colors cursor-pointer disabled:opacity-50"
        >
          {!ready && opened && !failed ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>
            {failed
              ? 'Map unavailable'
              : opened && expanded
                ? 'Hide map'
                : pin
                  ? 'Adjust exact spot'
                  : 'Pin exact spot on map (optional)'}
          </span>
        </button>
        {pin && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-emerald-700">
            ✓ Pin attached
          </span>
        )}
        {status && (
          <p className="text-[11px] font-mono text-black/55" role="status">
            {status}
          </p>
        )}
      </div>

      {opened && (
        <div className={expanded ? 'block' : 'hidden'}>
          <div
            ref={mapElRef}
            className="h-56 w-full overflow-hidden rounded-xl border border-black/10 bg-black/[0.03] sm:h-64"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGps}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-black/45 hover:text-black underline-offset-4 hover:underline transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3" aria-hidden="true" />
              <span>Use my GPS</span>
            </button>
            {pin && (
              <button
                type="button"
                onClick={clearPin}
                className="text-[10px] font-mono uppercase tracking-[0.12em] text-black/50 underline underline-offset-2 hover:text-black cursor-pointer"
              >
                Remove pin
              </button>
            )}
            <p className="text-[10px] font-mono text-black/40">
              {pin
                ? `PINNED ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                : 'Tap the map where you live, then drag the pin to your entrance.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
