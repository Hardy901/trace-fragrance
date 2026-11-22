import React from 'react';

interface TraceLogoProps {
  className?: string;
  showEmblem?: boolean;
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const StarEmblem: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className = '', size = 18, color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2 C12 7.5 7.5 12 2 12 C7.5 12 12 16.5 12 22 C12 16.5 16.5 12 22 12 C16.5 12 12 7.5 12 2 Z"
        fill={color}
      />
    </svg>
  );
};

export const TraceLogo: React.FC<TraceLogoProps> = ({
  className = '',
  showEmblem = true,
  inverted = false,
  size = 'md'
}) => {
  const textSizes = {
    sm: 'text-sm tracking-[0.28em]',
    md: 'text-lg md:text-xl tracking-[0.32em]',
    lg: 'text-2xl md:text-3xl tracking-[0.36em]',
    xl: 'text-3xl md:text-5xl tracking-[0.4em]'
  };

  const emblemSizes = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {showEmblem && (
        <StarEmblem
          size={emblemSizes[size]}
          color={inverted ? '#DED4C7' : '#713D43'}
          className="transition-transform duration-300 group-hover:rotate-45"
        />
      )}

      <span
        className={`font-editorial font-medium uppercase transition-colors duration-200 ${textSizes[size]} ${
          inverted ? 'text-[#FAF8F4]' : 'text-[#242321]'
        }`}
      >
        TRACE
      </span>
    </div>
  );
};
