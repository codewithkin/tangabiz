# Responsive Design

## Overview

Comprehensive responsive design system for phones and tablets:
- Breakpoint-based device detection
- Adaptive typography, spacing, and icons
- Grid layout helpers
- Touch target sizing
- Orientation awareness

## File: `lib/useResponsive.ts`

## Breakpoints

```typescript
export const BREAKPOINTS = {
    mobile: 0,         // 0 - 767px (phones)
    tablet: 768,       // 768 - 1023px (tablets in portrait)
    largeTablet: 1024, // 1024+ (tablets in landscape, small laptops)
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'largeTablet';
```

## useResponsive Hook

### Full Interface

```typescript
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
    
    // Typography (NativeWind classes)
    typography: {
        title: string;
        subtitle: string;
        body: string;
        small: string;
    };
    
    // Icon sizes
    iconSizes: {
        tiny: number;
        small: number;
        medium: number;
        large: number;
        xlarge: number;
    };
    
    // Avatar sizes
    avatarSizes: {
        small: number;
        medium: number;
        large: number;
    };
    
    // Touch targets
    touchTargets: {
        small: number;
        medium: number;
        large: number;
    };
    
    // Helpers
    cardWidth: (columns?: number) => string;
    responsive: <T>(mobile: T, tablet: T, largeTablet?: T) => T;
}
```

### Implementation

```typescript
import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

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
        
        // ... rest of responsive values
        
        return { ... };
    }, [width, height]);
}
```

## Responsive Values by Device

### Spacing

| Value | Mobile | Tablet |
|-------|--------|--------|
| horizontalPadding | 16 | 24 |
| cardPadding | p-4 | p-6 |
| gap | 12 | 16 |

### Typography Classes

| Type | Mobile | Tablet | Large Tablet |
|------|--------|--------|--------------|
| title | text-xl | text-2xl | text-3xl |
| subtitle | text-sm | text-base | text-base |
| body | text-sm | text-base | text-base |
| small | text-xs | text-sm | text-sm |

### Icon Sizes

| Size | Mobile | Tablet |
|------|--------|--------|
| tiny | 14 | 18 |
| small | 16 | 20 |
| medium | 20 | 24 |
| large | 24 | 28 |
| xlarge | 32 | 40 |

### Avatar Sizes

| Size | Mobile | Tablet |
|------|--------|--------|
| small | 32 | 40 |
| medium | 48 | 56 |
| large | 64 | 80 |

### Touch Targets

| Size | Mobile | Tablet |
|------|--------|--------|
| small | 40 | 44 |
| medium | 48 | 56 |
| large | 56 | 64 |

### Grid Columns

| Device | Columns |
|--------|---------|
| Mobile | 2 |
| Tablet | 3 |
| Large Tablet | 4 |

## Usage Examples

### Basic Usage

```tsx
import { useResponsive } from '@/lib/useResponsive';

const MyComponent = () => {
    const { 
        isTablet, 
        isLargeTablet,
        typography, 
        iconSizes,
        gridColumns 
    } = useResponsive();

    return (
        <View className={isTablet ? 'px-6' : 'px-4'}>
            <Text className={typography.title}>Title</Text>
            <MaterialCommunityIcons 
                name="home" 
                size={iconSizes.medium} 
            />
        </View>
    );
};
```

### Responsive Helper

```tsx
const { responsive } = useResponsive();

// Pick value based on device
const padding = responsive(16, 24, 32);  // mobile, tablet, largeTablet
const columns = responsive(1, 2, 3);
```

### FlatList Grid

```tsx
const { gridColumns, isLargeTablet } = useResponsive();

<FlatList
    data={products}
    renderItem={renderProduct}
    numColumns={gridColumns}
    key={gridColumns}  // Force re-render when columns change
    contentContainerStyle={{
        paddingHorizontal: 12,
        ...(isLargeTablet && { 
            maxWidth: 1400, 
            alignSelf: 'center', 
            width: '100%' 
        })
    }}
/>
```

### Card Width Helper

```tsx
const { cardWidth, gridColumns } = useResponsive();

<View className={`${cardWidth(2)} p-2`}>
    <View className="bg-white rounded-xl p-4">
        {/* Card content */}
    </View>
</View>
```

### Conditional Styling

```tsx
const { isTablet, isLargeTablet } = useResponsive();

<Pressable
    className={`
        bg-green-500 rounded-xl items-center justify-center
        ${isTablet ? 'w-16 h-16' : 'w-14 h-14'}
    `}
>
    <MaterialCommunityIcons 
        name="plus" 
        size={isTablet ? 28 : 24} 
        color="#fff" 
    />
</Pressable>
```

### Layout Switching

```tsx
const { isTablet, isLargeTablet } = useResponsive();

// Two-column layout on tablets
<View className={isTablet ? 'flex-row flex-wrap' : ''}>
    <View className={isTablet ? 'w-1/2' : 'w-full'}>
        {/* Left column */}
    </View>
    <View className={isTablet ? 'w-1/2' : 'w-full'}>
        {/* Right column */}
    </View>
</View>
```

### Split View for Tablets

```tsx
// POS screen split view
const { isTablet } = useResponsive();

return (
    <View className="flex-1 flex-row">
        {/* Products Grid */}
        <View className={isTablet ? 'flex-1' : 'flex-1'}>
            <ProductGrid />
        </View>
        
        {/* Cart Sidebar - Only on tablets */}
        {isTablet && (
            <View className="w-80 bg-white border-l border-gray-200">
                <CartSidebar />
            </View>
        )}
        
        {/* Cart FAB - Only on mobile */}
        {!isTablet && cart.length > 0 && (
            <CartFAB onPress={() => setShowCart(true)} />
        )}
    </View>
);
```

## Container Styles Helper

```typescript
export const getContainerStyle = (isTablet: boolean) => ({
    paddingHorizontal: isTablet ? 24 : 16,
});
```

## Grid Item Width Helper

```typescript
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
```

## Best Practices

### 1. Use the Hook at Component Level

```tsx
// ✅ Good - use in component
const MyComponent = () => {
    const { isTablet, typography } = useResponsive();
    // ...
};

// ❌ Bad - don't use outside components
const isTablet = useResponsive().isTablet; // Hook error!
```

### 2. Memoize Heavy Computations

```tsx
const { gridColumns } = useResponsive();

const gridData = useMemo(() => {
    return processDataForGrid(data, gridColumns);
}, [data, gridColumns]);
```

### 3. Key Prop for FlatList Columns

```tsx
// Force re-render when columns change
<FlatList
    numColumns={gridColumns}
    key={gridColumns}  // Important!
    // ...
/>
```

### 4. Max Width for Large Screens

```tsx
<ScrollView
    contentContainerStyle={{
        ...(isLargeTablet && {
            maxWidth: 1400,
            alignSelf: 'center',
            width: '100%'
        })
    }}
>
```

### 5. Touch Target Minimums

```tsx
// iOS: minimum 44pt, Android: minimum 48dp
const { touchTargets } = useResponsive();

<Pressable
    style={{ 
        minWidth: touchTargets.medium,
        minHeight: touchTargets.medium
    }}
>
```

## Testing Different Devices

1. **iOS Simulator**: Rotate device with Cmd+Left/Right
2. **Android Emulator**: Use Extended Controls → Virtual sensors
3. **Expo Go**: Test on actual devices
4. **Development**: Use responsive mode in React DevTools
