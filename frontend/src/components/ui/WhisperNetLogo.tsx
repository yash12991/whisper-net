import React from 'react';
import Image from 'next/image';

interface WhisperNetLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export function WhisperNetLogo({ 
  size = 40, 
  className = '', 
  showGlow = true 
}: WhisperNetLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {showGlow && (
        <div 
          className="absolute -inset-1 rounded-2xl opacity-50 blur-md pointer-events-none transition-all duration-300 group-hover:opacity-75"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, rgba(6, 182, 212, 0.3) 50%, transparent 80%)' }}
        />
      )}
      <div 
        className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-[#090e1a] shadow-lg shadow-emerald-950/40"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="WhisperNet Logo"
          width={size}
          height={size}
          className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
    </div>
  );
}

export default WhisperNetLogo;
