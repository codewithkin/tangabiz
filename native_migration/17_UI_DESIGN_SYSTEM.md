# UI Design System

## Overview

Complete design system for the Tangabiz mobile app built with NativeWind (Tailwind CSS for React Native). Comprehensive styling, color palette, typography, and reusable UI components.

## Brand Colors

### Primary Color (Green)
```typescript
primary: {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Main brand color
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
}
```

**Usage**: Call-to-action buttons, headers, active states, success states, highlights

### Secondary Color (Yellow)
```typescript
secondary: {
  50: '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#eab308', // Main accent color
  600: '#ca8a04',
  700: '#a16207',
  800: '#854d0e',
  900: '#713f12',
  950: '#422006',
}
```

**Usage**: Warnings, cautions, secondary actions, badges

### Role-Based Colors
```typescript
// Admin Role
const ADMIN_COLOR = '#a855f7'; // Purple
const ADMIN_LIGHT = '#f3e8ff';

// Manager Role
const MANAGER_COLOR = '#3b82f6'; // Blue
const MANAGER_LIGHT = '#eff6ff';

// Staff Role
const STAFF_COLOR = '#9ca3af'; // Gray
const STAFF_LIGHT = '#f9fafb';

// Status Colors
const SUCCESS = '#22c55e';    // Green
const WARNING = '#eab308';    // Yellow
const DANGER = '#ef4444';     // Red
const INFO = '#3b82f6';       // Blue
```

### Neutral Colors (from Tailwind)
```typescript
// Gray Scale
gray: {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
}

// Red Scale (Danger)
red: {
  50: '#fef2f2',
  100: '#fee2e2',
  500: '#ef4444',
  600: '#dc2626',
}

// Blue Scale (Info)
blue: {
  50: '#eff6ff',
  100: '#dbeafe',
  500: '#3b82f6',
  600: '#2563eb',
}
```

## Typography System

### Font Sizes & Weights

```typescript
const typography = {
  // XSmall - Captions, badges, tiny labels
  xSmall: 'text-xs',        // 12px
  
  // Small - Subtitles, helper text, secondary info
  small: 'text-sm',         // 14px
  
  // Body - Default text, descriptions, list items
  body: 'text-base',        // 16px
  
  // Large - Section headings, labels
  large: 'text-lg',         // 18px
  
  // XLarge - Page headings, large numbers
  xLarge: 'text-xl',        // 20px
  
  // Heading - Titles, card headings
  heading: 'text-2xl',      // 24px
  
  // Large Heading - Main page titles
  largeHeading: 'text-3xl', // 30px
};

// Font Weights
const weights = {
  thin: 'font-thin',        // 100
  extralight: 'font-extralight', // 200
  light: 'font-light',      // 300
  normal: 'font-normal',    // 400
  medium: 'font-medium',    // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',        // 700
  extrabold: 'font-extrabold', // 800
  black: 'font-black',      // 900
};
```

### Typography Usage Patterns

**Page Title**
```tsx
<Text className="text-3xl font-bold text-gray-900">Page Title</Text>
```

**Section Heading**
```tsx
<Text className="text-xl font-semibold text-gray-900 mb-4">Section Title</Text>
```

**Body Text**
```tsx
<Text className="text-base text-gray-700">Regular body text content</Text>
```

**Secondary Text**
```tsx
<Text className="text-sm text-gray-500">Secondary or helper text</Text>
```

**Stat Number**
```tsx
<Text className="text-3xl font-bold text-gray-900">1,250</Text>
<Text className="text-sm text-gray-500 mt-1">Total Sales</Text>
```

**Badge/Label**
```tsx
<Text className="text-xs font-semibold text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
  Active
</Text>
```

## Spacing System

```typescript
const spacing = {
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 24,   // 24px
  '2xl': 32, // 32px
  '3xl': 48, // 48px
  '4xl': 64, // 64px
};

// NativeWind Classes
// p-1 through p-96 (padding)
// m-1 through m-96 (margin)
// gap-1 through gap-96 (gap in flex/grid)
// px-4 (padding horizontal)
// py-3 (padding vertical)
// mt-2, mb-2, ml-2, mr-2 (directional margins)
```

## Component Library

### 1. Button Component

```tsx
// File: components/ui/button.tsx
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles = 'flex-row items-center justify-center rounded-lg font-semibold';
  
  const variantStyles = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-secondary-500 active:bg-secondary-600',
    outline: 'border-2 border-primary-500',
    danger: 'bg-red-500 active:bg-red-600',
    ghost: 'bg-transparent',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const textColor = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    danger: 'text-white',
    ghost: 'text-primary-500',
  };
  
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-50' : ''
      }`}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={`font-semibold ${textColor[variant]}`}>
        {isLoading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};
