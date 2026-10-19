export const SPLASH_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d5c63"/>
      <stop offset="50%" stop-color="#157a80"/>
      <stop offset="100%" stop-color="#249685"/>
    </linearGradient>
    <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe28a"/>
      <stop offset="100%" stop-color="#f5a623"/>
    </linearGradient>
    <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fffdf7"/>
      <stop offset="100%" stop-color="#efeada"/>
    </linearGradient>
    <linearGradient id="pageRight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#efeada"/>
      <stop offset="100%" stop-color="#fffdf7"/>
    </linearGradient>
  </defs>

  <!-- Background Banner -->
  <rect width="800" height="320" rx="28" fill="url(#sky)"/>

  <!-- Subtle Islamic Geometric Stars / Pattern -->
  <g opacity="0.12" fill="#ffffff">
    <circle cx="90" cy="70" r="45"/>
    <circle cx="710" cy="65" r="55"/>
    <circle cx="120" cy="260" r="65"/>
    <circle cx="690" cy="250" r="50"/>
    <polygon points="400,15 412,42 442,42 418,60 427,88 400,70 373,88 382,60 358,42 388,42"/>
  </g>

  <!-- Glowing Sun/Moon Arch -->
  <circle cx="400" cy="185" r="115" fill="url(#goldGlow)" opacity="0.22"/>
  <circle cx="400" cy="185" r="88" fill="#ffffff" opacity="0.12"/>

  <!-- Floating Arabic Letters -->
  <g font-family="Tahoma, Arial, sans-serif" font-weight="bold" fill="#ffe49e" opacity="0.9">
    <circle cx="215" cy="95" r="28" fill="#ffffff" opacity="0.15"/>
    <text x="215" y="107" font-size="34" text-anchor="middle" fill="#ffdf85">ض</text>

    <circle cx="585" cy="95" r="28" fill="#ffffff" opacity="0.15"/>
    <text x="585" y="106" font-size="30" text-anchor="middle" fill="#ffdf85">أ ب</text>

    <circle cx="155" cy="185" r="24" fill="#ffffff" opacity="0.14"/>
    <text x="155" y="195" font-size="26" text-anchor="middle" fill="#e8fbf8">قلم</text>

    <circle cx="645" cy="185" r="24" fill="#ffffff" opacity="0.14"/>
    <text x="645" y="195" font-size="24" text-anchor="middle" fill="#e8fbf8">بيان</text>
  </g>

  <!-- Open Book Illustration -->
  <g transform="translate(0, 12)">
    <!-- Book Cover Base -->
    <path d="M250,235 Q325,215 400,238 Q475,215 550,235 L560,248 Q475,230 400,252 Q325,230 240,248 Z" fill="#f7b832"/>
    <!-- Left Page -->
    <path d="M260,135 Q330,120 400,145 L400,235 Q330,212 260,228 Z" fill="url(#pageLeft)" stroke="#d9d2c5" stroke-width="2"/>
    <!-- Right Page -->
    <path d="M400,145 Q470,120 540,135 L540,228 Q470,212 400,235 Z" fill="url(#pageRight)" stroke="#d9d2c5" stroke-width="2"/>
    <!-- Page Lines Left -->
    <line x1="285" y1="160" x2="375" y2="170" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
    <line x1="285" y1="180" x2="375" y2="190" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
    <line x1="285" y1="200" x2="355" y2="208" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
    <!-- Page Lines Right -->
    <line x1="515" y1="160" x2="425" y2="170" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
    <line x1="515" y1="180" x2="425" y2="190" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
    <line x1="515" y1="200" x2="445" y2="208" stroke="#99b3b5" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Golden Quill / Feather Pen rising from book -->
  <g transform="translate(400, 115) rotate(-18)">
    <path d="M0,40 C-18,5 -12,-35 22,-65 C30,-30 18,10 0,40 Z" fill="url(#goldGlow)"/>
    <path d="M0,45 L0,-55" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <!-- Sparkles -->
  <g fill="#ffe28a">
    <circle cx="330" cy="70" r="5"/>
    <circle cx="475" cy="75" r="4"/>
    <circle cx="290" cy="115" r="3.5"/>
    <circle cx="515" cy="115" r="4.5"/>
  </g>
</svg>
`);
