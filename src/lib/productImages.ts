// Photos for the seeded catalogue. Product rows in the database may also carry
// their own `image` URL; that always wins over this map.
const files = import.meta.glob("../assets/products/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const PHOTOS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split("/").pop()?.replace(/\.jpg$/, "");
  if (id) PHOTOS[id] = url;
}

export function productImage(product: { id: string; image?: string | null }): string | null {
  const custom = product.image?.trim();
  if (custom) return custom;
  return PHOTOS[product.id] ?? null;
}
