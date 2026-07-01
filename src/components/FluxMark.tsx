import React from 'react';

export function FluxMark({size = 26}: {size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{display: 'block', borderRadius: size * 0.23}}
      aria-hidden="true">
      <rect
        width="64"
        height="64"
        rx="14"
        fill="var(--surface-3)"
        stroke="var(--synthesis-border)"
        strokeWidth="1.5"
      />
      <path
        d="M37 12 L20 35 L31 35 L27 52 L45 28 L34 28 Z"
        fill="var(--synthesis)"
        stroke="var(--research)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
