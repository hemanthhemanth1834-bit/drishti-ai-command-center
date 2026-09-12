/** Google Places API (New) — needs a billing-enabled key in NEXT_PUBLIC_GOOGLE_MAPS_KEY.
 *  Without a key every call throws GOOGLE_KEY_MISSING and the UI shows setup steps.
 *  Restrict the key by HTTP referrer (your domains) in Google Cloud Console.
 */

export const GOOGLE_KEY_MISSING = 'GOOGLE_KEY_MISSING';

export function googleKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
}

function needKey(): string {
  const k = googleKey();
  if (!k) throw new Error(GOOGLE_KEY_MISSING);
  return k;
}

export type GooglePlaceDetails = {
  id: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  openNow?: boolean;
  weekdayHours?: string[];
  phone?: string;
  website?: string;
  mapsUri?: string;
  types?: string[];
  photoUrl?: string;
  reviews?: { author: string; rating: number; text: string; time: string }[];
};

type SearchResp = {
  places?: { id: string }[];
};

type DetailsResp = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  photos?: { name: string }[];
  reviews?: {
    authorAttribution?: { displayName?: string };
    rating?: number;
    text?: { text?: string };
    publishTime?: string;
  }[];
};

/** Find the Google place id best matching a name near coordinates. */
async function findPlaceId(name: string, lat: number, lon: number, key: string): Promise<string> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({
      textQuery: name,
      locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: 2000 } },
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`places search ${res.status}`);
  const j = (await res.json()) as SearchResp;
  const id = j.places?.[0]?.id;
  if (!id) throw new Error('no Google place found for this location');
  return id;
}

/** Full detail pull: rating, hours, phone, website, 1 photo, top reviews. */
export async function fetchGooglePlace(
  name: string,
  lat: number,
  lon: number
): Promise<GooglePlaceDetails> {
  const key = needKey();
  const id = await findPlaceId(name, lat, lon, key);
  const res = await fetch(`https://places.googleapis.com/v1/${id}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'displayName,formattedAddress,rating,userRatingCount,openingHours,' +
        'nationalPhoneNumber,websiteUri,googleMapsUri,types,photos,reviews',
    },
  });
  if (!res.ok) throw new Error(`place details ${res.status}`);
  const j = (await res.json()) as DetailsResp;
  return {
    id: j.id,
    name: j.displayName?.text ?? name,
    address: j.formattedAddress ?? '',
    rating: j.rating,
    ratingCount: j.userRatingCount,
    openNow: j.openingHours?.openNow,
    weekdayHours: j.openingHours?.weekdayDescriptions,
    phone: j.nationalPhoneNumber,
    website: j.websiteUri,
    mapsUri: j.googleMapsUri,
    types: j.types,
    photoUrl: j.photos?.[0]
      ? `https://places.googleapis.com/v1/${j.photos[0].name}/media?key=${key}&maxWidthPx=600`
      : undefined,
    reviews: (j.reviews ?? []).slice(0, 2).map((r) => ({
      author: r.authorAttribution?.displayName ?? 'Google user',
      rating: r.rating ?? 0,
      text: r.text?.text ?? '',
      time: r.publishTime ? new Date(r.publishTime).toLocaleDateString() : '',
    })),
  };
}
