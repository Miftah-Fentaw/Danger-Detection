/** Danger Detection logo: a yellow hazard warning sign. Same artwork as public/favicon.svg. */
export function BrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      width={size}
      height={(size * 90) / 100}
      viewBox="0 0 100 90"
      aria-hidden
    >
      <path d="M50 4 96.5 85.5H3.5Z" fill="#FFD400" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 15.5 87 80H13Z" fill="#FFD400" stroke="#111" strokeWidth="7" strokeLinejoin="round" />
      <path className="brand-mark__bang" d="M45.2 34.5a4.8 4.8 0 0 1 9.6 0L53 61a3 3 0 0 1-6 0Z" fill="#111" />
      <circle className="brand-mark__dot" cx="50" cy="70.5" r="4.6" fill="#111" />
    </svg>
  )
}
