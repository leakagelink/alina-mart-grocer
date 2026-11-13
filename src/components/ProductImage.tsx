import { cn } from "@/lib/utils";
import { productImage } from "@/lib/productImages";

type Props = {
  product: { id: string; name: string; emoji?: string; image?: string | null };
  className?: string;
  emojiClassName?: string;
};

/** Shows the product's photo when it has one, otherwise falls back to its emoji. */
export function ProductImage({ product, className, emojiClassName }: Props) {
  const src = productImage(product);
  if (src) {
    return (
      <img
        src={src}
        alt={product.name}
        loading="lazy"
        className={cn("h-full w-full object-contain", className)}
      />
    );
  }
  return <span className={emojiClassName}>{product.emoji ?? "🛍️"}</span>;
}