```

### 2. Card Component

```tsx
// File: components/ui/card.tsx
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white',
    outlined: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
  };
  
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  return (
    <View
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    />
  );
};
```

### 3. Input Component

```tsx
// File: components/ui/text-input.tsx
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helperText,
  className,
  ...props
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      )}
      <View className={`flex-row items-center bg-white border rounded-lg px-4 py-3 ${
        error ? 'border-red-500' : 'border-gray-200'
      }`}>
        {icon && (
          <MaterialCommunityIcons 
            name={icon as any} 
            size={20} 
            color={error ? '#ef4444' : '#9ca3af'}
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          className={`flex-1 text-base text-gray-900 ${className}`}
          placeholderTextColor="#d1d5db"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
      {helperText && (
        <Text className="text-xs text-gray-500 mt-1">{helperText}</Text>
      )}
    </View>
  );
};
```

### 4. Badge Component

```tsx
// File: components/ui/badge.tsx
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  icon?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  text, 
  variant = 'gray', 
  icon,
  size = 'md',
}) => {
  const variants = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-700',
  };
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };
  
  return (
    <View className={`flex-row items-center rounded-full ${variants[variant]} ${sizeStyles[size]}`}>
      {icon && (
        <MaterialCommunityIcons 
          name={icon as any} 
          size={12} 
          style={{ marginRight: 4 }}
        />
      )}
      <Text className={`font-medium ${variants[variant].split(' ')[1]}`}>
        {text}
      </Text>
    </View>
  );
};
```

### 5. Alert Component

```tsx
// File: components/ui/alert.tsx
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AlertProps {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  type = 'info',
  onClose,
}) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'check-circle',
      color: '#16a34a',
      textColor: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'alert-circle',
      color: '#dc2626',
      textColor: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'alert',
      color: '#ca8a04',
      textColor: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'information',
      color: '#2563eb',
      textColor: 'text-blue-800',
    },
  };
  
  const config = types[type];
  
  return (
    <View className={`flex-row items-start ${config.bg} border ${config.border} rounded-lg p-4`}>
      <MaterialCommunityIcons 
        name={config.icon as any} 
        size={24} 
        color={config.color}
        style={{ marginRight: 12 }}
      />
      <View className="flex-1">
        <Text className={`font-semibold ${config.textColor}`}>{title}</Text>
        {message && (
          <Text className={`text-sm ${config.textColor} mt-1`}>{message}</Text>
        )}
      </View>
      {onClose && (
        <Pressable onPress={onClose}>
          <MaterialCommunityIcons 
            name="close"
            size={20}
            color={config.color}
          />
        </Pressable>
      )}
    </View>
  );
};
```

### 6. Loading Skeleton

```tsx
// File: components/ui/skeleton.tsx
import { View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  rounded = false,
  className,
}) => {
  return (
    <View
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{
        width: typeof width === 'number' ? width : undefined,
        height,
      }}
    />
  );
};
```

## Component Library Usage Examples

### Dashboard Stats Card

```tsx
<Card padding="md">
  <View className="flex-row items-center">
    <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center">
      <MaterialCommunityIcons name="shopping-outline" size={28} color="#22c55e" />
    </View>
    <View className="ml-4 flex-1">
      <Text className="text-gray-500 text-sm">Total Sales</Text>
      <Text className="text-3xl font-bold text-gray-900">$12,450</Text>
    </View>
  </View>
</Card>
```

### Form Section

```tsx
<View className="mb-6">
  <Text className="text-lg font-semibold text-gray-900 mb-4">Product Details</Text>
  <Input
    label="Product Name"
    placeholder="Enter product name"
    icon="package-variant"
    value={name}
    onChangeText={setName}
    error={errors.name}
  />
  <Input
    label="Price"
    placeholder="0.00"
    icon="currency-usd"
    keyboardType="decimal-pad"
    value={price}
    onChangeText={setPrice}
    error={errors.price}
  />
</View>
```

### List Item with Badge

```tsx
<View className="flex-row items-center bg-white p-4 rounded-lg mb-3 border border-gray-100">
  <View className="flex-1">
    <Text className="text-base font-semibold text-gray-900">Product Name</Text>
    <Text className="text-sm text-gray-500 mt-1">SKU: ABC123</Text>
  </View>
  <Badge text="In Stock" variant="success" />
</View>
```

### Action Modal/Dialog

```tsx
<View className="bg-white rounded-2xl p-6 items-center">
  <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
    <MaterialCommunityIcons name="check" size={32} color="#22c55e" />
  </View>
  <Text className="text-2xl font-bold text-gray-900 mb-2">Success!</Text>
  <Text className="text-gray-500 text-center mb-6">
    Product has been created successfully.
  </Text>
  <Button title="Continue" variant="primary" onPress={handleClose} />
</View>
```

## Layout Patterns

### Flex Layout

```tsx
// Horizontal layout
<View className="flex-row items-center justify-between">
  <View className="flex-1">Content</View>
  <View className="flex-1">Content</View>
</View>

// Vertical layout (default)
<View className="flex-col gap-4">
  <View>Content 1</View>
  <View>Content 2</View>
</View>

// Centered content
<View className="flex-1 items-center justify-center">
  <Text>Centered Content</Text>
