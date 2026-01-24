import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amount as currency
 * @example formatCurrency(1234.56) => "$1,234.56"
 * @example formatCurrency(1234.56, 2, 'ZWL') => "ZWL 1,234.56"
 */
export function formatCurrency(amount: number, decimals = 2, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format phone number to standard format
 * @example formatPhoneNumber('1234567890') => "(123) 456-7890"
 * @example formatPhoneNumber('1234567890', '+1') => "+1 (123) 456-7890"
 */
export function formatPhoneNumber(phone: string, countryCode?: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 7) return phone; // Return original if too short
  
  if (cleaned.length === 10) {
    // US format: (123) 456-7890
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      const formatted = `(${match[1]}) ${match[2]}-${match[3]}`;
      return countryCode ? `${countryCode} ${formatted}` : formatted;
    }
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US format with country code: +1 (123) 456-7890
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Zimbabwe format: +263 712 345 678
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{2,3})(\d{3})(\d{3})(\d{3})$/);
    if (match) {
      const cc = countryCode || '+263';
      return `${cc} ${match[2]} ${match[3]} ${match[4]}`;
    }
  }
  
  return phone; // Return original if no match
}

/**
 * Format phone number as user types
 * Supports both US and Zimbabwe formats
 */
export function formatPhoneNumberAsYouType(value: string): string {
  if (!value) return '';
  
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 0) return value; // Return original if no digits (preserve user input)
  
  // Zimbabwe: +263 712 345 678
  if (cleaned.startsWith('263') || cleaned.length <= 11) {
    if (cleaned.length <= 3) return `+${cleaned}`;
    if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // US: (123) 456-7890
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  
  return value; // Return original if exceeds expected length
}

/**
 * Format number as currency while typing
 * Maintains proper decimal places and thousand separators
 */
export function formatCurrencyAsYouType(value: string): string {
  if (!value) return '';
  
  // Remove everything except digits and decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  if (!cleaned) return value; // Return original if no digits (preserve user input)
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return formatCurrencyAsYouType(parts[0] + '.' + parts.slice(1).join(''));
  }
  
  const [integerPart, decimalPart] = parts;
  
  // Format integer part with thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Return formatted string with up to 2 decimal places
  if (decimalPart !== undefined) {
    const limited = decimalPart.slice(0, 2);
    return `${formattedInteger}.${limited}`;
  }
  
  return formattedInteger;
}

/**
 * Parse formatted currency string back to number
 * Handles comma separators and decimal points
 * @example parseCurrencyValue("2,000") => 2000
 * @example parseCurrencyValue("1,234.56") => 1234.56
 */
export function parseCurrencyValue(value: string): number {
  // Remove everything except digits and decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date to readable format
 * @example formatDate(new Date()) => "Jan 23, 2026"
 * @example formatDate(new Date(), 'short') => "1/23/26"
 */
export function formatDate(date: Date | string, style: 'long' | 'short' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  if (style === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to readable format
 * @example formatTime(new Date()) => "2:34 PM"
 * @example formatTime(new Date(), '24h') => "14:34"
 */
export function formatTime(date: Date | string, format: '12h' | '24h' = '12h'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  if (format === '24h') {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time together
 * @example formatDateTime(new Date()) => "Jan 23, 2026 at 2:34 PM"
 */
export function formatDateTime(date: Date | string, dateStyle: 'long' | 'short' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const formattedDate = formatDate(dateObj, dateStyle);
  const formattedTime = formatTime(dateObj);
  
  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @example formatRelativeTime(new Date(Date.now() - 3600000)) => "1 hour ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Format percentage
 * @example formatPercentage(0.856) => "85.6%"
 * @example formatPercentage(0.856, 0) => "86%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations
 * @example formatNumber(1234) => "1.2K"
 * @example formatNumber(1234567) => "1.2M"
 */
export function formatNumber(num: number, decimals = 1): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  
  return num.toString();
}

/**
 * Format email to display format
 * Truncates long emails while preserving readability
 */
export function formatEmail(email: string, maxLength = 30): string {
  if (email.length <= maxLength) return email;
  
  const [localPart, domain] = email.split('@');
  const availableLength = maxLength - domain.length - 4; // -4 for "...@"
  
  if (availableLength < 1) return '...';
  
  return `${localPart.slice(0, availableLength)}...@${domain}`;
}

/**
 * Sanitize currency input - only keep digits and decimal point
 * Used for simple input cleanup without complex formatting
 */
export function sanitizeCurrency(value: string): string {
  if (!value) return '';
  return value.replace(/[^\d.]/g, '');
}

/**
 * Sanitize phone input - only keep digits
 * Used for simple input cleanup without complex formatting
 */
export function sanitizePhone(value: string): string {
  if (!value) return '';
  return value.replace(/[^\d]/g, '');
}
