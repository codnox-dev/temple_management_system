# URGENT FIX: Backend CORS Issue

## Error You're Seeing
```
Login error: POST request failed: Request failed with status 403: {"detail":"Invalid origin"}
```

## What's Happening
Your backend `routers/auth.py` has a function that checks the Origin header. Mobile apps don't send Origin headers, so the backend is rejecting the request.

## The Fix (2 Minutes)

### Step 1: Open Backend File
On your **PC** (where backend is running):
```
Open: d:\temple_app\routers\auth.py
```

### Step 2: Find This Code
Look for this function (around line 25-30):

```python
def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set."""
    if not origin:
        return False  # ← CHANGE THIS LINE
    raw_allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
    allowed_list = [o.strip() for o in raw_allowed.split(",") if o.strip()] or [
        "https://vamana-temple.netlify.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
```

### Step 3: Change One Line
Change line 4 of the function:

**FROM:**
```python
    if not origin:
        return False
```

**TO:**
```python
    if not origin:
        return True  # Mobile apps don't send Origin header
```

### Step 4: Save File
- Press `Ctrl+S` to save
- Backend will auto-reload if you used `--reload` flag
- You should see in terminal: `INFO: Application startup complete`

### Step 5: Test Mobile App Again
1. Go back to mobile app
2. Enter username and password
3. Tap Login
4. **Should work now!** ✅

## Complete Modified Function

Here's how the complete function should look after the fix:

```python
def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set.
    Mobile apps and native HTTP clients don't send Origin headers."""
    if not origin:
        return True  # Allow requests without Origin header (mobile apps)
    
    raw_allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
    allowed_list = [o.strip() for o in raw_allowed.split(",") if o.strip()] or [
        "https://vamana-temple.netlify.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    origin_regex_env = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip()
    default_origin_regex = r"^https:\/\/([a-z0-9-]+\.)*netlify\.app$"
    allow_origin_regex = origin_regex_env or default_origin_regex

    if origin in allowed_list:
        return True
    try:
        if allow_origin_regex and re.match(allow_origin_regex, origin):
            return True
    except re.error:
        pass
    return False
```

## Why This Works

| Source | Origin Header | Old Behavior | New Behavior |
|--------|---------------|--------------|--------------|
| Web Browser | Sends `http://localhost:5173` | ✅ Validates | ✅ Validates |
| Mobile App | Doesn't send (empty) | ❌ Rejected (403) | ✅ Allowed |
| Postman/Curl | Usually doesn't send | ❌ Rejected (403) | ✅ Allowed |

## Security Impact

**Q: Is this secure?**
**A: YES!** Because:
- Web browsers still have CORS validation (they send Origin)
- Mobile apps need authentication anyway (JWT tokens)
- Backend still has JWT middleware for protected endpoints
- This only allows the request to proceed to authentication
- Wrong username/password still rejected (401)

## Verification

After the fix, check backend console:
```
✅ Good: "API request: POST /api/auth/login from IP 192.168.18.x, Origin: unknown"
✅ Good: Login succeeds or fails with 401 (wrong credentials)
❌ Bad: Still seeing "Invalid origin"
```

## If Backend Doesn't Auto-Reload

If you don't see the reload message:

**Option 1: Restart Backend**
```bash
# Press Ctrl+C to stop
# Then run again:
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Option 2: Check Running Without --reload**
If you started without `--reload`, you MUST restart manually.

## After Fix Works

You should see in mobile app:
1. ✅ Login succeeds (if correct credentials)
2. ✅ Navigate to home screen
3. ✅ Can mark attendance
4. ✅ Can view reports

Or if wrong credentials:
- ❌ "Invalid username or password" message
- (But at least not CORS error!)

## Still Not Working?

### Check Backend Terminal
Look for:
```
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Application startup complete.
```

This means backend reloaded successfully.

### Check File Was Saved
Open `routers/auth.py` again and verify the change is there.

### Restart Backend Manually
```bash
Ctrl+C
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## Quick Checklist

- [ ] Opened `routers/auth.py` on backend PC
- [ ] Found `_is_allowed_origin()` function
- [ ] Changed `return False` to `return True`
- [ ] Saved file (Ctrl+S)
- [ ] Backend reloaded (check terminal)
- [ ] Tried login again in mobile app
- [ ] Success! ✅

---

**This is a 30-second fix that will make your mobile app work immediately!**
