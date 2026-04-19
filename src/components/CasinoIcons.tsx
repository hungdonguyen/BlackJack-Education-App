import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SingleChipIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", className = "", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" strokeDasharray="2 3" />
    <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export const ChipStackIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", className = "", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <ellipse cx="12" cy="17" rx="7" ry="2.5" />
    <path d="M5 17v-4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v4" />
    <path d="M5 13V9c0 1.38 3.13 2.5 7 2.5S19 10.38 19 9v4" />
    <ellipse cx="12" cy="9" rx="7" ry="2.5" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

export const BlackjackIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", className = "", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {/* Left Card */}
    <rect x="3" y="6" width="11" height="15" rx="1.5" transform="rotate(-10 3 6)" fill="#1a1a1a" />
    <path d="M7 11c0-1.5 1.5-2.5 3-1v3c-1.5 1.5-3 .5-3-1z" fill="currentColor" opacity="0.6"/>
    
    {/* Right Card */}
    <rect x="10" y="4" width="11" height="15" rx="1.5" fill="#1c1c1c" />
    <path d="M15 9l-1.5 2.5h3L15 9zM15 14v1" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CardSuitsIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", className = "", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 2l2.5 4a3 3 0 0 1-5 0L12 2z" fill="currentColor" opacity="0.8"/>
    <path d="M6 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 0v3" fill="currentColor" opacity="0.8"/>
    <path d="M18 13l-3-4.5L18 4l3 4.5-3 4.5zm0 0v3" fill="currentColor" opacity="0.8"/>
    <path d="M12 14c-2 0-3 1.5-3 3s1 3 3 3 3-1.5 3-3-1-3-3-3zm0 -2v-3" fill="currentColor" opacity="0.8"/>
  </svg>
);

export const CategoryIcon: React.FC<{ category?: string } & IconProps> = ({ category, size = 24, color, style, className }) => {
  switch (category) {
    case 'general': return <BlackjackIcon size={size} color={color} style={style} className={className} />;
    case 'mastery': return <ChipStackIcon size={size} color={color} style={style} className={className} />;
    case 'daily': return <CardSuitsIcon size={size} color={color} style={style} className={className} />;
    case 'variant': return <SingleChipIcon size={size} color={color} style={style} className={className} />;
    case 'store': return <ChipStackIcon size={size} color={color} style={style} className={className} />;
    default: return <SingleChipIcon size={size} color={color} style={style} className={className} />;
  }
};
