import logoWide from "@assets/Black-logo-wide.png";

interface NecLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** When set, the logo becomes a link (e.g. back to the NEC home site). */
  href?: string;
}

/**
 * Official NEC full logo (starburst + wordmark), wide lockup.
 * Source of truth: Claude-Cowork/Brand Assets/Black-logo-wide.png
 * (added 13 Jul 2026; dark backgrounds only — the mix-blend-mode
 * lets the black canvas melt into any dark header/footer).
 *
 * 15 Jul 2026: optional `href` prop — the header logo now links back to
 * the NEC front-door site (same-tab, standard logo-home behavior).
 */
export function NecLogo({ className = "", size = "md", href }: NecLogoProps) {
  const h = size === "sm" ? 56 : size === "lg" ? 72 : 64;

  const img = (
    <img
      src={logoWide}
      alt="Non-Extractive Capital"
      draggable={false}
      style={{
        display: "block",
        height: h,
        width: "auto",
        mixBlendMode: "screen",
        flexShrink: 0,
      }}
    />
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label="Non-Extractive Capital — home"
        title="Non-Extractive Capital — home"
        className={`flex items-center select-none shrink-0 ${className}`}
      >
        {img}
      </a>
    );
  }

  return (
    <div className={`flex items-center select-none shrink-0 ${className}`}>
      {img}
    </div>
  );
}
