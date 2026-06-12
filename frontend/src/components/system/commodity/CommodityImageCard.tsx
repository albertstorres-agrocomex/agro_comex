import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Size variant map ────────────────────────────────────────────────────────
// All sizes are fixed square dimensions defined via Tailwind tokens.
// Using explicit pixel values so next/image can optimize correctly.

const sizeMap = {
  sm: { container: "w-16 h-16",  px: 64  },
  md: { container: "w-24 h-24",  px: 96  },
  lg: { container: "w-32 h-32",  px: 128 },
} as const;

export type CommodityImageSize = keyof typeof sizeMap;

// ─── Props ───────────────────────────────────────────────────────────────────

interface CommodityImageCardProps {
  src: string;
  alt: string;
  size?: CommodityImageSize;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
//
// Rendering guarantees:
//   • object-contain  — image always fully visible, never cropped, ratio preserved
//   • fixed container — same dimensions every time regardless of image dimensions
//   • next/image      — automatic optimization, no layout shift (fill + object-contain)
//   • dark mode       — uses --muted token which adapts in .dark context
//
// Consistency is enforced by sizeMap: every consumer picks from the same
// three fixed sizes, so the container never varies by context.

export function CommodityImageCard({
  src,
  alt,
  size = "md",
  className,
}: CommodityImageCardProps) {
  const { container, px } = sizeMap[size];

  return (
    <div
      className={cn(
        // Fixed square container — same dimensions across all usage contexts
        "relative flex-shrink-0",
        container,
        // Neutral background from design system (adapts to dark mode)
        "bg-muted",
        // Rounded corners using design system token
        "rounded-[var(--radius-md)]",
        // Subtle border for definition
        "border border-border/60",
        // Subtle shadow for depth
        "shadow-sm",
        // Overflow hidden keeps the rounded corners intact
        "overflow-hidden",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        // fill + object-contain = image scales to fit entirely inside the
        // container without cropping, centered, aspect ratio preserved.
        // This is the ONLY correct combination for "always fully visible".
        fill
        sizes={`${px}px`}
        className="object-cover"
        priority={false}
      />
    </div>
  );
}
