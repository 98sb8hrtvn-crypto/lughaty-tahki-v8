import React from 'react';

interface CoverSplashProps {
  onEnter: () => void;
}

export const CoverSplash: React.FC<CoverSplashProps> = ({ onEnter }) => {
  return (
    <div
      id="coverSplash"
      className="coverSplash"
      onClick={onEnter}
      role="button"
      tabIndex={0}
      aria-label="اضغط في أي مكان للدخول"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onEnter();
      }}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <svg
        viewBox="0 0 1600 1060"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: '100vw', maxHeight: '100vh', display: 'block' }}
      >
        <defs>
          {/* Sky & Courtyard Ambient Gradient */}
          <linearGradient id="hdSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7d7e4" />
            <stop offset="35%" stopColor="#e6f4f7" />
            <stop offset="65%" stopColor="#fdfcf7" />
            <stop offset="100%" stopColor="#f3e5ce" />
          </linearGradient>

          <radialGradient id="sunHalo" cx="52%" cy="42%" r="48%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Floor Reflection Gradient */}
          <linearGradient id="courtyardFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8f2e6" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#efe2cc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e2ceae" stopOpacity="1" />
          </linearGradient>

          {/* Rich Gold Gradient for Feather & تحكي */}
          <linearGradient id="hdGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eed08a" />
            <stop offset="45%" stopColor="#d49e43" />
            <stop offset="100%" stopColor="#b0761c" />
          </linearGradient>

          <linearGradient id="hdGoldLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c79c4e" />
            <stop offset="50%" stopColor="#f2dfb3" />
            <stop offset="100%" stopColor="#c99c4c" />
          </linearGradient>

          {/* Deep Teal Gradient */}
          <linearGradient id="hdTeal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14645f" />
            <stop offset="100%" stopColor="#094541" />
          </linearGradient>

          <linearGradient id="hdWaveTeal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#125b58" />
            <stop offset="50%" stopColor="#1c7874" />
            <stop offset="100%" stopColor="#0f5552" />
          </linearGradient>

          {/* Soft Blur for Background Depth of Field */}
          <filter id="bgSoftBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>

          {/* Crisp UI Shadow */}
          <filter id="hdShadow" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#072e2c" floodOpacity="0.22" />
          </filter>

          <filter id="btnShadow" x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#07312f" floodOpacity="0.32" />
          </filter>

          {/* Book Spine Gradients */}
          <linearGradient id="bookGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#569668" />
            <stop offset="50%" stopColor="#326e45" />
            <stop offset="100%" stopColor="#1e4d2d" />
          </linearGradient>

          <linearGradient id="bookBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4189aa" />
            <stop offset="55%" stopColor="#1f5e7c" />
            <stop offset="100%" stopColor="#124057" />
          </linearGradient>

          <linearGradient id="bookRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cf6f53" />
            <stop offset="50%" stopColor="#a8482d" />
            <stop offset="100%" stopColor="#7d2f19" />
          </linearGradient>

          <linearGradient id="woodFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bc7c46" />
            <stop offset="100%" stopColor="#945828" />
          </linearGradient>

          <linearGradient id="woodSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8d5324" />
            <stop offset="100%" stopColor="#693b16" />
          </linearGradient>
        </defs>

        {/* 1. Sky & Soft Sunlit Courtyard Background */}
        <rect width="1600" height="1060" fill="url(#hdSky)" />
        <rect y="640" width="1600" height="420" fill="url(#courtyardFloor)" />
        <circle cx="800" cy="440" r="490" fill="url(#sunHalo)" />

        {/* Subtle Botanical Leaves in Background Left */}
        <g opacity="0.22" fill="#6a9978" filter="url(#bgSoftBlur)">
          <path d="M350,650 C320,580 340,510 380,460 C395,520 385,590 350,650 Z" />
          <path d="M340,650 C295,600 285,540 305,490 C335,535 350,595 340,650 Z" />
          <path d="M365,655 C390,605 425,570 460,555 C435,600 400,635 365,655 Z" />
        </g>

        {/* 2. Right Side School Building & Palm Tree & Saudi Flag */}
        <g filter="url(#bgSoftBlur)" opacity="0.9">
          {/* Distant School Wing */}
          <rect x="1045" y="455" width="210" height="205" fill="#ead6bc" />
          <rect x="1065" y="485" width="25" height="36" fill="#9fb0b3" />
          <rect x="1105" y="485" width="25" height="36" fill="#9fb0b3" />
          <rect x="1065" y="545" width="25" height="36" fill="#9fb0b3" />
          <rect x="1105" y="545" width="25" height="36" fill="#9fb0b3" />

          {/* Middle School Wing */}
          <rect x="1220" y="395" width="240" height="265" fill="#f3dec3" stroke="#dfc3a1" strokeWidth="2" />
          <rect x="1250" y="435" width="32" height="45" fill="#788b8e" />
          <rect x="1300" y="435" width="32" height="45" fill="#788b8e" />
          <rect x="1250" y="510" width="32" height="45" fill="#788b8e" />
          <rect x="1300" y="510" width="32" height="45" fill="#788b8e" />

          {/* Foreground Right School Facade */}
          <polygon points="1380,350 1600,315 1600,665 1380,665" fill="#ebd0b0" stroke="#d5b48e" strokeWidth="2" />
          <polygon points="1370,350 1600,312 1600,335 1370,370" fill="#d9b289" />
          <rect x="1420" y="395" width="38" height="54" rx="3" fill="#5e7275" />
          <rect x="1485" y="388" width="42" height="56" rx="3" fill="#5e7275" />
          <rect x="1420" y="485" width="38" height="54" rx="3" fill="#5e7275" />
          <rect x="1485" y="480" width="42" height="56" rx="3" fill="#5e7275" />

          {/* Palm Tree */}
          <g transform="translate(1195, 455)">
            <path d="M28,60 Q32,130 26,205 L38,205 Q42,130 36,60 Z" fill="#8d6e4c" />
            <path
              d="M32,62 Q-15,35 -35,68 M32,60 Q-10,15 -28,32 M32,58 Q5,0 -8,10 M32,58 Q32,-5 32,-12 M32,58 Q62,0 78,15 M32,60 Q78,20 94,42 M32,62 Q75,45 92,75"
              stroke="#5c8752"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Green Courtyard Hedge */}
          <ellipse cx="1150" cy="655" rx="75" ry="24" fill="#527b47" />
          <ellipse cx="1280" cy="658" rx="95" ry="30" fill="#3e6635" />
          <ellipse cx="1430" cy="660" rx="110" ry="34" fill="#48723e" />
          <ellipse cx="1555" cy="662" rx="85" ry="36" fill="#375c2f" />
        </g>

        {/* Crisp Flagpole & Waving Saudi Flag */}
        <g transform="translate(1235, 245)">
          <line x1="0" y1="0" x2="0" y2="435" stroke="#d5dde0" strokeWidth="7" strokeLinecap="round" />
          <line x1="-2" y1="0" x2="-2" y2="435" stroke="#ffffff" strokeWidth="2" />
          <circle cx="0" cy="-4" r="6" fill="#b0bec5" />
          {/* Flag Cloth */}
          <path
            d="M4,18 C45,10 85,38 132,34 C130,62 122,82 118,96 C75,92 42,68 4,72 Z"
            fill="#166a41"
          />
          <path
            d="M4,18 C45,10 85,38 132,34 C130,48 126,60 123,70 C80,66 45,42 4,46 Z"
            fill="#1c7a4d"
            opacity="0.55"
          />
          {/* Emblem on Flag */}
          <text
            x="64"
            y="55"
            fontFamily="Cairo, Tahoma, sans-serif"
            fontSize="13"
            fontWeight="800"
            fill="#ffffff"
            textAnchor="middle"
            transform="rotate(7, 64, 55)"
          >
            لا إله إلا الله
          </text>
          <line
            x1="42"
            y1="64"
            x2="86"
            y2="69"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* 3. Top Left: Ministry of Education Official Emblem */}
        <g transform="translate(95, 52)">
          <g fill="#167c79">
            {/* Left Wing Dots */}
            <circle cx="42" cy="18" r="5.5" />
            <circle cx="60" cy="22" r="5.5" />
            <circle cx="78" cy="27" r="5.5" />
            <circle cx="96" cy="33" r="5" />
            <circle cx="112" cy="40" r="4.5" />

            <circle cx="36" cy="35" r="5.5" />
            <circle cx="54" cy="38" r="5.5" />
            <circle cx="72" cy="43" r="5" />
            <circle cx="90" cy="48" r="4.5" />
            <circle cx="107" cy="54" r="4" />

            <circle cx="36" cy="52" r="5" />
            <circle cx="54" cy="55" r="5" />
            <circle cx="72" cy="58" r="4.5" />
            <circle cx="90" cy="62" r="4" />

            {/* Center Dot */}
            <circle cx="128" cy="49" r="4.8" />

            {/* Right Wing Dots */}
            <circle cx="214" cy="18" r="5.5" />
            <circle cx="196" cy="22" r="5.5" />
            <circle cx="178" cy="27" r="5.5" />
            <circle cx="160" cy="33" r="5" />
            <circle cx="144" cy="40" r="4.5" />

            <circle cx="220" cy="35" r="5.5" />
            <circle cx="202" cy="38" r="5.5" />
            <circle cx="184" cy="43" r="5" />
            <circle cx="166" cy="48" r="4.5" />
            <circle cx="149" cy="54" r="4" />

            <circle cx="220" cy="52" r="5" />
            <circle cx="202" cy="55" r="5" />
            <circle cx="184" cy="58" r="4.5" />
            <circle cx="166" cy="62" r="4" />
          </g>
          <text
            x="128"
            y="105"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="35"
            fontWeight="800"
            fill="#166e6b"
            textAnchor="middle"
          >
            وزارة التعليم
          </text>
          <text
            x="128"
            y="134"
            fontFamily="Arial, sans-serif"
            fontSize="20"
            fontWeight="600"
            fill="#3b6769"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            Ministry of Education
          </text>
        </g>

        {/* 4. Top Right: School Badge (متوسطة الخندق بالقريات) */}
        <g transform="translate(1010, 48)" filter="url(#hdShadow)">
          <rect
            x="0"
            y="0"
            width="550"
            height="84"
            rx="42"
            fill="#fbf8ef"
            stroke="#3a6663"
            strokeWidth="2.8"
          />
          <text
            x="240"
            y="53"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="32"
            fontWeight="800"
            fill="#134c49"
            textAnchor="middle"
          >
            متوسطة الخندق بالقريات
          </text>
          {/* Detailed School Building Icon */}
          <g transform="translate(456, 8)" fill="#134c49">
            <line x1="38" y1="0" x2="38" y2="12" stroke="#134c49" strokeWidth="3" />
            <polygon points="38,0 53,5 38,10" />
            <polygon points="38,10 12,28 64,28" />
            <rect x="16" y="28" width="44" height="38" rx="2" />
            <rect x="2" y="36" width="14" height="30" rx="1" />
            <rect x="60" y="36" width="14" height="30" rx="1" />
            <rect x="32" y="48" width="12" height="18" rx="4" fill="#fbf8ef" />
            <rect x="21" y="33" width="7" height="8" fill="#fbf8ef" />
            <rect x="35" y="33" width="7" height="8" fill="#fbf8ef" />
            <rect x="48" y="33" width="7" height="8" fill="#fbf8ef" />
            <rect x="6" y="42" width="6" height="7" fill="#fbf8ef" />
            <rect x="64" y="42" width="6" height="7" fill="#fbf8ef" />
          </g>
        </g>

        {/* 5. Centerpiece Master Logo: لُغتي تحكي */}
        <g transform="translate(800, 395)">
          {/* Left Botanical Leaves */}
          <path
            d="M-275,38 C-335,-18 -330,-95 -318,-142 C-270,-98 -252,-32 -275,38 Z"
            fill="#125e5a"
          />
          <path
            d="M-248,58 C-260,12 -240,-32 -212,-58 C-210,-15 -224,30 -248,58 Z"
            fill="#247c77"
          />
          <path
            d="M-270,108 C-318,70 -334,25 -325,-10 C-292,18 -270,62 -270,108 Z"
            fill="url(#hdGold)"
          />

          {/* Main Arabic Title: لُغتي */}
          <text
            x="-45"
            y="-18"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="152"
            fontWeight="900"
            fill="#0d524e"
            textAnchor="middle"
          >
            لُغتي
          </text>

          {/* Second Word: تحكي */}
          <text
            x="-48"
            y="102"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="122"
            fontWeight="900"
            fill="url(#hdGold)"
            textAnchor="middle"
          >
            تحكي
          </text>

          {/* Detailed Golden Feather Quill on the Right */}
          <g transform="translate(182, -25) rotate(23)">
            <path
              d="M0,135 C-55,30 -42,-115 36,-235 C82,-115 62,30 0,135 Z"
              fill="url(#hdGold)"
            />
            {/* Quill Vane Notches */}
            <path
              d="M25,-150 L54,-165 M32,-95 L62,-108 M30,-35 L58,-48 M22,18 L48,8 M-24,-105 L-48,-118 M-30,-45 L-54,-58 M-26,15 L-48,4"
              stroke="#fdf7eb"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Central Shaft */}
            <path
              d="M-2,155 Q4,-20 28,-215"
              stroke="#fff8ea"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Stylized Open Book Swooshes Under Logo */}
          <path
            d="M-285,168 Q-135,142 0,192 Q135,142 285,168 L302,204 Q142,178 0,206 Q-142,178 -302,204 Z"
            fill="#186b65"
          />
          <path
            d="M-248,140 Q-118,116 0,180 Q-122,140 -260,156 Z"
            fill="url(#hdGold)"
          />
          <path
            d="M248,140 Q118,116 0,180 Q122,140 260,156 Z"
            fill="url(#hdGold)"
          />
          <path
            d="M232,108 Q125,92 25,164 Q130,115 242,126 Z"
            fill="url(#hdGold)"
          />
          <path
            d="M215,78 Q145,70 85,112 Q150,86 222,94 Z"
            fill="#145c58"
          />

          {/* Subtitle: بالعلم ... نُبني المستقبل */}
          <line x1="-265" y1="255" x2="-195" y2="255" stroke="#1d6560" strokeWidth="3" strokeLinecap="round" />
          <text
            x="0"
            y="265"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="33"
            fontWeight="800"
            fill="#104c49"
            textAnchor="middle"
          >
            بالعلم ... نُبني المستقبل
          </text>
          <line x1="195" y1="255" x2="265" y2="255" stroke="#1d6560" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* 6. Left Side 3D Stack of Books & Wooden Pencil Cup */}
        <g transform="translate(0, 365)" filter="url(#hdShadow)">
          {/* Bottom Green Book */}
          <rect x="75" y="290" width="278" height="78" rx="16" fill="url(#bookGreen)" />
          <rect x="60" y="300" width="148" height="58" rx="6" fill="#ede0c6" stroke="#c9b48e" strokeWidth="1.5" />
          <line x1="68" y1="315" x2="198" y2="315" stroke="#cbb894" strokeWidth="2" />
          <line x1="68" y1="329" x2="198" y2="329" stroke="#cbb894" strokeWidth="2" />
          <line x1="68" y1="343" x2="198" y2="343" stroke="#cbb894" strokeWidth="2" />
          <rect x="252" y="290" width="16" height="78" fill="#d4a857" />
          <rect x="288" y="290" width="16" height="78" fill="#d4a857" />

          {/* Middle Red/Rust Book */}
          <rect x="28" y="218" width="295" height="74" rx="14" fill="url(#bookRed)" />
          <rect x="40" y="228" width="268" height="54" rx="6" fill="#f3e7d0" stroke="#cfba95" strokeWidth="1.5" />
          <line x1="52" y1="244" x2="295" y2="244" stroke="#d5c29f" strokeWidth="2" />
          <line x1="52" y1="258" x2="295" y2="258" stroke="#d5c29f" strokeWidth="2" />

          {/* Upper Blue Book */}
          <rect x="15" y="144" width="290" height="75" rx="16" fill="url(#bookBlue)" />
          <rect x="235" y="144" width="15" height="75" fill="#5da3c5" opacity="0.6" />
          <rect x="265" y="144" width="12" height="75" fill="#5da3c5" opacity="0.4" />

          {/* Top Green Book */}
          <rect x="-10" y="75" width="260" height="70" rx="14" fill="url(#bookGreen)" />
          <rect x="160" y="75" width="16" height="70" fill="#d4a857" />
          <rect x="195" y="75" width="16" height="70" fill="#d4a857" />

          {/* Wooden Pencil Holder & Pencils */}
          <g transform="translate(0, 115)">
            {/* Yellow Pencil */}
            <g transform="translate(44, -30) rotate(-12)">
              <rect x="0" y="0" width="17" height="115" fill="#e0a23a" />
              <rect x="5" y="0" width="6" height="115" fill="#f0b954" />
              <polygon points="0,0 17,0 8.5,-26" fill="#f4d7a7" />
              <polygon points="5,-15 12,-15 8.5,-26" fill="#2c3e50" />
            </g>
            {/* Blue Pencil */}
            <g transform="translate(76, -12) rotate(13)">
              <rect x="0" y="0" width="17" height="115" fill="#2b83bd" />
              <rect x="5" y="0" width="6" height="115" fill="#4aa0d8" />
              <polygon points="0,0 17,0 8.5,-25" fill="#f4d7a7" />
              <polygon points="5,-14 12,-14 8.5,-25" fill="#1b4f72" />
            </g>
            {/* Green Pen */}
            <g transform="translate(108, -18) rotate(22)">
              <rect x="0" y="0" width="18" height="115" rx="3" fill="#1e7b4e" />
              <rect x="0" y="15" width="18" height="6" fill="#d4af37" />
              <polygon points="2,0 16,0 9,-24" fill="#d5b57d" />
            </g>
            {/* Wooden Box */}
            <polygon points="0,82 96,82 96,278 0,260" fill="url(#woodFront)" />
            <polygon points="96,82 130,68 130,255 96,278" fill="url(#woodSide)" />
            <polygon points="0,82 34,68 130,68 96,82" fill="#d1925c" />
          </g>
        </g>

        {/* 7. Center Interactive Enter Button: دخول ← */}
        <g transform="translate(604, 704)" filter="url(#btnShadow)">
          <rect x="-6" y="-6" width="404" height="118" rx="59" fill="#ffffff" opacity="0.92" />
          <rect
            x="0"
            y="0"
            width="392"
            height="106"
            rx="53"
            fill="url(#hdTeal)"
            stroke="#ffffff"
            strokeWidth="3.5"
          />
          <text
            x="168"
            y="68"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="46"
            fontWeight="800"
            fill="#ffffff"
            textAnchor="middle"
          >
            دخول
          </text>
          {/* Right Arrow */}
          <g
            transform="translate(292, 53)"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <line x1="-22" y1="0" x2="18" y2="0" />
            <polyline points="2,-16 18,0 2,16" />
          </g>
        </g>

        {/* 8. Bottom Sweeping Golden & Teal Waves */}
        <path
          d="M0,720 Q400,885 800,868 Q1200,850 1600,708 L1600,1060 L0,1060 Z"
          fill="url(#hdGoldLight)"
        />
        <path
          d="M0,762 Q400,915 800,892 Q1200,868 1600,738 L1600,1060 L0,1060 Z"
          fill="url(#hdWaveTeal)"
        />

        {/* 9. Bottom Left Card: إعداد وتنفيذ المعلم / مساعد سليمان الصخري */}
        <g transform="translate(22, 896)" filter="url(#hdShadow)">
          <rect x="0" y="0" width="446" height="126" rx="40" fill="#fbf9f0" />
          <text
            x="202"
            y="53"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="26"
            fontWeight="800"
            fill="#124b48"
            textAnchor="middle"
          >
            إعــــداد وتنفيــــذ :
          </text>
          <text
            x="202"
            y="95"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="25"
            fontWeight="800"
            fill="#124b48"
            textAnchor="middle"
          >
            المعلم / مساعد سليمان الصخري
          </text>
          {/* Teacher at Whiteboard Icon */}
          <g transform="translate(30, 26)" fill="#124b48">
            <rect
              x="26"
              y="2"
              width="52"
              height="36"
              rx="4"
              fill="none"
              stroke="#124b48"
              strokeWidth="4"
            />
            <circle cx="16" cy="22" r="10" />
            <path d="M2,70 C2,45 32,45 32,70 Z" />
            <line
              x1="26"
              y1="44"
              x2="48"
              y2="24"
              stroke="#124b48"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* 10. Bottom Right Card: مدير المدرسة / ضيف الله عوض العنزي */}
        <g transform="translate(1142, 896)" filter="url(#hdShadow)">
          <rect x="0" y="0" width="436" height="126" rx="40" fill="#fbf9f0" />
          <text
            x="185"
            y="53"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="26"
            fontWeight="800"
            fill="#124b48"
            textAnchor="middle"
          >
            مدير المدرسة /
          </text>
          <text
            x="185"
            y="95"
            fontFamily="Cairo, Tajawal, Tahoma, sans-serif"
            fontSize="26"
            fontWeight="800"
            fill="#124b48"
            textAnchor="middle"
          >
            ضيف الله عوض العنزي
          </text>
          {/* Principal Icon */}
          <g transform="translate(338, 18)" fill="#124b48">
            <circle cx="32" cy="18" r="14" />
            <path d="M4,78 C4,46 60,46 60,78 Z" />
            <polygon points="27,44 37,44 35,68 29,68" fill="#fbf9f0" />
            <polygon points="30,46 34,46 33,65 31,65" fill="#124b48" />
          </g>
        </g>
      </svg>
    </div>
  );
};
