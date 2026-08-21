# Bank of America Style Design Guide

## Color Palette

### Primary Colors
- **Primary Blue**: `#002D82` - Main brand color, headers, primary actions
- **Secondary Blue**: `#0050D8` - Buttons, links, hover states
- **Light Blue**: `#E8F0FF` - Backgrounds, badges, highlights

### Accent & Status
- **Accent Yellow**: `#FFB81C` - Highlights, special features
- **Success Green**: `#107C10` - Positive actions, confirmations
- **Warning Yellow**: `#FFB900` - Alerts, warnings
- **Danger Red**: `#D13438` - Errors, destructive actions

### Neutral
- **Text Dark**: `#1F1F1F` - Primary text
- **Text Gray**: `#666666` - Secondary text
- **Text Light Gray**: `#999999` - Tertiary text
- **Border Gray**: `#E0E0E0` - Borders, dividers
- **Background White**: `#FFFFFF` - Main background
- **Background Light**: `#F5F5F5` - Secondary background

## Typography

### Font Family
- Primary: System fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Helvetica Neue`)
- Monospace: For codes/numbers

### Font Sizes & Weights
- **H1**: 32px, weight 700
- **H2**: 22px, weight 700
- **H3**: 18px, weight 700
- **Body**: 14px, weight 400
- **Small**: 12px, weight 400
- **Button**: 13px, weight 600

## Components

### Navigation Bar
- Background: White (#FFFFFF)
- Border Bottom: 1px solid #E0E0E0
- Height: Auto (12px padding)
- Logo: 40px height, left-aligned
- Nav Links: 14px, dark text, blue underline on hover

### Buttons

#### Primary Button
```css
background: #0050D8
color: white
padding: 11px 24px
border-radius: 4px
font-weight: 600
```

#### Secondary Button
```css
background: #F5F5F5
color: #1F1F1F
border: 1px solid #E0E0E0
padding: 10px 20px
border-radius: 4px
```

#### Outline Button
```css
background: transparent
border: 1px solid #0050D8
color: #0050D8
```

### Cards
- Background: White
- Border: 1px solid #E0E0E0
- Border Radius: 4px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.08)

### Forms
- Input Background: White
- Input Border: 1px solid #E0E0E0
- Input Padding: 10px 12px
- Input Border Radius: 4px
- Focus: Blue border + light blue shadow
- Label: 13px, weight 600, margin bottom 6px

### Modals
- Background Overlay: rgba(0,0,0,0.5)
- Card Background: White
- Border Radius: 8px
- Padding: 32px
- Max Width: 500px
- Shadow: 0 8px 32px rgba(0,0,0,0.15)

## Spacing System

```
4px   - xs
8px   - sm
12px  - md
16px  - lg
20px  - xl
24px  - 2xl
32px  - 3xl
40px  - 4xl
```

## Logo Usage

### Requirements
1. Place logo in `/public/logo.png`
2. Height: 40px in navbar
3. Height: 50px on login page
4. Always left-aligned
5. Maintain aspect ratio
6. Add onerror fallback to hide if not found

### Placement
- Navigation bar: Left side
- Login page: Center, above title
- All authenticated pages: Top left of navbar

## Icon Standards

Use emoji for simplicity or Font Awesome equivalent:
- 💰 Money/Balance
- 🏦 Bank/Buildings
- 💳 Cards
- 📤 Send
- 📥 Receive
- 🔒 Security
- ⚙️ Settings
- 🔔 Notifications
- ❌ Error/Close
- ✓ Success/Check
- ⚠️ Warning

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1199px
- Desktop: 1200px+

### Mobile Adjustments
- Single column layouts
- Full-width buttons
- Reduced padding (20px instead of 40px)
- Smaller fonts where appropriate
- Simplified navigation

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus states on all interactive elements
- Semantic HTML (nav, main, section)
- ARIA labels where needed
- Keyboard navigation support

## Usage Instructions

### In HTML Head
```html
<link rel="stylesheet" href="/style.css">
```

### Common Classes

#### Layout
```html
<div class="container">
<div class="grid">
<div class="grid-2">
<div class="flex">
<div class="flex-between">
```

#### Cards & Content
```html
<div class="card">
  <div class="card-title">Title</div>
  ...content...
</div>
```

#### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-danger">Danger</button>
```

#### Alerts
```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-error">Error message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-info">Info message</div>
```

#### Badges/Status
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-pending">Pending</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

#### Forms
```html
<div class="form-group">
  <label>Label</label>
  <input type="text">
</div>
```

#### Utility Classes
```html
.text-center      - Center text
.text-right       - Right-align text
.mt-20/.mb-20     - Margin top/bottom
.mt-40/.mb-40     - Larger margins
.hidden           - Display none
.w-full           - Width 100%
.gap-12/.gap-24   - Gap spacing
.divider          - Border divider
```

## Page Structure Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="page-container">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="navbar-left">
        <div class="logo-container">
          <img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
        </div>
        <div class="nav-links">
          <a href="#" class="nav-link">Link</a>
        </div>
      </div>
      <div class="navbar-right">
        <button class="btn-logout" onclick="logout()">Sign Out</button>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container">
      <div class="page-header">
        <h1>Page Title</h1>
        <p>Page description</p>
      </div>

      <!-- Content goes here -->
    </div>
  </div>
</body>
</html>
```

## Logo Integration

### Step 1: Place Logo File
Save your `logo.png` file in `/public/` directory

### Step 2: Reference in HTML
```html
<img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
```

### Step 3: CSS Sizing
```css
.logo {
  height: 40px;  /* navbar */
  width: auto;
  max-width: 150px;
}
```

## Banking UI Patterns

### Account Card
```html
<div class="account-card">
  <div class="account-header">
    <span class="account-type">CHECKING</span>
    <span>USD</span>
  </div>
  <div class="account-balance">$1,234.56</div>
  <div class="account-details">
    <div>IBAN: DE89...</div>
    <div>Account: 123456</div>
  </div>
</div>
```

### Transaction Item
```html
<tr>
  <td>Wire Transfer</td>
  <td>Jan 15, 2026</td>
  <td>-$500.00</td>
  <td><span class="badge badge-success">Completed</span></td>
</tr>
```

### Balance Display
```html
<div class="balance-card">
  <div class="balance-label">TOTAL BALANCE</div>
  <div class="balance-amount">$12,345.67</div>
</div>
```

## Animation & Transitions

- Standard transition: `0.3s ease`
- Hover effects: Subtle color/shadow changes
- Focus states: Visible blue border/shadow
- Loading states: Opacity changes, not full reload

## Best Practices

1. **Always include logo with onerror fallback**
2. **Use semantic HTML (nav, main, section, article)**
3. **Maintain 40px navbar height minimum**
4. **Keep container max-width at 1200px**
5. **Use CSS classes, not inline styles**
6. **Follow color palette exactly**
7. **Test on mobile before deployment**
8. **Ensure form labels are always visible**
9. **Use proper button types (button, submit, reset)**
10. **Validate form inputs server-side and client-side**

---

**Version:** 1.0.0
**Last Updated:** August 21, 2026
**Status:** Production Ready
