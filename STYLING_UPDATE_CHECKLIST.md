# Styling Update Checklist

## Pages to Update with New Design

### Status: ✅ Complete
- [x] `/index.html` - Login/Signup (DONE)
- [x] `/dashboard.html` - Main dashboard (DONE)
- [x] `style.css` - Global stylesheet (DONE)

### Status: ⏳ Ready to Update
All pages below follow the same pattern:

1. Add to `<head>`:
   ```html
   <link rel="stylesheet" href="/style.css">
   ```

2. Replace color scheme:
   - Old: `#667eea`, `#764ba2`, `#5568d3`
   - New: Primary colors from style.css

3. Update navbar structure to include:
   ```html
   <nav class="navbar">
     <div class="navbar-left">
       <div class="logo-container">
         <img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
       </div>
       <div class="nav-links">
         <!-- nav links -->
       </div>
     </div>
     <div class="navbar-right">
       <button class="btn-logout" onclick="logout()">Sign Out</button>
     </div>
   </nav>
   ```

4. Wrap page in:
   ```html
   <div class="page-container">
     <!-- content -->
   </div>
   ```

5. Use CSS classes instead of inline styles:
   - Buttons: `btn btn-primary`, `btn btn-secondary`
   - Cards: `card`, `card-title`
   - Forms: `form-group`
   - Alerts: `alert alert-success`, `alert alert-error`
   - Grid: `grid` or `grid-2`

## Pages Needing Updates

### Onboarding Pages
- [ ] `/kyc.html` - KYC verification
- [ ] `/funding.html` - Account funding
- [ ] `/2fa.html` - Two-factor auth (extensible)

### Account Pages
- [ ] `/accounts.html` - Account overview
- [ ] `/account-detail.html` - Single account details (extensible)
- [ ] `/transactions.html` - Transaction history (extensible)
- [ ] `/statements.html` - Download statements (extensible)
- [ ] `/activity.html` - Activity log (extensible)

### Transfer Pages
- [ ] `/transfers.html` - Money transfers
- [ ] `/beneficiaries.html` - Payee management (extensible)
- [ ] `/recurring-payments.html` - Scheduled transfers (extensible)

### Card Pages
- [ ] `/cards.html` - Card management

### Loan Pages
- [ ] `/loans.html` - Loan management

### Wealth Pages
- [ ] `/investments.html` - Portfolio (extensible)
- [ ] `/deposits.html` - Term deposits (extensible)

### Settings & Support Pages
- [ ] `/settings.html` - User settings
- [ ] `/notifications.html` - Notification center (extensible)
- [ ] `/support.html` - Help center (extensible)

### Public Pages
- [ ] `/landing.html` - Landing page

### Admin Pages
- [ ] `/admin/dashboard.html` - Admin dashboard (extensible)
- [ ] `/admin/users.html` - User management (extensible)
- [ ] `/admin/transactions.html` - Transaction approvals (extensible)
- [ ] `/admin/audit-logs.html` - Audit logs (extensible)

## Update Template

Use this template for each page update:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Name - Bank of America Style</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    /* Page-specific styles only */
  </style>
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
          <a href="/dashboard.html" class="nav-link">Dashboard</a>
          <a href="/accounts.html" class="nav-link">Accounts</a>
          <a href="/transfers.html" class="nav-link">Transfers</a>
          <a href="/cards.html" class="nav-link">Cards</a>
          <a href="/loans.html" class="nav-link">Loans</a>
        </div>
      </div>
      <div class="navbar-right">
        <div class="user-info">
          <div class="user-name" id="userName">Welcome</div>
        </div>
        <button class="btn-logout" onclick="logout()">Sign Out</button>
      </div>
    </nav>

    <div class="container">
      <!-- Page content -->
    </div>
  </div>
</body>
</html>
```

## Color Replacement Reference

### Old Colors → New Colors
- `#667eea` → `#0050D8` (secondary-blue)
- `#764ba2` → `#002D82` (primary-blue)
- `#5568d3` → `#003A99` (darker blue)
- `#f5f5f5` → `var(--background-light)` (#F5F5F5)
- `#e0e0e0` → `var(--border-gray)` (#E0E0E0)
- `#333` → `var(--text-dark)` (#1F1F1F)
- `#666` → `var(--text-gray)` (#666666)
- `#ddd` → `var(--border-gray)` (#E0E0E0)

## CSS Variable Usage

Instead of hardcoding colors, use variables:

```css
/* Good */
color: var(--primary-blue);
background: var(--light-blue);
border: 1px solid var(--border-gray);

/* Avoid */
color: #002D82;
background: #E8F0FF;
border: 1px solid #E0E0E0;
```

## Button Class Reference

```html
<!-- Primary action -->
<button class="btn btn-primary">Save</button>

<!-- Secondary action -->
<button class="btn btn-secondary">Cancel</button>

<!-- Outline style -->
<button class="btn btn-outline">Learn More</button>

<!-- Danger action -->
<button class="btn btn-danger">Delete</button>

<!-- Ghost style (transparent) -->
<button class="btn btn-ghost">Skip</button>

<!-- Logout -->
<button class="btn-logout">Sign Out</button>
```

## Form Validation Styles

```html
<!-- Success -->
<input class="valid" type="text">
<span class="alert alert-success">✓ Valid</span>

<!-- Error -->
<input class="invalid" type="text">
<span class="alert alert-error">✗ Invalid</span>

<!-- Info -->
<span class="alert alert-info">ℹ️ Information</span>
```

## Logo Sizing Reference

```css
/* Navbar logo */
.logo {
  height: 40px;
  width: auto;
  max-width: 150px;
}

/* Login page logo */
.logo-img {
  height: 50px;
  width: auto;
  margin-bottom: 16px;
}

/* Large logo (landing page) */
.logo-large {
  height: 60px;
  width: auto;
  max-width: 200px;
}
```

## Priority Update Order

1. **High Priority (Public/Core)**
   - `/landing.html` - First impression
   - `/kyc.html` - User flow
   - `/accounts.html` - Core feature
   - `/transfers.html` - Core feature

2. **Medium Priority (Feature Pages)**
   - `/cards.html`
   - `/loans.html`
   - `/settings.html`
   - `/investments.html` (if present)

3. **Low Priority (Supporting)**
   - `/admin/` pages
   - `/support.html`
   - `/notifications.html`
   - Other extensible pages

## Testing Checklist for Each Page

- [ ] Logo displays correctly
- [ ] Navigation bar styled properly
- [ ] All buttons use correct classes
- [ ] Colors match design guide
- [ ] Responsive on mobile
- [ ] Forms display correctly
- [ ] Cards have proper spacing
- [ ] Tables render well
- [ ] Alerts styled correctly
- [ ] Status badges display
- [ ] No inline styles (use CSS classes)
- [ ] All links work
- [ ] Sign out button visible
- [ ] Page header visible
- [ ] Container width correct

## Quick Update Command

For consistent updates across multiple pages:

1. Copy `/style.css` to project
2. Replace head styles with: `<link rel="stylesheet" href="/style.css">`
3. Update navbar structure
4. Replace button styles with class-based approach
5. Replace inline colors with CSS variables
6. Test and verify

## File Dependencies

All pages depend on:
- `/style.css` - Global stylesheet (REQUIRED)
- `/logo.png` - Logo file (OPTIONAL, has fallback)

Ensure these files are in `/public/` directory.

---

**Total Pages to Update:** 20+
**Estimated Time:** 2-4 hours for manual updates
**Automation Possible:** Yes, with find-replace

Start with high-priority pages and work down the list.
