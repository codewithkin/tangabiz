// Responsive Design Hook for Tangabiz
// Provides responsive utilities based on screen dimensions

import { useWindowDimensions, ScaledSize } from 'react-native';
import { useMemo } from 'react';

// Breakpoints matching common device sizes
export const BREAKPOINTS = {
  mobile: 0,        // 0 - 767px (phones)
  tablet: 768,      // 768 - 1023px (tablets in portrait)
  largeTablet: 1024, // 1024+ (tablets in landscape, small laptops)
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'largeTablet';

export interface ResponsiveValues {
  // Device type
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  
  // Dimensions
  width: number;
  height: number;
  isLandscape: boolean;
  
  // Grid columns
  columns: number;
  gridColumns: number;
  
  // Spacing
  horizontalPadding: number;
  cardPadding: string;
  gap: number;
  
  // Typography sizes (NativeWind classes)
  titleSize: string;
  subtitleSize: string;
  bodySize: string;
  captionSize: string;
  
  // Grouped typography helper
  typography: {
    title: string;
    subtitle: string;
    body: string;
    small: string;
  };
  
  // Icon sizes
  iconSmall: number;
  iconMedium: number;
  iconLarge: number;
  iconXLarge: number;
  
  // Grouped icon sizes helper
  iconSizes: {
    tiny: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  
  // Avatar/Container sizes
  avatarSmall: number;
  avatarMedium: number;
  avatarLarge: number;
  
  // Grouped avatar sizes helper
  avatarSizes: {
    small: number;
    medium: number;
    large: number;
  };
  
  // Touch target sizes
  touchTarget: number;
  
  // Grouped touch targets helper
  touchTargets: {
    small: number;
    medium: number;
    large: number;
  };
  
  // Card widths for grids
  cardWidth: (columns?: number) => string;
  
  // Responsive class helper
  responsive: <T>(mobile: T, tablet: T, largeTablet?: T) => T;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => {
    const isLandscape = width > height;
    
    // Determine device type
    let deviceType: DeviceType = 'mobile';
    if (width >= BREAKPOINTS.largeTablet) {
      deviceType = 'largeTablet';
    } else if (width >= BREAKPOINTS.tablet) {
      deviceType = 'tablet';
    }
    
    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';
    
    // Grid columns based on device
    const columns = isLargeTablet ? 4 : isTablet ? 3 : 2;
    
    // Spacing
    const horizontalPadding = isTablet ? 24 : 16;
    const cardPadding = isTablet ? 'p-6' : 'p-4';
    const gap = isTablet ? 16 : 12;
    
    // Typography
    const titleSize = isLargeTablet ? 'text-3xl' : isTablet ? 'text-2xl' : 'text-xl';
    const subtitleSize = isTablet ? 'text-base' : 'text-sm';
    const bodySize = isTablet ? 'text-base' : 'text-sm';
    const captionSize = isTablet ? 'text-sm' : 'text-xs';
    
    // Icons
    const iconSmall = isTablet ? 20 : 16;
    const iconMedium = isTablet ? 24 : 20;
    const iconLarge = isTablet ? 28 : 24;
    const iconXLarge = isTablet ? 40 : 32;
    
    // Avatars
    const avatarSmall = isTablet ? 40 : 32;
    const avatarMedium = isTablet ? 56 : 48;
    const avatarLarge = isTablet ? 80 : 64;
    
    // Touch targets (minimum 44pt on iOS, 48dp on Android)
    const touchTarget = isTablet ? 56 : 48;
    
    // Grouped helpers
    const typography = {
      title: titleSize,
      subtitle: subtitleSize,
      body: bodySize,
      small: captionSize,
    };
    
    const iconSizes = {
      tiny: isTablet ? 18 : 14,
      small: iconSmall,
      medium: iconMedium,
      large: iconLarge,
      xlarge: iconXLarge,
    };
    
    const avatarSizes = {
      small: avatarSmall,
      medium: avatarMedium,
      large: avatarLarge,
    };
    
    const touchTargets = {
      small: isTablet ? 44 : 40,
      medium: touchTarget,
      large: isTablet ? 64 : 56,
    };
    
    // Card width helper
    const cardWidth = (cols = columns): string => {
      const widthMap: Record<number, string> = {
        1: 'w-full',
        2: 'w-1/2',
        3: 'w-1/3',
        4: 'w-1/4',
      };
      return widthMap[cols] || 'w-full';
    };
    
    // Responsive value helper
    const responsive = <T>(mobile: T, tablet: T, largeTablet?: T): T => {
      if (isLargeTablet && largeTablet !== undefined) return largeTablet;
      if (isTablet) return tablet;
      return mobile;
    };
    
    return {
      deviceType,
      isMobile,
      isTablet,
      isLargeTablet,
      width,
      height,
      isLandscape,
      columns,
      gridColumns: columns,
      horizontalPadding,
      cardPadding,
      gap,
      titleSize,
      subtitleSize,
      bodySize,
      captionSize,
      typography,
      iconSmall,
      iconMedium,
      iconLarge,
      iconXLarge,
      iconSizes,
      avatarSmall,
      avatarMedium,
      avatarLarge,
      avatarSizes,
      touchTarget,
      touchTargets,
      cardWidth,
      responsive,
    };
  }, [width, height]);
}

// Responsive container component styles
export const getContainerStyle = (isTablet: boolean) => ({
  paddingHorizontal: isTablet ? 24 : 16,
});

// Responsive grid item width classes
export const getGridItemWidth = (
  columns: number,
  isTablet: boolean,
  isLargeTablet: boolean
): string => {
  if (isLargeTablet) {
    return columns === 4 ? 'w-1/4' : columns === 3 ? 'w-1/3' : 'w-1/2';
  }
  if (isTablet) {
    return columns === 3 ? 'w-1/3' : 'w-1/2';
  }
  return 'w-1/2';
};

export default useResponsive;