</View>
```

### Grid Layout (Responsive)

```tsx
// 2-column grid on mobile, 3-column on tablet
const { gridColumns, isTablet } = useResponsive();

<View className={`flex-row flex-wrap gap-4`}>
  {items.map((item, index) => (
    <View 
      key={index} 
      style={{ 
        width: `${100 / gridColumns}%`,
        paddingHorizontal: 4,
      }}
    >
      <Card>{item}</Card>
    </View>
  ))}
</View>
```

### Safe Area Layout

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView className="flex-1 bg-gray-50">
  <ScrollView className="px-5 py-4">
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

## Shadows & Elevation

```typescript
// Shadow patterns
const shadowStyles = {
  sm: 'shadow-sm',      // Subtle shadow
  md: 'shadow-md',      // Medium shadow
  lg: 'shadow-lg',      // Large shadow
  xl: 'shadow-xl',      // Extra large shadow
};

// Usage
<View className="bg-white rounded-lg shadow-md p-4">
  {/* Content */}
</View>
```

## Animations & Interactions

### Button Press Feedback

```tsx
<Pressable
  onPressIn={() => setPressed(true)}
  onPressOut={() => setPressed(false)}
  className={`bg-primary-500 py-3 px-6 rounded-lg ${
    pressed ? 'opacity-80 scale-95' : 'opacity-100'
  }`}
>
  <Text className="text-white font-semibold">Press Me</Text>
</Pressable>
```

### Active/Inactive States

```tsx
// Tab indicator
<View className={`h-1 ${isActive ? 'bg-primary-500' : 'bg-gray-200'}`} />

// Card highlight
<View className={`border-2 ${isSelected ? 'border-primary-500' : 'border-gray-200'}`} />
```

## Accessibility Guidelines

```tsx
// Semantic labels
<View
  accessible={true}
  accessibilityLabel="Delete product"
  accessibilityHint="Swipe left to see delete button"
>
  <Button title="Delete" />
</View>

// Touch targets minimum 44x44 points
<Pressable
  className="w-11 h-11 items-center justify-center"
  onPress={handlePress}
>
  <MaterialCommunityIcons name="delete" size={24} />
</Pressable>

// Color contrast
// Primary text: text-gray-900 on bg-white (21:1)
// Secondary text: text-gray-600 on bg-white (8.5:1)
```

## Dark Mode Support (Optional Future)

```tsx
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

<View className={isDark ? 'bg-gray-900' : 'bg-white'}>
  <Text className={isDark ? 'text-white' : 'text-gray-900'}>
    Content
  </Text>
</View>
```

## Theming with CSS Variables (Optional)

```css
/* tailwind.config.js - Global CSS Variables */
:root {
  --color-primary: #22c55e;
  --color-primary-light: #dcfce7;
  --color-secondary: #eab308;
  --color-danger: #ef4444;
}
```

## Common Component Combinations

### Empty State

```tsx
<View className="flex-1 items-center justify-center bg-gray-50 px-6">
  <MaterialCommunityIcons name="inbox-outline" size={48} color="#d1d5db" />
  <Text className="text-xl font-semibold text-gray-900 mt-4">No Items</Text>
  <Text className="text-sm text-gray-500 mt-2 text-center">
    You haven't created any products yet. Get started by adding your first product.
  </Text>
  <Button title="Create Product" variant="primary" className="mt-6" />
</View>
```

### Loading State

```tsx
<View className="flex-1 items-center justify-center">
  <ActivityIndicator size="large" color="#22c55e" />
  <Text className="text-gray-500 mt-4">Loading...</Text>
</View>
```

### Error State

```tsx
<Alert
  type="error"
  title="Something went wrong"
  message="Unable to load data. Please try again."
/>
<Button 
  title="Retry" 
  variant="outline" 
  className="mt-4"
  onPress={handleRetry}
/>
```

## Icons Reference

All icons from `@expo/vector-icons/MaterialCommunityIcons`:

**Common Icons Used**:
- Shopping & E-commerce: `shopping-outline`, `cart`, `package-variant`, `barcode`, `qrcode-scan`
- People: `account`, `people`, `account-plus`, `phone-dial`
- Navigation: `home`, `magnify`, `menu`, `arrow-left`, `chevron-right`
- Actions: `plus`, `pencil`, `delete`, `check`, `close`, `download`
- Status: `check-circle`, `alert-circle`, `information`, `clock`
- Finance: `currency-usd`, `credit-card`, `wallet`, `trending-up`
- Settings: `cog`, `bell`, `lock`, `eye`

## Best Practices

1. **Consistency**: Use design tokens (colors, spacing, typography) consistently throughout
2. **Spacing**: Always use spacing units from the spacing system (no magic numbers)
3. **Colors**: Use semantic color names (primary, danger, success) not raw hex values
4. **Accessibility**: Ensure minimum touch target of 44x44 points
5. **Performance**: Memoize components that don't need frequent re-renders
6. **Responsive**: Always test on both mobile and tablet devices
7. **Type Safety**: Use TypeScript for all components
8. **Props**: Keep component props focused and well-documented
