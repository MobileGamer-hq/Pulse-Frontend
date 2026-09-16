import React from 'react';
import pulseLogoUrl from '../../assets/pulse-logo.png';

export interface PulseLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  withText?: boolean;
  textClassName?: string;
  subtext?: string;
  showSubtext?: boolean;
  alt?: string;
}

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

export const PulseLogo: React.FC<PulseLogoProps> = ({
  size = 'md',
  className = '',
  withText = false,
  textClassName = '',
  subtext = 'by Epicordia',
  showSubtext = true,
  alt = 'Pulse Logo'
}) => {
  const isPreset = typeof size === 'string' && size in sizeMap;
  const dimensionClass = isPreset ? sizeMap[size as keyof typeof sizeMap] : '';
  const inlineStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  const imageElement = (
    <img
      src={pulseLogoUrl}
      alt={alt}
      style={inlineStyle}
      className={`object-contain rounded-full shrink-0 select-none ${dimensionClass} ${className}`}
      draggable={false}
    />
  );

  if (!withText) {
    return imageElement;
  }

  return (
    <div className="flex items-center gap-2.5">
      {imageElement}
      <div className={textClassName}>
        <span className="font-extrabold text-base tracking-tight block leading-tight text-neutral-900 dark:text-neutral-100">
          Pulse
        </span>
        {showSubtext && (
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
