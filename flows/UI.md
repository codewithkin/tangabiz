# Tangabiz UI Style Guide

## Core Philosophy

**Three words define our UI:**
1. **Clean** - Minimal clutter, generous whitespace, clear hierarchy
2. **Fluid** - Smooth interactions, natural animations, responsive layouts
3. **Simple** - Intuitive navigation, straightforward patterns, no unnecessary complexity

## Design Inspiration

We draw inspiration from **Gumroad's** approach to UI design:
- Emphasis on content over chrome
- Subtle, purposeful use of color
- Card-based layouts with soft shadows
- Generous padding and breathing room
- Muted backgrounds that let content shine

---

## Visual Language

### Color Philosophy

**Brand Colors** (Used sparingly for impact)
- Yellow (`#facc15` / yellow-400) - "Tanga"
- Green (`#16a34a` / green-600) - "biz"

**Neutral Palette** (Primary UI)
- Background: Soft gray gradients (`from-gray-50 to-gray-100`)
- Cards: Pure white with subtle shadows
- Text: Dark gray hierarchy (gray-900 → gray-600 → gray-400)
- Borders: Minimal, light gray-200

**Accent Colors** (Feedback & States)
- Success: Green-50 backgrounds with green-800 text
- Warning: Yellow-50 backgrounds with yellow-800 text
- Error: Red-50 backgrounds with red-600 text
- Hover: Gray-300/50 (semi-transparent)

### Typography

**Font**: Poppins (Google Fonts)
- Clean, modern, excellent readability
- Friendly without being playful
- Professional without being corporate

**Hierarchy**:
```
Page Title:     text-3xl font-bold
Section Title:  text-2xl font-semibold
Card Title:     text-xl font-semibold
Body:           text-base font-normal
Label:          text-sm font-medium
Muted:          text-xs text-muted-foreground
```

### Spacing

**Generous whitespace is key**:
- Page padding: `p-6` or `p-8`
- Card padding: `p-6` or `p-8`
- Section gaps: `space-y-6` or `space-y-8`
- Element gaps: `gap-4` or `gap-6`

---

## Component Patterns

### Cards

**The foundation of our UI**:
```tsx
<Card className="border-0 shadow-lg">
  <CardHeader className="pb-2">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Characteristics**:
- No borders (`border-0`)
- Soft shadows (`shadow-lg`)
- Rounded corners (`rounded-xl`)
- White background against gradient
- Ample padding

### Buttons

**Primary Actions** (Green):
```tsx
<Button className="bg-green-600 hover:bg-green-700">
  Continue
</Button>
```

**Secondary Actions** (Ghost):
```tsx
<Button variant="ghost">
  Cancel
</Button>
```

**Characteristics**:
- Clear visual hierarchy
- Generous click targets (h-12 minimum)
- Smooth hover transitions
- Icons paired with text when needed

### Inputs

**Form Fields**:
```tsx
<Input 
  className="h-12" 
  placeholder="Clear placeholder text"
/>
```

**Characteristics**:
- Comfortable height (h-12)
- Subtle borders that strengthen on focus
- Clear placeholder text
- Proper label association

### Navigation

**Sidebar**:
- Icon-first for scanability
- Clean hover states (gray-300/50)
- Collapsible for focus
- Fixed position, scrollable content

**Top Bar**:
- Minimal, functional
- Breadcrumbs or page title
- User menu and actions right-aligned

---

## Layout Principles

### Page Structure

```
┌─────────────────────────────────────┐
│  Gradient Background (subtle)       │
│  ┌───────────────────────────────┐  │
│  │  White Card (shadow-lg)       │  │
│  │                               │  │
│  │  Content with breathing room  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Grid Layouts

**Dashboard Cards**:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Cards */}
</div>
```

**Key Principles**:
- Responsive breakpoints (mobile → tablet → desktop)
- Consistent gaps (gap-4 or gap-6)
- Natural content flow

---

## Micro-interactions

### Hover States
- Subtle background changes (`hover:bg-gray-50`)
- Slight scale on interactive elements
- Smooth transitions (`transition-colors`, `transition-all`)

### Loading States
- Skeleton screens for content loading
- Spinner icons for button actions
- Progress indicators where appropriate

### Feedback
- Toast notifications (via Sonner)
- Inline validation messages
- Success confirmations

---

## Responsive Design

### Mobile-First Approach
1. Design for mobile (single column)
2. Enhance for tablet (2 columns)
3. Optimize for desktop (3-4 columns)

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Sidebar Behavior
- Mobile: Overlay (offcanvas)
- Tablet: Collapsed to icons
- Desktop: Expanded with labels

---

## Background Elements

### Gradient Base
```tsx
className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
```

### Decorative Blobs (Subtle)
```tsx
<div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
```

**Purpose**: Add visual interest without distraction

---

## Anti-Patterns (What to Avoid)

❌ **Don't**:
- Use borders everywhere (rely on shadow and whitespace)
- Over-animate (keep it subtle)
- Crowd content (generous spacing always)
- Use bright colors for large areas (reserve for accents)
- Add unnecessary chrome or decorations
- Create complex navigation hierarchies

✅ **Do**:
- Use whitespace to create hierarchy
- Let content breathe
- Keep interactions predictable
- Use color purposefully
- Maintain visual consistency
- Prioritize readability

---

## Reference: Auth Page (Our Gold Standard)

The auth page perfectly embodies our UI philosophy:

```tsx
// Clean gradient background
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  
  // Subtle decorative elements
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute ... bg-yellow-500/10 rounded-full blur-3xl" />
    <div className="absolute ... bg-green-600/10 rounded-full blur-3xl" />
  </div>
  
  // Content card with no border, soft shadow
  <Card className="shadow-lg border-0">
    <CardHeader className="text-center pb-2">
      // Brand colors used sparingly
      <CardTitle>
        <span className="text-yellow-400">Tanga</span>
        <span className="text-green-600">biz</span>
      </CardTitle>
      <CardDescription>Smart POS for Smart Business</CardDescription>
    </CardHeader>
    
    <CardContent>
      // Generous spacing, clear hierarchy
      <form className="space-y-6">
        // Comfortable input height
        <Input className="h-12" />
        
        // Strong, clear CTA
        <Button className="w-full h-12 bg-green-600">
          Continue
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
```

**Key Takeaways**:
1. Gradient background provides subtle depth
2. Cards float with soft shadows, no borders
3. Brand colors used for logo only
4. Generous spacing throughout
5. Clear visual hierarchy
6. Simple, focused interactions

---

## Implementation Checklist

When creating new pages or components:

- [ ] Use gradient background (`bg-gradient-to-br from-gray-50 to-gray-100`)
- [ ] Cards have `shadow-lg border-0`
- [ ] Generous spacing (`space-y-6`, `p-6`)
- [ ] Inputs are `h-12` minimum
- [ ] Brand colors used sparingly (logo, primary CTAs)
- [ ] Clear typographic hierarchy
- [ ] Hover states use `gray-300/50` or subtle backgrounds
- [ ] Mobile-responsive grid layouts
- [ ] Decorative blobs positioned fixed, low opacity

---

## Living Document

This guide evolves as we build. The auth page is our north star—when in doubt, reference its clean, fluid, simple approach.

**Last Updated**: January 1, 2026
