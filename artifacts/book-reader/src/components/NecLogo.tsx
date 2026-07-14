import logoWide from "@assets/Black-logo-wide.png";

interface NecLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Official NEC full logo (starburst + wordmark), wide lockup.
 * Source of truth: Claude-Cowork/Brand Assets/Black-logo-wide.png
 * (added 13 Jul 2026; dark backgrounds only — the mix-blend-mode
 * lets the black canvas melt into any dark header/footer).
 */
export function NecLogo({ className = "", size = "md" }: NecLogoProps) {
  const h = size === "sm" ? 56 : size === "lg" ? 72 : 64;

  return (
    <div className={`flex items-center select-none shrink-0 ${className}`}>
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
    </div>
  );
}
