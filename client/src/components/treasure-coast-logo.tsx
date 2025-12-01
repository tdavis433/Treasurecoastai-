interface TreasureCoastLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-base', gap: 'gap-2' },
  lg: { icon: 40, text: 'text-lg', gap: 'gap-2.5' },
  xl: { icon: 56, text: 'text-2xl', gap: 'gap-3' },
};

function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="50%" stopColor="#00E5CC" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Hexagonal shield outline */}
      <path
        d="M32 4L54 16V40L32 60L10 40V16L32 4Z"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        fill="none"
        filter="url(#glow)"
      />
      
      {/* Circuit board lines - center vertical */}
      <line
        x1="32"
        y1="48"
        x2="32"
        y2="20"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Left circuit line */}
      <line
        x1="24"
        y1="44"
        x2="24"
        y2="28"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Right circuit line */}
      <line
        x1="40"
        y1="44"
        x2="40"
        y2="28"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Circuit nodes - top */}
      <circle
        cx="32"
        cy="18"
        r="4"
        fill="url(#logoGradient)"
      />
      
      {/* Circuit nodes - left */}
      <circle
        cx="24"
        cy="26"
        r="3.5"
        fill="url(#logoGradient)"
      />
      
      {/* Circuit nodes - right */}
      <circle
        cx="40"
        cy="26"
        r="3.5"
        fill="url(#logoGradient)"
      />
    </svg>
  );
}

export function TreasureCoastLogo({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = false,
  subtitle = 'Agency Dashboard',
}: TreasureCoastLogoProps) {
  const sizeConfig = sizeMap[size];

  if (variant === 'icon') {
    return <LogoIcon size={sizeConfig.icon} />;
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className={`font-bold tracking-tight ${sizeConfig.text}`}>
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
            TREASURE COAST
          </span>
          <span className="text-white ml-1.5 font-extrabold">AI</span>
        </div>
        {showSubtitle && subtitle && (
          <span className="text-white/55 text-xs tracking-wide">{subtitle}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${sizeConfig.gap} ${className}`}>
      <LogoIcon size={sizeConfig.icon} />
      <div className="flex flex-col">
        <div className={`font-bold tracking-tight leading-tight ${sizeConfig.text}`}>
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
            TREASURE COAST
          </span>
          <span className="text-white ml-1.5 font-extrabold">AI</span>
        </div>
        {showSubtitle && subtitle && (
          <span className="text-white/55 text-xs tracking-wide">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

export function TreasureCoastLogoStacked({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeConfig = sizeMap[size];
  const iconSizes = { sm: 40, md: 56, lg: 72, xl: 96 };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <LogoIcon size={iconSizes[size]} />
      <div className={`font-bold tracking-tight text-center mt-2 ${sizeConfig.text}`}>
        <div className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
          TREASURE
        </div>
        <div className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
          COAST <span className="text-white font-extrabold">AI</span>
        </div>
      </div>
    </div>
  );
}

export default TreasureCoastLogo;
