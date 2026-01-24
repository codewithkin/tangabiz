# Formatting Utilities Guide

All formatting functions are centralized in [`apps/native/lib/utils.ts`](apps/native/lib/utils.ts). Import and use them throughout the app for consistent data formatting.

## Quick Reference

### Currency Formatting

```typescript
import { formatCurrency, formatCurrencyAsYouType } from '@/lib/utils';

// Display formatted currency
formatCurrency(1234.56)              // "$1,234.56"
formatCurrency(1234.56, 2, 'ZWL')    // "ZWL 1,234.56"

// Real-time formatting as user types (for input fields)
formatCurrencyAsYouType("1234")       // "1,234"
formatCurrencyAsYouType("1234.56")    // "1,234.56"
```

**Usage on new sale page (`apps/native/app/sale/new.tsx`):**
- Currency inputs use `formatCurrencyAsYouType()` in `onChangeText` for real-time formatting
- Currency displays use `formatCurrency()` for formatted output
- Examples: discount, amount paid, product prices, summary totals

### Phone Number Formatting

```typescript
import { formatPhoneNumber, formatPhoneNumberAsYouType } from '@/lib/utils';

// Display formatted phone number
formatPhoneNumber('1234567890')       // "(123) 456-7890"
formatPhoneNumber('263712345678')     // "+263 712 345 678"

// Real-time formatting as user types (for input fields)
formatPhoneNumberAsYouType("123")      // "(123"
formatPhoneNumberAsYouType("1234567")  // "(123) 456-7"
```

**Usage on new sale page:**
- Phone input uses `formatPhoneNumberAsYouType()` in `onChangeText` for real-time formatting
- When displaying customer phone, use `formatPhoneNumber()` for formatted output

### Date & Time Formatting

```typescript
import { formatDate, formatTime, formatDateTime, formatRelativeTime } from '@/lib/utils';

// Format dates
formatDate(new Date())                              // "Jan 23, 2026"
formatDate(new Date(), 'short')                     // "01/23/26"

// Format times
formatTime(new Date())                              // "2:34 PM"
formatTime(new Date(), '24h')                       // "14:34"

// Format date and time together
formatDateTime(new Date())                          // "Jan 23, 2026 at 2:34 PM"
formatDateTime(new Date(), 'short')                 // "01/23/26 at 2:34 PM"

// Format relative time
formatRelativeTime(new Date(Date.now() - 3600000))  // "1h ago"
formatRelativeTime(new Date(Date.now() - 86400000)) // "1d ago"
```

**Usage on sale details page (`apps/native/app/sale/[id]/index.tsx`):**
- Transaction timestamps use `formatDateTime()` for display
- Relative times use `formatRelativeTime()` for "time ago" display

### Number Formatting

```typescript
import { formatNumber, formatPercentage } from '@/lib/utils';

// Format large numbers with abbreviations
formatNumber(1234)                    // "1.2K"
formatNumber(1234567)                 // "1.2M"

// Format percentages
formatPercentage(0.856)               // "85.6%"
formatPercentage(0.856, 0)            // "86%"
```

### Email Formatting

```typescript
import { formatEmail } from '@/lib/utils';

// Format email for display (truncate long addresses)
formatEmail('verylongemail@example.com', 20)  // "verylonge...@example.com"
```

## Implementation Patterns

### For Input Fields with Real-Time Formatting

```typescript
const [price, setPrice] = useState('');

<TextInput
  value={price}
  onChangeText={(text) => setPrice(formatCurrencyAsYouType(text))}
  keyboardType="decimal-pad"
  placeholder="0.00"
/>
```

### For Display Values

```typescript
<Text>{formatCurrency(product.price)}</Text>
```

### For Date/Time Display

```typescript
<Text>{formatDateTime(transaction.createdAt)}</Text>
```

## Available Functions

| Function | Purpose | Real-Time | Display |
|----------|---------|-----------|---------|
| `formatCurrency()` | Format numbers as currency | ❌ | ✅ |
| `formatCurrencyAsYouType()` | Format currency while typing | ✅ | ❌ |
| `formatPhoneNumber()` | Format phone for display | ❌ | ✅ |
| `formatPhoneNumberAsYouType()` | Format phone while typing | ✅ | ❌ |
| `formatDate()` | Format date | ❌ | ✅ |
| `formatTime()` | Format time | ❌ | ✅ |
| `formatDateTime()` | Format date and time | ❌ | ✅ |
| `formatRelativeTime()` | Format relative time | ❌ | ✅ |
| `formatNumber()` | Format large numbers | ❌ | ✅ |
| `formatPercentage()` | Format percentages | ❌ | ✅ |
| `formatEmail()` | Format email addresses | ❌ | ✅ |

## Pages Currently Using Formatters

1. **[`apps/native/app/sale/new.tsx`](apps/native/app/sale/new.tsx)** - New sale creation form
   - ✅ Currency input formatting (real-time)
   - ✅ Phone input formatting (real-time)
   - ✅ Currency display formatting

2. **[`apps/native/app/sale/[id]/index.tsx`](apps/native/app/sale/%5Bid%5D/index.tsx)** - Sale details page
   - ✅ Currency display formatting
   - ✅ Date/time formatting
   - ✅ Item pricing formatting

## Future Implementation Areas

Apply formatters to these pages as they're updated:

- Dashboard (`(drawer)/index.tsx`) - Replace inline `formatCurrency` with imported version
- Transactions list - Use `formatCurrency()` and `formatDateTime()`
- Products page - Use `formatCurrency()` for prices
- Customers page - Use `formatPhoneNumber()` for display
- Reports page - Use `formatCurrency()`, `formatDate()`, `formatPercentage()`
- Any time-based displays - Use `formatRelativeTime()` or `formatDateTime()`
