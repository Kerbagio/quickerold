import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

const BrandLogo = ({ className }: BrandLogoProps) => (
  <svg
    viewBox="0 0 180 40"
    role="img"
    aria-label="QuickER — Get to the right hospital, faster"
    className={cn("h-9 w-auto", className)}
  >
    <g className="text-primary">
      <circle cx="12" cy="9" r="9" fill="currentColor" />
      <path d="M12 25 7.5 16h9L12 25Z" fill="currentColor" />
      <rect x="10.5" y="4" width="3" height="10" rx="0.5" fill="white" />
      <rect x="7" y="7.5" width="10" height="3" rx="0.5" fill="white" />
      <circle
        cx="12"
        cy="9"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
        className="motion-safe:animate-pulse"
      />
      <line x1="24" y1="6" x2="30" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <line x1="26" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <line x1="24" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
    </g>

    <text
      x="36"
      y="20"
      fontFamily="Poppins, system-ui, sans-serif"
      fontSize="20"
      fontWeight="700"
      fill="currentColor"
      className="text-foreground"
    >
      Quick
    </text>
    <text
      x="96"
      y="20"
      fontFamily="Poppins, system-ui, sans-serif"
      fontSize="20"
      fontWeight="700"
      fill="currentColor"
      className="text-primary"
    >
      ER
    </text>
    <text
      x="36"
      y="34"
      fontFamily="Inter, system-ui, sans-serif"
      fontSize="9"
      fontWeight="500"
      fill="currentColor"
      className="text-muted-foreground"
    >
      Get to the right hospital, faster.
    </text>
  </svg>
);

export default BrandLogo;
