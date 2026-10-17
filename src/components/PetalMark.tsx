import React from 'react'

export function PetalMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="pg" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffd9ee" />
          <stop offset="55%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
      </defs>
      <g fill="url(#pg)" opacity="0.95">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="32" cy="17" rx="9" ry="15" transform={`rotate(${a} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="7" fill="#fff4fa" />
    </svg>
  )
}

export default PetalMark
