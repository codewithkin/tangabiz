# Utility Functions

## Overview

Comprehensive utility library including:
- Haptic feedback
- Clipboard operations
- Toast notifications
- Formatting (currency, dates, numbers)
- Validation helpers
- String manipulation
- Array utilities
- Debounce/throttle
- ID generation
- Brand colors

## File: `lib/utils.ts`

## Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

export const haptics = {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
};
```

### Usage

```typescript
// On button press
haptics.light();

// On successful action
haptics.success();

// On error
haptics.error();

// On selection change
haptics.selection();
```

## Clipboard

```typescript
import * as Clipboard from 'expo-clipboard';

export const clipboard = {
    copy: async (text: string) => {
        await Clipboard.setStringAsync(text);
        haptics.success();
        showToast('success', 'Copied', 'Text copied to clipboard');
    },
    paste: async (): Promise<string> => {
        return await Clipboard.getStringAsync();
    },
    hasContent: async (): Promise<boolean> => {
        return await Clipboard.hasStringAsync();
    },
};
```

## Toast Notifications

```typescript
import Toast from 'react-native-toast-message';

export const showToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
) => {
    Toast.show({
        type,
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
    });
};

// Shorthand helpers
export const toast = {
    success: (title: string, message?: string) => showToast('success', title, message),
    error: (title: string, message?: string) => showToast('error', title, message),
    info: (title: string, message?: string) => showToast('info', title, message),
};
```

### Toast Setup in Layout

```tsx
// In _layout.tsx
import Toast from 'react-native-toast-message';

export default function Layout() {
    return (
        <>
            <Stack />
            <Toast />
        </>
    );
}
```

## Formatting Functions

### Currency

```typescript
export const formatCurrency = (
    amount: number | string,
    currency: string = 'USD',
    locale: string = 'en-US'
): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(numAmount);
};

// Usage
formatCurrency(1234.56);          // "$1,234.56"
formatCurrency(1234.56, 'ZWL');   // "ZWL 1,234.56"
```

### Numbers

```typescript
export const formatNumber = (num: number | string, decimals: number = 0): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
};

// Usage
formatNumber(1234567);     // "1,234,567"
formatNumber(1234.567, 2); // "1,234.57"
```

### Percentages

```typescript
export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
};

// Usage
formatPercentage(85.555);  // "85.6%"
```

### Dates and Times

```typescript
export const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDateTime = (date: Date | string): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
};

// Usage
formatDate('2024-01-15');      // "Jan 15, 2024"
formatTime('2024-01-15T14:30'); // "2:30 PM"
```

### Relative Time

```typescript
export const formatRelativeTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return formatDate(d);
};
```

### Phone Numbers

```typescript
export const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
        return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
};
```

## Validation Helpers

```typescript
export const validate = {
    email: (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    phone: (phone: string): boolean => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    },

    required: (value: any): boolean => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
    },

    minLength: (value: string, min: number): boolean => {
        return value.length >= min;
    },

    maxLength: (value: string, max: number): boolean => {
        return value.length <= max;
    },

    isNumber: (value: string): boolean => {
        return !isNaN(parseFloat(value)) && isFinite(Number(value));
    },

    isPositive: (value: number): boolean => value > 0,
    isNonNegative: (value: number): boolean => value >= 0,
};
```

## String Utilities

```typescript
// Truncate with ellipsis
export const truncate = (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
};

// Capitalize first letter
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Title case
export const titleCase = (str: string): string => {
    return str.toLowerCase().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Generate slug
export const slugify = (str: string): string => {
    return str.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Get initials from name
export const getInitials = (name: string, count = 2): string => {
    return name.split(' ')
        .map(part => part.charAt(0))
        .slice(0, count)
        .join('')
        .toUpperCase();
};
```

## Array Utilities

```typescript
// Group by key
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
};

// Sort by key
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
        const comparison = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return order === 'asc' ? comparison : -comparison;
    });
};

// Remove duplicates
export const unique = <T>(array: T[], key?: keyof T): T[] => {
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    return [...new Set(array)];
};
```

## Debounce & Throttle

```typescript
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
};

export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
};

// Usage
const debouncedSearch = debounce((query: string) => {
    // Search API call
}, 300);
```

## ID Generation

```typescript
// UUID-like
export const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

// Short ID
export const generateShortId = (length = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Reference number
export const generateReference = (prefix = 'TXN'): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = generateShortId(4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// Usage
generateReference('INV'); // "INV-LK8F9G-A3B2"
```

## Brand Colors

```typescript
export const colors = {
    // Primary - Green
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    
    // Secondary - Yellow
    secondary: '#eab308',
    secondaryLight: '#fde047',
    secondaryDark: '#ca8a04',
    
    // Neutral
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    
    // Semantic
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
};

// Role colors
export const roleColors = {
    ADMIN: '#8b5cf6',   // Purple
    MANAGER: '#3b82f6', // Blue
    STAFF: '#6b7280',   // Gray
};

// Status colors
export const statusColors = {
    PENDING: '#f59e0b',   // Yellow
    COMPLETED: '#22c55e', // Green
    CANCELLED: '#ef4444', // Red
    REFUNDED: '#6b7280',  // Gray
};

// Transaction type colors
export const transactionTypeColors = {
    SALE: '#22c55e',    // Green
    REFUND: '#ef4444',  // Red
    EXPENSE: '#f59e0b', // Yellow
    INCOME: '#3b82f6',  // Blue
};
```

## Dependencies

```json
{
    "expo-haptics": "~14.0.1",
    "expo-clipboard": "~7.0.1",
    "react-native-toast-message": "^2.2.0"
}
```

## Export Pattern

```typescript
// lib/index.ts - Re-export all utilities
export * from './utils';
export * from './api';
export * from './files';
export * from './permissions';
export * from './storage';
export * from './useResponsive';
```
