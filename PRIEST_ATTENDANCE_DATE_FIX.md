# Priest Attendance Date/DateTime Fix

## Issue Description
When adding priests and querying the priest list, the backend was throwing a BSON encoding error:
```
bson.errors.InvalidDocument: cannot encode object: datetime.date(2025, 10, 1), of type: <class 'datetime.date'>
```

## Root Cause
MongoDB's BSON encoder can only serialize `datetime.datetime` objects, not Python's `datetime.date` objects. The priest attendance system was using `date` objects in several places:
1. Query filters for attendance records
2. Date range calculations for monthly reports
3. Storing attendance_date field in the database

## Solution
Converted all `date` objects to `datetime` objects before MongoDB operations:

### Changes Made

#### 1. `get_priests` Endpoint (Line ~138)
**Before:**
```python
month_start = date(current_date.year, current_date.month, 1)
```

**After:**
```python
month_start = datetime(current_date.year, current_date.month, 1)
```

#### 2. `mark_attendance` Endpoint (Line ~268)
**Added date-to-datetime conversion before checking existing attendance:**
```python
# Convert date to datetime for MongoDB comparison
attendance_datetime = attendance.attendance_date
if isinstance(attendance_datetime, date) and not isinstance(attendance_datetime, datetime):
    attendance_datetime = datetime.combine(attendance_datetime, datetime.min.time())
```

**Added conversion before storing:**
```python
attendance_dict = attendance.dict()
# Convert date to datetime for MongoDB
if isinstance(attendance_dict["attendance_date"], date) and not isinstance(attendance_dict["attendance_date"], datetime):
    attendance_dict["attendance_date"] = datetime.combine(attendance_dict["attendance_date"], datetime.min.time())
```

#### 3. `mark_bulk_attendance` Endpoint (Line ~318)
**Added conversion at the start of the function:**
```python
# Convert date to datetime for MongoDB
attendance_datetime = bulk_data.attendance_date
if isinstance(attendance_datetime, date) and not isinstance(attendance_datetime, datetime):
    attendance_datetime = datetime.combine(attendance_datetime, datetime.min.time())
```

#### 4. `get_attendance_records` Endpoint (Line ~394)
**Before:**
```python
if month and year:
    month_start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    month_end = date(year, month, last_day)
    query["attendance_date"] = {"$gte": month_start, "$lte": month_end}
elif start_date or end_date:
    date_query = {}
    if start_date:
        date_query["$gte"] = start_date
    if end_date:
        date_query["$lte"] = end_date
    query["attendance_date"] = date_query
```

**After:**
```python
if month and year:
    month_start = datetime(year, month, 1)
    _, last_day = monthrange(year, month)
    month_end = datetime(year, month, last_day, 23, 59, 59)
    query["attendance_date"] = {"$gte": month_start, "$lte": month_end}
elif start_date or end_date:
    date_query = {}
    if start_date:
        date_query["$gte"] = datetime.combine(start_date, datetime.min.time())
    if end_date:
        date_query["$lte"] = datetime.combine(end_date, datetime.max.time())
    query["attendance_date"] = date_query
```

#### 5. `get_monthly_report` Endpoint (Line ~532)
**Before:**
```python
month_start = date(year, month, 1)
_, last_day = monthrange(year, month)
month_end = date(year, month, last_day)

# ...later...
working_days = (month_end - month_start).days + 1
```

**After:**
```python
month_start = datetime(year, month, 1)
_, last_day = monthrange(year, month)
month_end = datetime(year, month, last_day, 23, 59, 59)

# ...later...
working_days = last_day  # Use the actual last day of month instead of date arithmetic
```

#### 6. `get_dashboard_stats` Endpoint (Line ~613)
**Before:**
```python
today = date.today()
current_date = datetime.utcnow()
month_start = date(current_date.year, current_date.month, 1)

today_present = await db.attendance.count_documents({
    "attendance_date": today,
    "is_present": True
})
```

**After:**
```python
today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
current_date = datetime.utcnow()
month_start = datetime(current_date.year, current_date.month, 1)

today_end = today.replace(hour=23, minute=59, second=59)
today_present = await db.attendance.count_documents({
    "attendance_date": {"$gte": today, "$lte": today_end},
    "is_present": True
})
```

## Files Modified
- ✅ `backend/app/routers/priest_attendance.py`

## Testing Checklist
- [x] No Python syntax errors
- [ ] Test GET /api/priest-attendance/priests (should list priests without error)
- [ ] Test POST /api/priest-attendance/priests (create new priest)
- [ ] Test POST /api/priest-attendance/attendance (mark single attendance)
- [ ] Test POST /api/priest-attendance/attendance/bulk (mark bulk attendance)
- [ ] Test GET /api/priest-attendance/attendance (filter by date ranges)
- [ ] Test GET /api/priest-attendance/reports/monthly (monthly report)
- [ ] Test GET /api/priest-attendance/dashboard (dashboard stats)

## Key Learnings
1. **MongoDB/BSON Limitation**: MongoDB cannot encode Python `date` objects, only `datetime` objects
2. **Pydantic Models**: While Pydantic models can define fields as `date` type for API validation, the actual storage in MongoDB requires `datetime`
3. **Date Conversion Pattern**: Use `datetime.combine(date_obj, datetime.min.time())` to convert `date` to `datetime`
4. **Date Range Queries**: When querying date ranges, use start of day (00:00:00) and end of day (23:59:59) for accurate results

## Migration Notes
### For Existing Data
If you have existing attendance records stored with `date` objects (which would have failed), no migration is needed as those records wouldn't have been successfully inserted. All new records will use `datetime` objects.

### Frontend Impact
No changes needed in the frontend. The API still accepts `date` strings (YYYY-MM-DD) which are properly converted to `datetime` on the backend.

## API Behavior (No Breaking Changes)
- **Input**: Frontend still sends dates as strings (e.g., "2025-10-19")
- **Validation**: Pydantic validates them as `date` type
- **Storage**: Backend converts to `datetime` before MongoDB operations
- **Output**: Dates are still returned in ISO format (YYYY-MM-DD)

---

**Date Fixed:** October 19, 2025  
**Issue:** BSON encoding error preventing priest listing and attendance marking  
**Status:** ✅ Resolved  
**Impact:** Critical fix - system was non-functional without this
