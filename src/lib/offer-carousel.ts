export const OFFER_INTERVAL_MS = 4500;

export function nextOffer(index: number, count: number) {
  return count < 2 ? 0 : (index + 1) % count;
}