interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background circle with gradient */}
        <circle cx="24" cy="24" r="24" fill="url(#gradient)" />
        
        {/* Document/Receipt icon */}
        <path
          d="M14 12C14 10.8954 14.8954 10 16 10H32C33.1046 10 34 10.8954 34 12V36C34 37.1046 33.1046 38 32 38H16C14.8954 38 14 37.1046 14 36V12Z"
          fill="white"
          fillOpacity="0.9"
        />
        
        {/* Document lines */}
        <rect x="18" y="16" width="12" height="1.5" fill="#1E40AF" />
        <rect x="18" y="20" width="8" height="1.5" fill="#1E40AF" />
        <rect x="18" y="24" width="10" height="1.5" fill="#1E40AF" />
        <rect x="18" y="28" width="6" height="1.5" fill="#1E40AF" />
        
        {/* Scan lines effect */}
        <rect x="16" y="32" width="16" height="2" fill="#3B82F6" opacity="0.7">
          <animate
            attributeName="opacity"
            values="0.3;0.8;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Corner fold */}
        <path
          d="M32 10L34 12L32 14V10Z"
          fill="#E5E7EB"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
} 