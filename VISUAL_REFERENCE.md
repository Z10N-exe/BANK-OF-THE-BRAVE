# Visual Reference & Quick Start

## Color Swatches

```
PRIMARY BLUE          SECONDARY BLUE        LIGHT BLUE
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  #002D82     │      │  #0050D8     │      │  #E8F0FF     │
│              │      │              │      │              │
│ Dark theme   │      │ Buttons      │      │ Backgrounds  │
│ Headers      │      │ Links        │      │ Badges       │
└──────────────┘      └──────────────┘      └──────────────┘

SUCCESS GREEN         WARNING YELLOW        DANGER RED
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  #107C10     │      │  #FFB900     │      │  #D13438     │
│              │      │              │      │              │
│ Confirmations│      │ Warnings     │      │ Errors       │
│ Success      │      │ Alerts       │      │ Destructive  │
└──────────────┘      └──────────────┘      └──────────────┘

TEXT DARK             TEXT GRAY             BORDER GRAY
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  #1F1F1F     │      │  #666666     │      │  #E0E0E0     │
│              │      │              │      │              │
│ Main text    │      │ Secondary    │      │ Borders      │
│ Headers      │      │ Descriptions │      │ Dividers     │
└──────────────┘      └──────────────┘      └──────────────┘

BACKGROUND WHITE     BACKGROUND LIGHT
┌──────────────┐      ┌──────────────┐
│              │      │              │
│  #FFFFFF     │      │  #F5F5F5     │
│              │      │              │
│ Main bg      │      │ Hover bg     │
│ Cards        │      │ Forms        │
└──────────────┘      └──────────────┘
```

## Typography Scale

```
HEADING 1                    HEADING 2                    HEADING 3
Font: System                 Font: System                 Font: System
Size: 32px                   Size: 22px                   Size: 18px
Weight: 700 (Bold)          Weight: 700 (Bold)          Weight: 700 (Bold)
Color: #1F1F1F              Color: #1F1F1F              Color: #1F1F1F
───────────────────────────────────────────────────────────────────

BODY TEXT                    SMALL TEXT                   BUTTON TEXT
Font: System                 Font: System                 Font: System
Size: 14px                   Size: 12px                   Size: 13px
Weight: 400 (Regular)       Weight: 400 (Regular)       Weight: 600 (Semi-Bold)
Color: #1F1F1F              Color: #666666              Color: #FFFFFF (on blue)
───────────────────────────────────────────────────────────────────
```

## Component Examples

### BUTTONS

```
PRIMARY BUTTON               SECONDARY BUTTON            OUTLINE BUTTON
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Save Changes   │        │   Cancel         │        │   Learn More     │
└──────────────────┘        └──────────────────┘        └──────────────────┘
BG: #0050D8                 BG: #F5F5F5                 BG: Transparent
Text: White                 Text: #1F1F1F               Text: #0050D8
Border: None                Border: 1px #E0E0E0        Border: 1px #0050D8

  ↓ HOVER STATE              ↓ HOVER STATE               ↓ HOVER STATE
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Save Changes   │        │   Cancel         │        │   Learn More     │
└──────────────────┘        └──────────────────┘        └──────────────────┘
BG: #002D82                 BG: #EFEFEF                 BG: #E8F0FF
Shadow: 0 2px 8px           Border: 1px #D0D0D0        Text: #0050D8
```

### CARDS

```
┌─────────────────────────────────────────────┐
│  Card Title                                 │
│ ─────────────────────────────────────────── │
│                                             │
│  Card content goes here                     │
│  With proper spacing and styling            │
│                                             │
│  • Bullet point                             │
│  • Another point                            │
│                                             │
└─────────────────────────────────────────────┘
BG: #FFFFFF
Border: 1px #E0E0E0
Shadow: 0 1px 3px rgba(0,0,0,0.08)
Padding: 24px
Border-radius: 4px
```

### FORMS

```
Label Text                           Label Text
┌──────────────────────┐            ┌──────────────────────┐
│ user@example.com     │            │ ••••••••             │
└──────────────────────┘            └──────────────────────┘
Border: 1px #E0E0E0        
Background: #FFFFFF
Padding: 10px 12px
Border-radius: 4px

  ↓ FOCUSED STATE          ↓ FOCUSED STATE
┌──────────────────────┐  ┌──────────────────────┐
│ user@example.com     │  │ ••••••••             │
└──────────────────────┘  └──────────────────────┘
Border: 1px #0050D8
Shadow: 0 0 0 3px #E8F0FF
```

### ALERTS

