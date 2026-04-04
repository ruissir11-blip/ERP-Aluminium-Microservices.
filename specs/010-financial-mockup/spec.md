# 010 - Financial App Mockup Specification

## 1. Project Overview

**Project Name:** ERP Aluminium - Financial App Mockup  
**Project Type:** Web Application (Static HTML/CSS/JS)  
**Core Functionality:** Browser-based financial dashboard mockup demonstrating accounting, dashboards, and analytics features  
**Target Users:** Stakeholders, Financial Analysts, Executives reviewing ERP capabilities

---

## 2. UI/UX Specification

### 2.1 Color Palette

| Role | Color | Hex Code |
|------|-------|----------|
| Primary | Deep Blue | #1e3a5f |
| Secondary | Steel Blue | #4a6fa5 |
| Accent | Gold | #d4a84b |
| Success | Green | #2ecc71 |
| Danger | Red | #e74c3c |
| Warning | Orange | #f39c12 |
| Background | Light Gray | #f5f7fa |
| Card Background | White | #ffffff |
| Text Primary | Dark Gray | #2c3e50 |
| Text Secondary | Medium Gray | #7f8c8d |

### 2.2 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | 'Segoe UI', system-ui, sans-serif | 600 | 28px/24px/20px/16px |
| Body | 'Segoe UI', system-ui, sans-serif | 400 | 14px |
| Numbers | 'Roboto Mono', monospace | 400 | 14px+ |

### 2.3 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo + Navigation + User Profile)                 │
├──────────┬──────────────────────────────────────────────────┤
│          │  Main Content Area                              │
│  Sidebar │  ┌────────────────────────────────────────────┐ │
│  (Nav)   │  │  Dashboard / Financial View               │ │
│          │  │  - KPI Cards                               │ │
│          │  │  - Charts                                  │ │
│          │  │  - Data Tables                             │ │
│          │  └────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

### 2.4 Responsive Breakpoints

| Device | Width | Sidebar Behavior |
|--------|-------|------------------|
| Desktop | > 1200px | Full sidebar |
| Tablet | 768px - 1200px | Collapsed sidebar |
| Mobile | < 768px | Hamburger menu |

---

## 3. Feature Specifications

### 3.1 Login Page

**Components:**
- Company logo (placeholder)
- Username input field
- Password input field
- "Remember me" checkbox
- Login button
- "Demo mode" quick access link

**Behavior:**
- Form validation on submit
- Demo mode bypasses authentication
- LocalStorage stores session preference

### 3.2 Dashboard (Main Financial View)

**KPI Cards (4 cards):**

| Card | Display | Indicators |
|------|---------|-------------|
| Total Revenue | Amount with currency | Trend arrow (up/down) |
| Total Expenses | Amount with currency | Trend arrow (up/down) |
| Net Profit | Amount + percentage | Positive/Negative indicator |
| Cash Flow | Amount with status | Inflow/Outflow indicator |

**Charts:**

| Chart | Type | Data |
|-------|------|------|
| Revenue | Line | Monthly revenue (12 months) |
| Expenses | Doughnut | Breakdown by category |

**Data Table:**
- Recent Transactions (last 10)
- Columns: Date, Description, Category, Amount, Status

**Quick Actions:**
- Add Expense button
- Generate Report button
- View Invoices button

### 3.3 Accounting Module

**Account List Table:**
| Column | Description |
|--------|-------------|
| Account Code | e.g., 1000, 2000, 3000 |
| Account Name | Descriptive name |
| Type | Asset, Liability, Equity, Revenue, Expense |
| Balance | Current balance |

**Transaction Entry Form:**
- Date picker
- Description field
- Account dropdown (debit)
- Account dropdown (credit)
- Amount field
- Submit button

**Trial Balance:**
- Two-column display
- Debit/Credit totals
- Balance verification

### 3.4 Cost Analysis

**Cost Centers:**
- Production
- Administration
- Sales
- R&D

**Visualization:**
- Bar chart comparing periods
- Grouped by cost center

**Tables:**
- Profitability by product/category
- Budget vs Actual comparison

