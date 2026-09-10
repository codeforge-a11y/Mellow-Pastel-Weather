import React from 'react';

interface WeatherIconProps {
  code: number;
  isDay: boolean;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ code, isDay, size = 64, className = "" }) => {
  const cloud = (x: number, y: number, s: number, o = 1) => (
    <g opacity={o} style={{ animation: "drift 4s ease-in-out infinite" }}>
      <path
        d={`M${x} ${y + 14} a${9 * s} ${9 * s} 0 0 1 ${2 * s} ${-17.5 * s} A${12 * s} ${12 * s} 0 0 1 ${64 * s} ${-4 * s} A${8.5 * s} ${8.5 * s} 0 0 1 ${58 * s} ${14 * s} Z`}
        transform={`translate(${-8 * s} 0)`}
        fill="white"
        stroke="#D9CFE8"
        strokeWidth="2"
      />
    </g>
  );

  let innerContent: React.ReactNode = null;

  if (code === 0) {
    innerContent = isDay ? (
      <>
        <g style={{ transformOrigin: "center", animation: "spin 20s linear infinite" }} stroke="#E9A93F" strokeWidth="2.6" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="52" x2="32" y2="58" />
          <line x1="6" y1="32" x2="12" y2="32" />
          <line x1="52" y1="32" x2="58" y2="32" />
          <line x1="13.6" y1="13.6" x2="17.8" y2="17.8" />
          <line x1="46.2" y1="46.2" x2="50.4" y2="50.4" />
          <line x1="13.6" y1="50.4" x2="17.8" y2="46.2" />
          <line x1="46.2" y1="17.8" x2="50.4" y2="13.6" />
        </g>
        <circle cx="32" cy="32" r="12" fill="#FFD66B" stroke="#fff" strokeWidth="3" />
      </>
    ) : (
      <>
        <circle cx="32" cy="30" r="12" fill="#F5EFD6" stroke="#fff" strokeWidth="2.5" />
        <circle cx="37" cy="27" r="10" fill="#4B4B5E" opacity=".9" />
        <g fill="white" opacity="0.8">
          <circle cx="14" cy="14" r="1.6" />
          <circle cx="50" cy="12" r="1.3" />
          <circle cx="54" cy="44" r="1.6" />
          <circle cx="10" cy="46" r="1.2" />
        </g>
      </>
    );
  } else if (code === 1) {
    innerContent = isDay ? (
      <>
        <circle cx="24" cy="24" r="10" fill="#FFD66B" stroke="#fff" strokeWidth="2.5" />
        {cloud(20, 30, 0.85)}
      </>
    ) : (
      <>
        <circle cx="24" cy="22" r="9" fill="#F5EFD6" stroke="#fff" strokeWidth="2" />
        <circle cx="28" cy="20" r="7" fill="#4B4B5E" opacity=".85" />
        {cloud(20, 30, 0.85)}
      </>
    );
  } else if (code === 2) {
    innerContent = isDay ? (
      <>
        <circle cx="23" cy="22" r="9" fill="#FFD66B" stroke="#fff" strokeWidth="2.5" />
        {cloud(18, 30, 0.95)}
      </>
    ) : (
      <>
        <circle cx="23" cy="21" r="8" fill="#F5EFD6" stroke="#fff" strokeWidth="2" />
        {cloud(18, 30, 0.95)}
      </>
    );
  } else if (code === 3) {
    innerContent = (
      <>
        {cloud(10, 18, 0.8, 0.7)}
        {cloud(18, 30, 1)}
      </>
    );
  } else if (code === 45 || code === 48) {
    innerContent = (
      <>
        {cloud(18, 22, 1)}
        <g stroke="#B9B3D0" strokeWidth="2.4" strokeLinecap="round">
          <line x1="18" y1="50" x2="46" y2="50" />
          <line x1="22" y1="55" x2="42" y2="55" />
        </g>
      </>
    );
  } else if ([51, 53, 55, 56, 57].includes(code)) {
    innerContent = (
      <>
        {cloud(18, 22, 1)}
        <g fill="#7AA0C4">
          <circle cx="26" cy="50" r="2" />
          <circle cx="33" cy="52" r="2" />
          <circle cx="40" cy="50" r="2" />
        </g>
      </>
    );
  } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    innerContent = (
      <>
        {cloud(18, 20, 1)}
        <g stroke="#5E9AC4" strokeWidth="2.6" strokeLinecap="round">
          <line x1="25" y1="47" x2="23" y2="53" />
          <line x1="32" y1="47" x2="30" y2="53" />
          <line x1="39" y1="47" x2="37" y2="53" />
        </g>
      </>
    );
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    innerContent = (
      <>
        {cloud(18, 20, 1)}
        <g fill="#8FA8C8" fontSize="10" fontWeight="900" textAnchor="middle">
          <text x="25" y="53">✻</text>
          <text x="33" y="55">✻</text>
          <text x="41" y="53">✻</text>
        </g>
      </>
    );
  } else {
    innerContent = (
      <>
        {cloud(18, 18, 1)}
        <path
          d="M34 44l-7 11h5l-3 8 11-13h-5l4-6h-5Z"
          fill="#FFD66B"
          stroke="#E9A93F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {innerContent}
    </svg>
  );
};
