import { useId } from 'react';

export default function BrandMark({ size = 40, className, style }) {
  const reactId = useId();
  const gradientId = `indus-mark-gradient-${reactId.replace(/:/g, '')}`;

  return (
    <svg
      className={className}
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="4" x2="43" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20B77A" />
          <stop offset="1" stopColor="#07553E" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="15" fill={`url(#${gradientId})`} />
      <path d="M24 8.5v4" stroke="#F5D887" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="17" r="4.5" fill="#F5D887" />
      <path d="M10 27c4.2-3.5 8.7-3.5 14 0s9.8 3.5 14 0" fill="none" stroke="#F4FFF8" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 33c4.2-3.5 8.7-3.5 14 0s9.8 3.5 14 0" fill="none" stroke="#D9F5E5" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M14 39c3-2.2 6.2-2.2 10 0s7 2.2 10 0" fill="none" stroke="#B8E9CC" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