### 3.5 Reports

**Report Types:**
- Income Statement (P&L)
- Balance Sheet
- Cash Flow Statement

**Features:**
- Date range selection
- Export to CSV button

---

## 4. Technical Implementation

### 4.1 Technology Stack

| Component | Technology |
|-----------|------------|
| HTML | HTML5 |
| CSS | CSS3 (Custom + Reset) |
| JavaScript | Vanilla ES6+ |
| Charts | Chart.js 4.x |
| Icons | FontAwesome 6.x |
| Storage | LocalStorage |

### 4.2 File Structure

```
my-project/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── app.js             # Main application logic
│   └── data.js            # Demo data and generators
└── plans/
    └── 010-financial-mockup-plan.md
```

### 4.3 Data Model

**Demo Data Structure:**

```javascript
// Accounts
const accounts = [
  { code: 1000, name: 'Cash', type: 'Asset', balance: 150000 },
  { code: 1100, name: 'Accounts Receivable', type: 'Asset', balance: 45000 },
  { code: 2000, name: 'Accounts Payable', type: 'Liability', balance: 25000 },
  // ... more accounts
];

// Transactions
const transactions = [
  { id: 1, date: '2026-03-01', description: 'Product Sale', category: 'Revenue', amount: 15000, status: 'Completed' },
  // ... more transactions
];

// KPIs
const kpis = {
  revenue: { value: 450000, trend: 12.5 },
  expenses: { value: 280000, trend: -5.2 },
  profit: { value: 170000, percentage: 37.8 },
  cashFlow: { value: 45000, status: 'Positive' }
};
```

---

## 5. Component States

### 5.1 Buttons
| State | Style |
|-------|-------|
| Default | Primary color background |
| Hover | Darken 10% |
| Active | Darken 15% |
| Disabled | 50% opacity, no pointer events |

### 5.2 Input Fields
| State | Style |
|-------|-------|
| Default | Gray border (#ddd) |
| Focus | Primary color border, subtle shadow |
| Error | Red border, error message below |
| Disabled | Light gray background |

### 5.3 Cards
- White background
- Subtle shadow (0 2px 4px rgba(0,0,0,0.1))
- Border radius: 8px
- Padding: 20px

---

## 6. Animations & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Fade in | 300ms |
| Card hover | Transform + shadow | 200ms |
| Button hover | Background color | 150ms |
| Sidebar collapse | Width + opacity | 300ms |
| Chart render | Draw animation | 1000ms |

---

## 7. Acceptance Criteria

### 7.1 Login Page
- [ ] Logo displays correctly
- [ ] Form validates required fields
- [ ] Demo mode button works
- [ ] Error messages display properly

### 7.2 Dashboard
- [ ] All 4 KPI cards display with correct formatting
- [ ] Revenue line chart renders 12 months of data
- [ ] Expense doughnut chart shows categories
- [ ] Transaction table shows last 10 entries
- [ ] Quick action buttons are clickable
- [ ] Numbers formatted with currency symbols

### 7.3 Accounting Module
- [ ] Account list displays all accounts
- [ ] Transaction form validates input
- [ ] Trial balance calculates correctly
- [ ] Search/filter works

### 7.4 Cost Analysis
- [ ] Cost centers display correctly
- [ ] Bar chart renders comparison data
- [ ] Budget vs Actual table displays

### 7.5 Reports
- [ ] All three report types generate
- [ ] Date range selection works
- [ ] CSV export downloads file

### 7.6 General
- [ ] Navigation between modules works
- [ ] Responsive design functions at all breakpoints
- [ ] No console errors
- [ ] LocalStorage persistence works

---

## 8. Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Open index.html | Login page loads |
| Click Demo mode | Dashboard displays |
| Check KPI values | Numbers formatted correctly |
| View revenue chart | Line chart with 12 data points |
| View expense chart | Doughnut with categories |
| Click Add Expense | Form modal opens |
| Submit transaction | Table updates |
| Navigate to Reports | Report views display |
| Resize to mobile | Hamburger menu appears |
| Refresh page | Data persists from LocalStorage |
