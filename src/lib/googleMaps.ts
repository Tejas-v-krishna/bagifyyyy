/**
 * Optional Google Maps Platform layer for the checkout address tools.
 *
 * Everything here degrades to "off" when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
 * empty: the street field stays a plain input and the free PIN + GPS flow
 * keeps working untouched. The SDK script itself is only fetched when the
 * shopper first touches the address field or opens the map, so an ordinary
 * visitor never triggers a billed map load.
 *
 * Cost guardrails baked in:
 *  - suggestions are debounced (300 ms) + cancelled when stale (seq counter)
 *  - every request is region-restricted to India (includedRegionCodes)
 *  - one AutocompleteSessionToken per typing session, renewed after each
 *    selection so Google bills one session instead of itemised requests
 *  - the interactive map is created lazily, once per checkout visit
 */

export type LngLat = { lat: number; lng: number };

export type ParsedPlace = {
  /** House / building / street portion for the address field. */
  street: string;
  /** Locality the courier should recognise (India Post refines this later). */
  city: string;
  /** administrative_area_level_1 long name (raw — the caller maps aliases). */
  state: string;
  /** 6-digit PIN when Google knows it ('' otherwise). */
  pincode: string;
  /** Coordinates of the selected place, when returned. */
  location: LngLat | null;
  /** Full formatted address, used for hints and fallbacks. */
  label: string;
};

type AddressComponent = {
  types?: readonly string[] | null;
  longText?: string | null;
  shortText?: string | null;
};

type PlaceInstance = {
  fetchFields: (options: { fields: string[] }) => Promise<void>;
  addressComponents?: readonly AddressComponent[] | null;
  formattedAddress?: string | null;
  displayName?: string | null;
  /** LatLng (methods) or LatLngLiteral (properties) depending on the SDK path. */
  location?: unknown;
};

export type PlacePrediction = {
  placeId?: string;
  text?: { toString(): string } | null;
  mainText?: { toString(): string } | null;
  secondaryText?: { toString(): string } | null;
  toPlace: () => PlaceInstance;
};

type PlacesLibrary = {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      sessionToken?: object;
      includedRegionCodes?: string[];
      language?: string;
      region?: string;
    }) => Promise<{ suggestions?: Array<{ placePrediction?: PlacePrediction | null }> }>;
  };
};

export type GoogleMapHandle = {
  setCenter: (position: LngLat) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, handler: (e: { latLng?: unknown }) => void) => void;
};

export type GoogleMarkerHandle = {
  position: unknown;
  map: unknown;
  addListener: (event: string, handler: () => void) => void;
};

type MapsLibrary = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
};

type MarkerLibrary = {
  AdvancedMarkerElement: new (options: Record<string, unknown>) => unknown;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (name: string) => Promise<unknown>;
    };
  };
  __bagifyGoogleMapsReady?: () => void;
};

const LOAD_TIMEOUT_MS = 8000;

let loaderPromise: Promise<void> | null = null;

export function isGoogleMapsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

/** Loads the Maps JavaScript bootstrap once. Rejects (never throws sync) when
 *  the key is missing or Google is unreachable — callers just stay on the
 *  plain-input fallback. */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser'));
  }
  const win = window as GoogleMapsWindow;
  if (win.google?.maps?.importLibrary) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }

    const timer = window.setTimeout(() => {
      loaderPromise = null;
      reject(new Error('Google Maps did not finish loading'));
    }, LOAD_TIMEOUT_MS);

    // The documented bootstrap: the API pings this global when ready, then
    // google.maps.importLibrary() can pull individual libraries on demand.
    win.__bagifyGoogleMapsReady = () => {
      window.clearTimeout(timer);
      resolve();
    };

    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      '?v=weekly&loading=async&libraries=places,marker' +
      `&key=${encodeURIComponent(key)}` +
      '&callback=__bagifyGoogleMapsReady';
    script.async = true;
    script.dataset.bagifyGmaps = '1';
    script.onerror = () => {
      window.clearTimeout(timer);
      loaderPromise = null;
      reject(new Error('Google Maps script failed to load'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function getPlacesLibrary(): Promise<PlacesLibrary> {
  await loadGoogleMaps();
  const api = (window as GoogleMapsWindow).google?.maps;
  if (!api?.importLibrary) throw new Error('Google Maps is not available');
  return (await api.importLibrary('places')) as PlacesLibrary;
}

export async function getMapLibraries(): Promise<{ maps: MapsLibrary; marker: MarkerLibrary }> {
  await loadGoogleMaps();
  const api = (window as GoogleMapsWindow).google?.maps;
  if (!api?.importLibrary) throw new Error('Google Maps is not available');
  const [maps, marker] = await Promise.all([
    api.importLibrary('maps'),
    api.importLibrary('marker'),
  ]);
  return { maps: maps as MapsLibrary, marker: marker as MarkerLibrary };
}

/** Reads a LatLng / LatLngLiteral / anything shape into {lat,lng}. */
export function readLatLng(value: unknown): LngLat | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as { lat?: unknown; lng?: unknown };
  const rawLat = typeof v.lat === 'function' ? (v.lat as () => number)() : v.lat;
  const rawLng = typeof v.lng === 'function' ? (v.lng as () => number)() : v.lng;
  if (typeof rawLat !== 'number' || typeof rawLng !== 'number') return null;
  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) return null;
  return { lat: rawLat, lng: rawLng };
}

/**
 * Turns Google's address components into the checkout fields.
 * `fallbackLabel` is the highlighted prediction text, used when the place has
 * no street-level components (common for locality-only Indian predictions).
 */
export function parsePlace(place: PlaceInstance, fallbackLabel?: string): ParsedPlace {
  const components = Array.isArray(place.addressComponents) ? place.addressComponents : [];
  const pick = (type: string) => {
    const hit = components.find((c) => c.types?.includes(type));
    return (hit?.longText || hit?.shortText || '').trim();
  };

  const pincode = pick('postal_code').replace(/\D/g, '').slice(0, 6);
  const city =
    pick('locality') ||
    pick('postal_town') ||
    pick('administrative_area_level_3') ||
    pick('administrative_area_level_2');
  const state = pick('administrative_area_level_1');
  const streetNumberAndRoute = [pick('street_number'), pick('route')].filter(Boolean).join(' ');
  const streetParts = [pick('subpremise'), pick('premise'), streetNumberAndRoute].filter(Boolean);

  const label = (place.formattedAddress || fallbackLabel || '').trim();
  let street = streetParts.join(', ');
  if (!street && fallbackLabel) street = fallbackLabel.trim();
  if (!street && label) street = label.split(',')[0]?.trim() || '';

  return { street, city, state, pincode, location: readLatLng(place.location), label: label || street };
}
