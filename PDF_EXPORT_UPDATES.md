# PDF Export Updates - ManageBookings

## Changes Made:

### 1. **Grouped Bookings by Person**
   - **Without Filter:** When no ritual filter is applied, bookings remain grouped by person
   - If Jagan books Pushpanjali + Payasam, they appear together in one table under Jagan's name
   - **With Filter:** When a ritual filter is applied, bookings are split into individual entities
   - If filtering for "Pushpanjali", only Pushpanjali bookings are shown as separate entities

### 2. **Malayalam Text Support**
   - The Naal column width has been increased to accommodate Malayalam text
   - Malayalam text will display as Unicode characters in the PDF
   - The PDF viewer's installed fonts will be used to render Malayalam text correctly
   - Most modern PDF viewers support Malayalam Unicode rendering by default

### 3. **Cost Calculation**
   - Each ritual maintains its proper individual cost based on:
     - Ritual price
     - Quantity
     - Subscription frequency multiplier
   - Total cost shown is accurate whether grouped or separated

## How It Works:

### Without Ritual Filter (Default/All Bookings):
```
Booking 1: Jagan (Self)
Email: jagan@example.com  Phone: 999999  Booked: 02/10/2025
Total: Rs. 250.00

┌─────────────┬─────┬─────────┬──────────┬────────────┬──────────────┐
│ Ritual      │ Qty │ Devotee │ Naal     │ DOB        │ Subscription │
├─────────────┼─────┼─────────┼──────────┼────────────┼──────────────┤
│ Pushpanjali │ 1   │ Nevin   │ പുണർത്ഥം│ 2023-06-02 │ one-time     │
│ Payasam     │ 1   │ Devan   │ തൃക്കേട്ട│ 2012-02-02 │ one-time     │
└─────────────┴─────┴─────────┴──────────┴────────────┴──────────────┘
```

### With Ritual Filter (e.g., "Pushpanjali"):
```
Booking 1: Jagan (Self)
Email: jagan@example.com  Phone: 999999  Booked: 02/10/2025
Total: Rs. 100.00

┌─────────────┬─────┬─────────┬──────────┬────────────┬──────────────┐
│ Ritual      │ Qty │ Devotee │ Naal     │ DOB        │ Subscription │
├─────────────┼─────┼─────────┼──────────┼────────────┼──────────────┤
│ Pushpanjali │ 1   │ Nevin   │ പുണർത്ഥം│ 2023-06-02 │ one-time     │
└─────────────┴─────┴─────────┴──────────┴────────────┴──────────────┘
```

## Setup Required:

**No additional setup required!**

The Malayalam text will display correctly in most modern PDF viewers (Adobe Reader, Chrome, Firefox, Edge, etc.) as they support Unicode Malayalam characters natively.

## Technical Details:

- Bookings are processed conditionally based on whether a ritual filter is active
- When no filter: bookings remain grouped with all rituals in a single table
- When filtered: bookings are flattened into individual ritual entities
- Naal column width increased from 22mm to 28mm for better Malayalam text display
- Malayalam text stored as UTF-8 Unicode in PDF
- No custom font embedding needed - relies on PDF viewer's font rendering
- No changes to UI components or other files - only ManageBookings.tsx modified
