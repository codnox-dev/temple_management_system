# Backend Fix for Mobile App CORS Issue

## Problem
The mobile app is being blocked with:
```
"Invalid origin" - Status 403
```

This happens in `routers/auth.py` in the `_is_allowed_origin()` function.

## Solution: Update Backend

### File: `routers/auth.py`

**Find this function** (around line 25-45):

```python
def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set."""
    if not origin:
        return False  # ← This is blocking mobile apps!
    # ... rest of code
```

**Change to**:

```python
def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set.
    Mobile apps and native HTTP clients don't send Origin headers."""
    if not origin:
        return True  # ← Allow requests without Origin header (mobile apps)
    # ... rest of code
```

### Why This Works

- **Browsers** send Origin headers → CORS validation applies
- **Mobile apps** (Flutter) don't send Origin headers → bypass CORS check
- **Security**: Backend still validates Origin for browser requests

### After Making This Change

1. Save the file
2. Backend will auto-reload (if using `--reload` flag)
3. No need to restart manually
4. Try login again in mobile app

## Option 2: Add Mobile Origin to Backend (Alternative)

If you want to explicitly allow the mobile IP, add to backend `.env`:

```env
ALLOWED_ORIGINS=https://vamana-temple.netlify.app,http://localhost:5173,http://127.0.0.1:5173,http://192.168.18.224:8080
```

**BUT** this won't help because Flutter's `http` package doesn't send Origin by default!

## Recommended: Use Option 1

Modify `_is_allowed_origin()` to return `True` when origin is empty.

---

## Quick Fix Instructions

1. Open `d:\temple_app\routers\auth.py` on your PC (backend folder)
2. Find line ~30 where it says:
   ```python
   if not origin:
       return False
   ```
3. Change to:
   ```python
   if not origin:
       return True  # Mobile apps don't send Origin header
   ```
4. Save file
5. Backend auto-reloads
6. Try login again on mobile

---

## Test After Fix

1. Mobile app login should now work
2. Backend logs will show: `Origin: unknown` or empty
3. Request should succeed with 200 response
4. Tokens should be returned

## Verification

Check backend console for:
```
API request: POST /api/auth/login from IP 192.168.18.x, Origin: unknown
```

This confirms mobile app is not sending Origin header.

---

**After applying this fix, your mobile app will work perfectly! ✅**
