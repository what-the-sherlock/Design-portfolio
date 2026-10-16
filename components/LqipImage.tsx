import type { MediaInfo } from "@/content/site";

/**
 * Pixelated 8px placeholder behind a lazy responsive image — the original SanityImage technique.
 */
export function LqipImage({
  slug,
  media,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  parallax = false,
  priority = false,
  focus,
}: {
  slug: string;
  media: MediaInfo;
  alt: string;
  sizes?: string;
  parallax?: boolean;
  priority?: boolean;
  focus?: string;
}) {
  return (
    <div className="lqip-img" style={{ backgroundImage: `url(${media.lqip})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/media/${slug}/cover-1600.webp`}
        srcSet={[800, 1200, 1600, 2400].map((w) => `/media/${slug}/cover-${w}.webp ${w}w`).join(", ")}
        sizes={sizes}
        width={media.cover.width}
        height={media.cover.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={focus ? { objectPosition: focus } : undefined}
        {...(parallax ? { "data-parallax-img": "true" } : {})}
      />
    </div>
  );
}
