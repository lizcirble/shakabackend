import { cn } from "@/lib/utils";
interface GeometricBackgroundProps {
  variant?: "dots" | "lines" | "ndebele" | "kente" | "claws";
  className?: string;
  opacity?: number;
}
export function GeometricBackground({
  variant = "dots",
  className,
  opacity = 0.05
}: GeometricBackgroundProps) {
  const patterns: Record<string, React.ReactNode> = {
    dots: <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" />
      </pattern>,
    lines: <pattern id="lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M0 20 L40 20" stroke="currentColor" strokeWidth="0.5" />
        <path d="M20 0 L20 40" stroke="currentColor" strokeWidth="0.5" />
      </pattern>,
    ndebele: <pattern id="ndebele" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        {/* Outer frame */}
        <rect x="5" y="5" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Inner diamond */}
        <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Center square */}
        <rect x="22" y="22" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Center dot */}
        <circle cx="30" cy="30" r="3" fill="currentColor" />
      </pattern>,
    kente: <pattern id="kente" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        {/* Vertical stripes */}
        <rect x="0" y="0" width="10" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="10" y="0" width="10" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="20" y="0" width="10" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <rect x="30" y="0" width="10" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        {/* Horizontal weave */}
        <path d="M0 10 L40 10 M0 30 L40 30" stroke="currentColor" strokeWidth="2" />
        {/* Accent squares */}
        <rect x="2" y="12" width="6" height="6" fill="currentColor" />
        <rect x="22" y="12" width="6" height="6" fill="currentColor" />
        <rect x="12" y="32" width="6" height="6" fill="currentColor" />
        <rect x="32" y="32" width="6" height="6" fill="currentColor" />
      </pattern>,
    claws: <pattern id="claws" x="0" y="0" width="60" height="80" patternUnits="userSpaceOnUse">
        {/* Three claw marks */}
        <path d="M15 0 L20 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 0 L30 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 0 L40 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </pattern>
  };
  const patternId = variant;
  return <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{
    opacity
  }}>
      <svg className="absolute inset-0 h-full w-full text-primary" preserveAspectRatio="xMidYMid slice">
        <defs>{patterns[variant]}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>;
}

// Decorative claw mark divider with animated scratches
export function ClawDivider({
  className
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center items-center gap-2 py-4", className)}>
      <svg width="100" height="32" viewBox="0 0 100 32" fill="none" className="text-primary overflow-visible">
        <defs>
          {/* Tapered stroke effect using gradient */}
          <linearGradient id="clawGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="30%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="70%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="clawGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="25%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="75%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
          {/* Filter for depth/glow effect */}
          <filter id="clawGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Deep scratch marks - main claw paths with curves */}
        <path 
          d="M22 2C24 6 26 12 30 18C33 23 36 28 38 30" 
          stroke="url(#clawGradient1)" 
          strokeWidth="4" 
          strokeLinecap="round"
          filter="url(#clawGlow)"
          className="animate-claw-scratch"
          style={{ 
            strokeDasharray: 100, 
            strokeDashoffset: 100,
            animationDelay: "0ms"
          }}
        />
        <path 
          d="M42 1C44 7 46 14 50 21C52 26 54 29 56 31" 
          stroke="url(#clawGradient2)" 
          strokeWidth="5" 
          strokeLinecap="round"
          filter="url(#clawGlow)"
          className="animate-claw-scratch"
          style={{ 
            strokeDasharray: 100, 
            strokeDashoffset: 100,
            animationDelay: "80ms"
          }}
        />
        <path 
          d="M62 2C64 5 67 11 70 17C73 23 76 28 78 30" 
          stroke="url(#clawGradient1)" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          filter="url(#clawGlow)"
          className="animate-claw-scratch"
          style={{ 
            strokeDasharray: 100, 
            strokeDashoffset: 100,
            animationDelay: "160ms"
          }}
        />
        
        {/* Secondary scratch lines for depth */}
        <path 
          d="M25 4C26 8 28 13 31 19" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.4"
          className="animate-claw-scratch"
          style={{ 
            strokeDasharray: 50, 
            strokeDashoffset: 50,
            animationDelay: "200ms"
          }}
        />
        <path 
          d="M65 4C66 7 68 12 71 18" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.4"
          className="animate-claw-scratch"
          style={{ 
            strokeDasharray: 50, 
            strokeDashoffset: 50,
            animationDelay: "250ms"
          }}
        />
      </svg>
    </div>
  );
}

// Decorative border with Ndebele-inspired pattern
export function NdebeleBorder({
  className
}: {
  className?: string;
}) {
  return <div className={cn("h-2 w-full bg-gradient-to-r from-primary via-secondary to-accent border-[#483c3e] bg-accent", className)} style={{
    backgroundImage: `repeating-linear-gradient(
          90deg,
          hsl(var(--primary)) 0px,
          hsl(var(--primary)) 20px,
          hsl(var(--secondary)) 20px,
          hsl(var(--secondary)) 40px,
          hsl(var(--accent)) 40px,
          hsl(var(--accent)) 60px
        )`
  }} />;
}

// Decorative corner accent
export function CornerAccent({
  position = "top-left",
  className
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const rotations = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90"
  };
  const positions = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0"
  };
  return <div className={cn("pointer-events-none absolute h-16 w-16", positions[position], className)}>
      <svg viewBox="0 0 64 64" fill="none" className={cn("h-full w-full text-primary", rotations[position])}>
        <path d="M0 0H32V4H4V32H0V0Z" fill="currentColor" />
        <path d="M8 8H24V12H12V24H8V8Z" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.4" />
      </svg>
    </div>;
}