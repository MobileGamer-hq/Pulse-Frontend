import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
  allowColorChange?: boolean;
  onColorChange?: (newColor: string) => void;
  onClick?: () => void;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#EA580C', // Orange
  '#D97706', // Amber
  '#059669', // Emerald
  '#0D9488', // Teal
  '#0891B2', // Cyan
  '#0284C7', // Sky
  '#2563EB', // Blue
  '#18181B', // Dark Zinc
  '#1E293B', // Dark Slate
  '#312E81', // Dark Indigo
  '#831843', // Deep Pink
];

// Helper to deterministically generate a color based on user name string
function getDeterministicColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_COLORS.length;
  return PRESET_COLORS[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  color: customColor,
  allowColorChange = false,
  onColorChange,
  onClick
}) => {
  const [imgError, setImgError] = useState(false);
  const [currentColor, setCurrentColor] = useState(
    customColor || getDeterministicColor(name || 'User')
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

  const initials = name
    ? name.trim().split(/\s+/).map(part => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
    : 'U';

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl'
  }[size];

  const handleColorSelect = (newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentColor(newColor);
    if (onColorChange) onColorChange(newColor);
    setShowColorPicker(false);
  };

  const isExternalPhoto = Boolean(avatarUrl && avatarUrl.includes('images.unsplash.com'));
  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim() !== '' && !imgError && !isExternalPhoto);

  return (
    <div className="relative inline-block shrink-0">
      {hasValidImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImgError(true)}
          onClick={onClick}
          className={`${sizeClasses} rounded-full object-cover border border-neutral-200 dark:border-neutral-700 ${className}`}
        />
      ) : (
        <div
          onClick={(e) => {
            if (allowColorChange) {
              e.stopPropagation();
              setShowColorPicker(prev => !prev);
            }
            if (onClick) onClick();
          }}
          style={{ backgroundColor: currentColor }}
          className={`${sizeClasses} rounded-full flex items-center justify-center font-mono font-bold text-white shadow-xs select-none border border-neutral-200/20 cursor-pointer ${className}`}
          title={allowColorChange ? 'Click to customize avatar color' : name}
        >
          {initials}
        </div>
      )}

      {/* Color picker dropdown for changing initial avatar color */}
      {showColorPicker && allowColorChange && (
        <div 
          onClick={e => e.stopPropagation()}
          className="absolute z-50 mt-1 left-0 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-1.5"
        >
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={(e) => handleColorSelect(c, e)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border border-white dark:border-black transition-transform hover:scale-110 ${currentColor === c ? 'ring-2 ring-black dark:ring-white' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