```
SUCCESS ALERT                              ERROR ALERT
┬─────────────────────────────────────┐   ┬─────────────────────────────────────┐
│ ✓ Successfully saved changes         │   │ ✗ Unable to process request         │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
BG: #E1F5E1                               BG: #FEE8E8
Text: #107C10                             Text: #D13438
Border-left: 4px #107C10                  Border-left: 4px #D13438

WARNING ALERT                              INFO ALERT
┬─────────────────────────────────────┐   ┬─────────────────────────────────────┐
│ ⚠ Please review before proceeding    │   │ ℹ This account requires verification│
└─────────────────────────────────────┘   └─────────────────────────────────────┘
BG: #FFF4CE                               BG: #E8F0FF
Text: #B3960F                             Text: #002D82
Border-left: 4px #FFB900                  Border-left: 4px #0050D8
```

### STATUS BADGES

```
ACTIVE              PENDING             ERROR               INFO
┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
│ Active  │        │Pending  │        │ Error   │        │  Info   │
└─────────┘        └─────────┘        └─────────┘        └─────────┘
#E1F5E1            #FFF4CE            #FEE8E8            #E8F0FF
#107C10            #B3960F            #D13438            #002D82
```

### ACCOUNT CARD

```
┌──────────────────────────────────────────────────┐
│ CHECKING                                    USD  │
├──────────────────────────────────────────────────┤
│                                                  │
│  $12,456.78                                      │
│                                                  │
│  IBAN: DE89370400440532013000                   │
│  Account: 123456789                             │
│                                                  │
│  ┌─────────────┐         ┌─────────────┐       │
│  │ Send Money  │         │ Issue Card  │       │
│  └─────────────┘         └─────────────┘       │
└──────────────────────────────────────────────────┘
```

### TRANSACTION ITEM

```
Wire Transfer                                          -$500.00
Sent to John Doe • Feb 15, 2026                       COMPLETED
```

### NAVIGATION BAR

```
┌──────────────────────────────────────────────────────────────────────┐
│  🏦 Logo  Dashboard  Accounts  Transfers  Cards  Loans    User  Sign Out│
└──────────────────────────────────────────────────────────────────────┘
BG: #FFFFFF
Border-bottom: 1px #E0E0E0
Padding: 12px 40px
Height: Auto (40px min)
```

## Responsive Breakpoints

```
MOBILE                 TABLET                 DESKTOP
< 768px               768px - 1199px         1200px+
────────────────────────────────────────────────────────

Single Column         2 Columns              3+ Columns
Full-width buttons   Centered content       Max-width 1200px
20px padding         40px padding           40px padding
Hamburger menu       Standard nav           Full nav
```

## Button Size Reference

```
SMALL               MEDIUM              LARGE
┌──────┐           ┌──────────┐        ┌────────────┐
│Click │           │  Save    │        │Save Changes│
└──────┘           └──────────┘        └────────────┘
8px 12px           10px 20px            11px 24px
Height: 28px       Height: 32px         Height: 36px
Font: 12px         Font: 13px           Font: 14px
```

## Spacing System

```
4px  (xs)    - Used for micro spacing within components
8px  (sm)    - Small gaps between elements
12px (md)    - Standard spacing
16px (lg)    - Medium spacing
20px (xl)    - Large spacing
24px (2xl)   - Extra large spacing
32px (3xl)   - Major spacing between sections
40px (4xl)   - Page-level spacing
```

## Shadow Elevation

```
LEVEL 0 (No shadow)     LEVEL 1 (Subtle)        LEVEL 2 (Medium)
None                    0 1px 3px               0 4px 12px
                        rgba(0,0,0,0.08)        rgba(0,0,0,0.12)

LEVEL 3 (Strong)        LEVEL 4 (Very Strong)
0 8px 16px              0 8px 32px
rgba(0,0,0,0.15)        rgba(0,0,0,0.15)
```

## Focus States

```
DEFAULT                         FOCUSED
┌──────────────────┐           ┌──────────────────┐
│ user@email.com   │           │ user@email.com   │
└──────────────────┘           └──────────────────┘
Border: #E0E0E0               Border: #0050D8
Shadow: none                  Shadow: 0 0 0 3px #E8F0FF
                              Outline: none
```

## Hover States

```
BUTTON HOVER           LINK HOVER            CARD HOVER
┌──────────┐          Underlined Link       ┌──────────┐
│ Button   │          Text: #0050D8        │  Card    │
└──────────┘          Decoration: underline│  Content │
BG: Darker            └──────────────────┘ └──────────┘
Shadow: Expanded      Border: #0050D8      Shadow: Expanded
Scale: 1.02           Shadow: 0 2px 8px
```

## Loading States

```
DISABLED BUTTON        LOADING TEXT           PLACEHOLDER
┌──────────┐          Loading...             ────────────
│  Save    │          Spinner animation      Skeleton
└──────────┘                                 Loading
BG: #C8C8C8
Text: #999999
Cursor: not-allowed
```

## Active States

```
ACTIVE TAB             SELECTED OPTION        ACTIVE LINK
Tab Name               ✓ Selected Option      Current Page
───────────            Highlight color       Underline
Border-bottom: Blue    BG: Light blue         Color: Blue
```

---

**Design System:** Bank of America Inspired
**Status:** ✅ Complete
**Ready for:** Implementation

All components are production-ready and tested!
