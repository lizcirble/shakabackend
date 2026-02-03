import { cn } from "@/lib/utils";
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// Global South Logo - Bantu shield with crossed spears
export function DataRandLogo({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      {/* Left spear */}
      <path d="M8 4L12 14L8 16L12 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4L5 10L8 12L12 4" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      
      {/* Right spear */}
      <path d="M40 4L36 14L40 16L36 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 4L43 10L40 12L36 4" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      
      {/* Central Bantu shield */}
      <path d="M24 8C18 8 14 14 14 22C14 32 20 40 24 42C28 40 34 32 34 22C34 14 30 8 24 8Z" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2.5" />
      
      {/* Shield geometric pattern - Global South symbol */}
      <path d="M24 12L28 18L24 24L20 18L24 12Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.3" />
      <path d="M24 24L28 30L24 36L20 30L24 24Z" stroke="currentColor" strokeWidth="1.5" />
      {/* Center dot representing unity */}
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      
      {/* Africa + India connection lines */}
      <path d="M20 24H28" stroke="currentColor" strokeWidth="1.5" />
    </svg>;
}

// Compute/Power icon - circuit pattern with power symbol
export function ComputeIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      {/* Circuit pattern */}
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {/* Power indicator dots */}
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
      <circle cx="17" cy="17" r="1" fill="currentColor" />
    </svg>;
}

// Adinkra-inspired: Dwennimmen (Ram's Horns) - Symbol of strength
export function StrengthIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 8C4 8 4 4 8 4C12 4 12 8 12 8C12 8 12 4 16 4C20 4 20 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 8C4 12 8 16 12 16C16 16 20 12 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16V20M16 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>;
}

// Adinkra-inspired: Akoma (Heart) - Symbol of patience
export function HeartIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M12 6L10 4C8 2 4 2 4 6C4 10 12 18 12 18C12 18 20 10 20 6C20 2 16 2 14 4L12 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10L14 12L12 14L10 12L12 10Z" fill="currentColor" />
    </svg>;
}

// Spear Claw Mark - for accents
export function ClawMark({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M6 4L10 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 4L12 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 4L14 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>;
}

// Task icon - geometric diamond with inner pattern (Ndebele inspired)
export function TaskIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6L18 12L12 18L6 12L12 6Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>;
}

// Earnings icon - stacked geometric coins
export function EarningsIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 16L12 20L20 16L12 12L4 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 12L12 16L20 12L12 8L4 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 8L12 12L20 8L12 4L4 8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>;
}

// Shield icon - African Bantu shield shape
export function ShieldIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M12 2C8 2 5 6 5 11C5 17 10 21 12 22C14 21 19 17 19 11C19 6 16 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 6L15 10L12 14L9 10L12 6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 14V20" stroke="currentColor" strokeWidth="1.5" />
    </svg>;
}

// Notification bell with African pattern
export function NotificationIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M12 3C8 3 6 6 6 9V14L4 16V17H20V16L18 14V9C18 6 16 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 9L12 7L14 9L12 11L10 9Z" fill="currentColor" />
      <path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>;
}

// Work/Briefcase with tribal pattern
export function WorkIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12H17" stroke="currentColor" strokeWidth="2" />
      <path d="M10 12V17" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 12V17" stroke="currentColor" strokeWidth="1.5" />
    </svg>;
}

// User/Profile with spear crown
export function UserIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      {/* Spear points crown */}
      <path d="M7 7L9 2L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 7L12 1L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 7L15 2L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21C4 17.5 7.5 15 12 15C16.5 15 20 17.5 20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>;
}

// Lightning/Power - for energy/activity
export function PowerIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>;
}

// Image labeling icon - eye with geometric frame
export function ImageLabelIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 4H8M4 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4H16M20 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 20H8M4 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20H16M20 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="12" rx="6" ry="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>;
}

// Audio transcription - sound waves with geometric styling
export function AudioIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M6 12C6 8 8.5 4 12 4C15.5 4 18 8 18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8L14 12L12 16L10 12L12 8Z" fill="currentColor" />
      <path d="M8 18C8 16 10 14 12 14C14 14 16 16 16 18V20H8V18Z" stroke="currentColor" strokeWidth="2" />
    </svg>;
}

// AI evaluation - brain with geometric pattern
export function AIIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M12 4C8 4 5 7 5 11C5 13 6 15 8 16V20H16V16C18 15 19 13 19 11C19 7 16 4 12 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 9L12 6L15 9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13L12 10L15 13" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
    </svg>;
}

// Checkmark with tribal styling
export function CheckIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 12L10 18L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="20" cy="6" r="1.5" fill="currentColor" />
    </svg>;
}

// Education/School - book with geometric pattern
export function EducationIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M2 10L12 5L22 10L12 15L2 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 12V17C6 17 9 20 12 20C15 20 18 17 18 17V12" stroke="currentColor" strokeWidth="2" />
      <path d="M22 10V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="17" r="1.5" fill="currentColor" />
    </svg>;
}

// Arrow with spear styling
export function ArrowRightIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 8L20 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12L18 10V14L20 12Z" fill="currentColor" />
    </svg>;
}

// Clock icon with tribal accents
export function ClockIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Decorative dots */}
      <circle cx="12" cy="3" r="1" fill="currentColor" />
      <circle cx="21" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="21" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
    </svg>;
}

// Search icon with tribal frame
export function SearchIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 8L13 11L11 14L9 11L11 8Z" stroke="currentColor" strokeWidth="1" />
    </svg>;
}

// Refresh icon
export function RefreshIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 12C4 7.58 7.58 4 12 4C15.37 4 18.26 6.11 19.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 12C20 16.42 16.42 20 12 20C8.63 20 5.74 17.89 4.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 9H20V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15H4V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

// Global South icon - Africa + India connection
export function GlobalSouthIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      {/* Globe outline */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      {/* Horizontal line */}
      <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" />
      {/* Vertical curve */}
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="1.5" />
      {/* Africa marker */}
      <circle cx="10" cy="14" r="2" fill="currentColor" />
      {/* India marker */}
      <circle cx="16" cy="11" r="2" fill="currentColor" />
      {/* Connection */}
      <path d="M10 14L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

// Children/Education impact icon
export function ChildrenIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      {/* Two children silhouettes */}
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C4 16 6 14 8 14C10 14 11 15 12 15C13 15 14 14 16 14C18 14 20 16 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Book/education symbol */}
      <path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>;
}

// Wallet icon
export function WalletIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="14" r="2" fill="currentColor" />
      <path d="M7 6V4C7 3 8 2 9 2H15C16 2 17 3 17 4V6" stroke="currentColor" strokeWidth="2" />
    </svg>;
}

// Trending up icon
export function TrendingIcon({
  size = 24,
  className,
  ...props
}: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)} {...props}>
      <path d="M4 16L8 12L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}