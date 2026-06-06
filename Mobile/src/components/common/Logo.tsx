import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/theme';

interface LogoProps {
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 80, color }) => {
  const accentColor = color || '#D7FF3F';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={accentColor} />
          <Stop offset="100%" stopColor="#00E5FF" />
        </LinearGradient>
        <LinearGradient id="innerWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.03} />
        </LinearGradient>
      </Defs>
      
      {/* Outer Hexagon Shield Structure */}
      <Path 
        d="M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z" 
        stroke="url(#shieldGrad)" 
        strokeWidth="4.5" 
        strokeLinejoin="round"
      />
      
      {/* Dynamic Overlapping Finance Waves (Income & Expense Splits) */}
      <Path 
        d="M24 46 C34 32, 66 32, 76 46 C66 60, 34 60, 24 46 Z" 
        fill="url(#innerWaveGrad)"
      />
      <Path 
        d="M24 54 C34 40, 66 40, 76 54 C66 68, 34 68, 24 54 Z" 
        fill="url(#innerWaveGrad)"
      />

      {/* Styled Central Intersecting Ledger/Vault Grid Core */}
      <Path 
        d="M36 36 L64 36 L64 64 L36 64 Z" 
        stroke={accentColor} 
        strokeWidth="3" 
        strokeLinejoin="round" 
        strokeDasharray="4 4"
        opacity={0.85}
      />
      
      {/* Center intersecting coordinates (Split intersections) */}
      <Path 
        d="M50 30 L50 70" 
        stroke={accentColor} 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      <Path 
        d="M30 50 L70 50" 
        stroke={accentColor} 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      
      {/* Central Vault Diamond Lock */}
      <Path 
        d="M50 44 L56 50 L50 56 L44 50 Z" 
        fill="#FFFFFF"
      />
    </Svg>
  );
};

export default Logo;
