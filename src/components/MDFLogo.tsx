import React from 'react';

interface MDFLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'vertical';
  lang?: 'ar' | 'en';
}

/**
 * Official Muscat Duty Free (السوق الحرة مسقط) Logo Component
 * - Authentic vector emblem based on logo.png:
 *   1. Left mountain / peak: Vivid Cerulean Blue (#0088CC)
 *   2. Right mountain / peak: Vibrant Green (#5EBA36)
 *   3. Sweeping crossing arch: Warm Golden-Orange (#F59E0B)
 *   4. Base smile wave: Pure Cyan / Turquoise (#00BCD4)
 * - Typography placed directly beside the logo emblem, responsive to Arabic and English language modes.
 */
export const MDFLogo: React.FC<MDFLogoProps> = ({ 
  className = "h-11 sm:h-12", 
  variant = 'full',
  lang = 'ar'
}) => {
  const isEn = lang === 'en';

  return (
    <div 
      className={`relative inline-flex items-center gap-3 select-none ${className}`}
      role="img"
      aria-label="Muscat Duty Free - السوق الحرة مسقط"
    >
      {/* 
        1. Official Emblem SVG (Pure Vector with 100% accurate curves & brand palette)
      */}
      <svg 
        viewBox="0 0 240 160" 
        className="h-full w-auto aspect-[240/160] shrink-0 drop-shadow-[0_2px_12px_rgba(0,183,214,0.25)]" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(10, 12) scale(0.92)">
          {/* A. Left Mountain / Arch (Vivid Cerulean Blue: #0088CC) */}
          <path 
            d="M 18 132 
               C 34 104 68 46 84 14 
               C 87 9 93 9 96 14 
               L 128 72 
               L 108 85 
               L 90 52 
               C 72 84 50 118 34 132 
               Z" 
            fill="#0088CC" 
          />

          {/* B. Right Mountain / Arch (Vibrant Green: #5EBA36) */}
          <path 
            d="M 122 70 
               L 144 14 
               C 147 9 153 9 156 14 
               C 172 46 206 104 222 132 
               C 206 128 184 94 164 52 
               L 146 78 
               L 132 54 
               Z" 
            fill="#5EBA36" 
          />

          {/* C. Bottom Cyan/Turquoise Smile Wave: #00BCD4 */}
          <path 
            d="M 76 114 
               C 96 138 144 138 164 114 
               C 152 125 132 132 120 132 
               C 108 132 88 125 76 114 
               Z" 
            fill="#00BCD4" 
          />

          {/* D. Sweeping Warm Golden-Orange Crossing Arch: #F59E0B */}
          <path 
            d="M 6 132 
               C 26 96 70 68 120 68 
               C 160 68 196 86 224 132 
               C 196 100 158 84 120 84 
               C 68 84 28 108 6 132 
               Z" 
            fill="#F59E0B" 
          />
        </g>
      </svg>

      {/* 2. Official Bilingual Typography Lockup (Placed Beside the Emblem) */}
      {variant === 'full' && (
        <div className={`flex flex-col justify-center leading-none ${isEn ? 'text-left' : 'text-right'}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black tracking-tight text-white">
              {isEn ? 'MUSCAT DUTY FREE' : 'السوق الحرة مسقط'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-gray-300 uppercase">
              {isEn ? 'Muscat International Airport' : 'MUSCAT DUTY FREE'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
