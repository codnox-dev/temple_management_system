# Nakshatrapooja Feature Implementation

## Overview
The Nakshatrapooja feature has been successfully implemented in the Temple Management System. This special ritual is different from other rituals and includes custom styling, naal-to-date mapping using the calendar system, and special booking fields.

## Key Features

### 1. **Special Visual Identity**
- **Custom Color**: Nakshatrapooja rituals are displayed with a special orange-red color (#FF6B35)
- **Special Badge**: Shows a "Special" badge on both ritual cards and booking forms
- **Enhanced Styling**: Custom borders, shadows, and background colors to distinguish it from regular rituals

### 2. **Calendar Integration**
- **Naal-to-Date Mapping**: Automatically finds the date corresponding to a selected Naal (birth star) from the calendar
- **Date Range Options**:
  - **This Month**: Searches for the naal in the current month
  - **This Year**: Searches for the naal in the current year
  - **Custom Range**: Allows users to specify a custom date range

### 3. **Smart Date Selection**
- When a user books Nakshatrapooja and selects their Naal, the system:
  1. Checks the selected date range
  2. Queries the calendar for the first occurrence of that Naal
  3. Automatically assigns that date to the booking
  4. Displays an error if the Naal is not found in the calendar

## Technical Implementation

### Backend Changes

#### 1. **Database Models** (`backend/app/models/ritual_models.py`)
Added new fields to `AvailableRitualBase`:
```python
is_nakshatrapooja: Optional[bool] = Field(False)
nakshatrapooja_color: Optional[str] = Field(None, example="#FF6B35")
```

Added new fields to `RitualInstance`:
```python
date_range_type: Optional[str] = Field(None, example="this_month")
custom_range_start: Optional[str] = Field(None, example="2025-01-01")
custom_range_end: Optional[str] = Field(None, example="2025-12-31")
calculated_date: Optional[str] = Field(None, example="2025-10-25")
```

#### 2. **Startup Initialization** (`backend/app/main.py`)
- Automatically creates/updates Nakshatrapooja ritual on server startup
- Sets special fields: `is_nakshatrapooja=True`, `nakshatrapooja_color='#FF6B35'`

#### 3. **Calendar Service** (`backend/app/services/calendar_service.py`)
New function `search_naal_in_date_range()`:
- Searches for a specific Naal within a date range
- Returns the first matching date from the calendar
- Used by booking services to map Naal to actual dates

#### 4. **Calendar Router** (`backend/app/routers/calendar.py`)
New endpoint `/v1/calendar/naal-to-date`:
- Accepts: `naal`, `start_date`, `end_date`
- Returns: The first date where the Naal occurs
- Returns 404 if Naal not found in the range

#### 5. **Booking Services** 
Updated both `booking_service.py` and `employee_booking_service.py`:
- Detects Nakshatrapooja rituals during booking creation
- Calculates date ranges based on `date_range_type`
- Calls `search_naal_in_date_range()` to find the actual date
- Sets `calculated_date` in the instance
- Throws appropriate errors if Naal not found

#### 6. **Dependencies** (`backend/requirements.txt`)
Added: `python-dateutil>=2.8.0` for advanced date calculations

### Frontend Changes

#### 1. **Ritual Booking Page** (`frontend/src/pages/RitualBooking.tsx`)
- Updated TypeScript interfaces to include Nakshatrapooja fields
- Added custom styling for Nakshatrapooja ritual cards (special border, shadow, color)
- Added "Special" badge to Nakshatrapooja rituals
- Added date range selector UI:
  - Radio options: This Month, This Year, Custom Range
  - Custom date pickers for start/end dates
  - Informative help text
- Custom color scheme throughout

#### 2. **Employee Booking Page** (`frontend/src/pages/admin/EmployeeBooking.tsx`)
- Same TypeScript interface updates
- Same custom styling for ritual cards
- Same date range selector UI
- Consistent special treatment across both booking interfaces

## How It Works

### User Flow

1. **Browse Rituals**: User sees Nakshatrapooja with special orange-red styling and a "Special" badge

2. **Add to Booking**: User clicks to add Nakshatrapooja to their booking

3. **Fill Details**: User fills in:
   - Devotee Name
   - Naal (Birth Star) - from dropdown
   - Date Range Type (This Month/This Year/Custom Range)
   - If Custom: Start and End dates
   - Date of Birth
   - Subscription type
   - Quantity

4. **Submit Booking**: 
   - Frontend sends booking data with `date_range_type` and optional custom dates
   - Backend calculates the actual date range
   - Backend searches the calendar for the Naal
   - Backend sets `calculated_date` automatically
   - Booking is created with the mapped date

5. **Confirmation**: User receives confirmation with the calculated ritual date

### Calendar Admin Workflow

For the system to work properly, the calendar admin must:
1. Navigate to Calendar Management
2. Select dates and assign Naals to them
3. Ensure important Naals are mapped throughout the year
4. Update regularly to ensure bookings can find dates

## API Endpoints

### New Endpoint
```
GET /v1/calendar/naal-to-date
Query Parameters:
  - naal: string (required) - The Naal to search for
  - start_date: string (required) - Start date in YYYY-MM-DD
  - end_date: string (required) - End date in YYYY-MM-DD

Response:
{
  "naal": "അശ്വതി",
  "date": "2025-10-25",
  "start_date": "2025-10-01",
  "end_date": "2025-10-31"
}

Error Response (404):
{
  "detail": "Naal 'അശ്വതി' not found in calendar between 2025-10-01 and 2025-10-31. Please ensure the calendar is updated with naal information."
}
```

## Database Schema

### Ritual Document (Enhanced)
```json
{
  "_id": "...",
  "name": "Nakshatrapooja",
  "description": "Sacred ritual performed on your birth star...",
  "price": 751,
  "duration": "1.5 hours",
  "popular": true,
  "icon_name": "Star",
  "is_nakshatrapooja": true,
  "nakshatrapooja_color": "#FF6B35",
  "show_on_home": false
}
```

### Booking Instance (Enhanced)
```json
{
  "ritualId": "...",
  "ritualName": "Nakshatrapooja",
  "devoteeName": "John Doe",
  "naal": "അശ്വതി (Ashwathi)",
  "dob": "1990-05-15",
  "subscription": "one-time",
  "quantity": 1,
  "date_range_type": "this_month",
  "custom_range_start": null,
  "custom_range_end": null,
  "calculated_date": "2025-10-25"
}
```

## Error Handling

### Common Errors

1. **Naal Not Found in Calendar**
   - Error: 404 
   - Message: "Naal '{naal}' not found in calendar between {start} and {end}"
   - Solution: Admin needs to update the calendar with Naal mappings

2. **Invalid Date Range**
   - Error: 400
   - Message: "start_date must be <= end_date"
   - Solution: Check custom date range inputs

3. **Missing Custom Range Dates**
   - Error: 400
   - Message: "Custom date range requires both custom_range_start and custom_range_end"
   - Solution: User must fill both start and end dates when selecting "Custom Range"

## Testing Checklist

- [ ] Nakshatrapooja ritual created on server startup
- [ ] Special orange-red color displays correctly
- [ ] "Special" badge shows on ritual cards
- [ ] Date range selector appears only for Nakshatrapooja
- [ ] "This Month" option works correctly
- [ ] "This Year" option works correctly
- [ ] "Custom Range" option shows date pickers
- [ ] Calendar API endpoint `/v1/calendar/naal-to-date` works
- [ ] Booking successfully maps Naal to date
- [ ] Error message shows when Naal not in calendar
- [ ] Same features work in Employee Booking page
- [ ] Booking confirmation includes calculated date

## Future Enhancements

1. **Multiple Date Options**: Show all occurrences of a Naal in the range, let user choose
2. **Calendar Preview**: Show a mini calendar highlighting Naal dates
3. **Notification System**: Notify admins when calendar needs Naal updates
4. **Reporting**: Special reports for Nakshatrapooja bookings
5. **SMS Reminders**: Send Naal date reminders to devotees

## Maintenance Notes

- Ensure calendar is regularly updated with Naal mappings
- Monitor error logs for "Naal not found" errors
- Update Nakshatrapooja color in database if branding changes
- Keep `python-dateutil` package updated for date calculations
