// Base64 encoded SVG fallback images for Instagram posts

// Simple carousel icon on a gradient background
export const CAROUSEL_FALLBACK_SVG = `data:image/svg+xml;base64,${btoa(`
<svg width="640" height="640" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="640" fill="url(#gradient)" />
  <g transform="translate(220, 220)">
    <rect x="0" y="0" width="200" height="200" rx="20" fill="white" opacity="0.9" />
    <path d="M50 40H150C155.523 40 160 44.4772 160 50V150C160 155.523 155.523 160 150 160H50C44.4772 160 40 155.523 40 150V50C40 44.4772 44.4772 40 50 40Z" fill="#0ea5e9" />
    <rect x="60" y="60" width="80" height="80" rx="10" fill="white" />
    <path d="M70 75H130M70 100H130M70 125H130" stroke="#0ea5e9" stroke-width="8" stroke-linecap="round" />
  </g>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="640" y2="640" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0ea5e9" />
      <stop offset="1" stop-color="#1e293b" />
    </linearGradient>
  </defs>
</svg>
`)}`;

// Simple video icon on a gradient background
export const VIDEO_FALLBACK_SVG = `data:image/svg+xml;base64,${btoa(`
<svg width="640" height="640" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="640" fill="url(#gradient)" />
  <g transform="translate(220, 220)">
    <circle cx="100" cy="100" r="100" fill="white" opacity="0.9" />
    <path d="M160 100L70 150V50L160 100Z" fill="#0ea5e9" />
  </g>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="640" y2="640" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0ea5e9" />
      <stop offset="1" stop-color="#1e293b" />
    </linearGradient>
  </defs>
</svg>
`)}`; 