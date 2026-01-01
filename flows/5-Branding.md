# Tangabiz - Branding Guidelines

## Brand Identity

### Name
**Tangabiz** - A modern POS system for Zimbabwean SMEs

### Tagline Options
- "Your Business, Simplified"
- "Smart POS for Smart Business"
- "Powering Zimbabwe's SMEs"

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#2563EB` | Buttons, links, accents |
| **Primary Dark** | `#1D4ED8` | Hover states |
| **Primary Light** | `#3B82F6` | Highlights |

### Secondary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Secondary** | `#10B981` | Success, positive actions |
| **Warning** | `#F59E0B` | Warnings, pending states |
| **Error** | `#EF4444` | Errors, destructive actions |

### Neutral Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Gray 900** | `#111827` | Primary text |
| **Gray 700** | `#374151` | Secondary text |
| **Gray 500** | `#6B7280` | Muted text |
| **Gray 200** | `#E5E7EB` | Borders |
| **Gray 100** | `#F3F4F6` | Background |
| **White** | `#FFFFFF` | Cards, surfaces |

### Zimbabwe-Inspired Accent (Optional)

| Color | Hex | Usage |
|-------|-----|-------|
| **Gold** | `#FFD700` | Premium features, highlights |
| **Green** | `#228B22` | Local branding accents |

---

## Typography

### Font Family

**Primary**: Inter (Google Fonts)
- Clean, modern, excellent readability
- Great for both UI and content

**Fallback**: system-ui, -apple-system, sans-serif

### Font Sizes

| Size | Tailwind | Usage |
|------|----------|-------|
| 12px | `text-xs` | Labels, captions |
| 14px | `text-sm` | Body text, inputs |
| 16px | `text-base` | Default body |
| 18px | `text-lg` | Subheadings |
| 20px | `text-xl` | Section titles |
| 24px | `text-2xl` | Page titles |
| 30px | `text-3xl` | Hero text |

### Font Weights

| Weight | Tailwind | Usage |
|--------|----------|-------|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Labels, emphasis |
| 600 | `font-semibold` | Headings, buttons |
| 700 | `font-bold` | Strong emphasis |

---

## Logo

### Logo Concept

```
┌─────────────────────────────────────────┐
│                                         │
│    📊  Tangabiz                         │
│                                         │
│    [Icon: Stylized receipt/chart]       │
│                                         │
└─────────────────────────────────────────┘
```

### Logo Variants

1. **Full Logo**: Icon + Wordmark
2. **Icon Only**: For favicon, mobile
3. **Wordmark Only**: For text-heavy contexts

### Logo Sizing

| Context | Size |
|---------|------|
| Favicon | 32x32px |
| Mobile Header | 40px height |
| Desktop Header | 48px height |
| Marketing | 64px+ height |

---

## UI Components Style

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #E5E7EB;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}
```

### Cards

```css
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
```

### Input Fields

```css
.input {
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.input:focus {
  border-color: #2563EB;
  outline: none;
  ring: 2px solid rgba(37, 99, 235, 0.2);
}
```

---

## Iconography

### Icon Library
**Lucide React** - Clean, consistent icons

### Common Icons

| Action | Icon |
|--------|------|
| Dashboard | `LayoutDashboard` |
| Sales | `ShoppingCart` |
| Customers | `Users` |
| Reports | `FileText` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Billing | `CreditCard` |
| Team | `UserPlus` |
| Logout | `LogOut` |
| Search | `Search` |
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Success | `CheckCircle` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |
| Lock | `Lock` |

---

## Layout Guidelines

### Spacing Scale (Tailwind)

| Size | Value | Usage |
|------|-------|-------|
| 1 | 4px | Tight spacing |
| 2 | 8px | Related elements |
| 3 | 12px | Standard gap |
| 4 | 16px | Section padding |
| 6 | 24px | Card padding |
| 8 | 32px | Section margins |
| 12 | 48px | Large sections |

### Container Widths

| Breakpoint | Max Width |
|------------|-----------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

### Sidebar Width
- Collapsed: 64px
- Expanded: 256px

---

## Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Logo          Search                          User Menu     │
├─────────┬────────────────────────────────────────────────────┤
│         │                                                    │
│  📊     │                                                    │
│  🛒     │              Main Content Area                     │
│  👥     │                                                    │
│  📈     │                                                    │
│  📄     │                                                    │
│  ⚙️     │                                                    │
│         │                                                    │
│         │                                                    │
├─────────┴────────────────────────────────────────────────────┤
│  Footer (optional)                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

### Breakpoints

| Screen | Breakpoint | Sidebar |
|--------|------------|---------|
| Mobile | < 768px | Hidden (hamburger) |
| Tablet | 768px - 1024px | Collapsed icons |
| Desktop | > 1024px | Full expanded |

### Mobile Considerations

- Bottom navigation for key actions
- Collapsible sections
- Touch-friendly targets (min 44px)
- Simplified tables → card lists

---

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## Implementation Checklist

- [ ] Set up Tailwind with custom theme
- [ ] Import Inter font
- [ ] Create design system components
  - [ ] Button variants
  - [ ] Card component
  - [ ] Input fields
  - [ ] Modal/Dialog
  - [ ] Toast notifications
- [ ] Create layout components
  - [ ] Sidebar
  - [ ] Header
  - [ ] Page container
- [ ] Add Lucide React icons
- [ ] Create responsive breakpoints
- [ ] Design logo/favicon
