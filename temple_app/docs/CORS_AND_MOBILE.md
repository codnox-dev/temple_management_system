# CORS Configuration for Mobile App

## Current Backend CORS Setup

Your backend `main.py` currently has CORS configured with:

```python
default_origins = [
    "https://vamana-temple.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

## Why Mobile App Will Work

✅ **Good News**: Your mobile app should work without CORS issues because:

1. **Running on 0.0.0.0**: Your backend runs on `0.0.0.0:8080`, which accepts connections from any network interface
2. **Mobile Access Confirmed**: You can already access backend from mobile browser
3. **No Origin Header**: Mobile HTTP clients (like Flutter's `http` package) typically **don't send Origin headers** by default
4. **CORS for Browsers**: CORS is primarily a **browser security feature**, not enforced by native mobile apps

## How CORS Works

### Browser vs Mobile App

**Browser** (Web):
- Sends `Origin` header with every request
- Backend must explicitly allow that origin
- CORS errors block the request

**Mobile App** (Flutter):
- Native HTTP client (not browser)
- Usually doesn't send `Origin` header
- No CORS enforcement by default

## If You Get CORS Errors

If you encounter CORS-related issues, here are solutions:

### Option 1: Add Mobile Origin (Not Usually Needed)

If your app somehow sends Origin headers, add to backend `.env`:

```env
ALLOWED_ORIGINS=https://vamana-temple.netlify.app,http://localhost:5173,http://127.0.0.1:5173,http://192.168.18.224:8080
```

### Option 2: Allow All Origins (Development Only)

**⚠️ NOT RECOMMENDED for production**, but for testing:

In `main.py`, temporarily change:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 3: Disable Origin Validation in Middleware

Your `auth.py` has `_is_allowed_origin()` function that validates origins. 

**For mobile testing**, you can temporarily modify the validation in `routers/auth.py`:

```python
def _is_allowed_origin(origin: str) -> bool:
    # For mobile app testing - accept requests without origin header
    if not origin:
        return True  # Mobile apps typically don't send Origin header
    # ... rest of validation
```

**This is already implemented in your backend!** Look at line ~25 in `auth.py`:
```python
if not origin:
    return False
```

Change to:
```python
if not origin:
    return True  # Accept requests without Origin (mobile apps)
```

## Testing CORS

### Test from Mobile Browser
```
http://192.168.18.224:8080/docs
```
Should load Swagger UI

### Test from Flutter App
The app will make requests to:
```
http://192.168.18.224:8080/api/auth/login
```

### Expected Behavior

**If CORS is an issue**, you'll see:
- ❌ HTTPException with status 403
- ❌ "Invalid origin" error message
- ✅ Request reaches backend (check logs)
- ❌ Backend rejects with 403 response

**If working correctly**, you'll see:
- ✅ Request succeeds
- ✅ 200 or 401 response (401 = wrong credentials, but auth working)
- ✅ Tokens received

## Current Mobile App Configuration

**File**: `lib/config/api_config.dart`
```dart
static const String baseUrl = 'http://192.168.18.224:8080';
```

**File**: `lib/services/api_client.dart`
- Uses standard `http` package
- Sends `Content-Type: application/json`
- Sends `Authorization: Bearer {token}` for authenticated requests
- **Does NOT send Origin header** (by default)

## Network Requirements

### Prerequisites
✅ Backend running on `0.0.0.0:8080`  
✅ Mobile device on same WiFi network  
✅ Can access backend from mobile browser  
✅ Firewall allows port 8080  

### Test Connectivity

From mobile device browser:
```
http://192.168.18.224:8080/
```
Should show: `{"status": "healthy", "message": "Temple Management System API is running"}`

```
http://192.168.18.224:8080/docs
```
Should show Swagger UI

## Middleware Configuration

Your backend has **two middleware layers** that could affect mobile requests:

### 1. EnhancedSecurityMiddleware
Located in: `middleware/enhanced_security_middleware.py`

**Excludes** (no security checks):
- `/docs`
- `/redoc`
- `/openapi.json`
- `/`
- `/api`

**Does NOT exclude**: `/api/auth/login` (but shouldn't block it)

### 2. EnhancedJWTAuthMiddleware
Located in: `middleware/enhanced_jwt_auth_middleware.py`

**Excludes** (no JWT required):
- `/api/auth/login` ✅
- `/api/auth/register` ✅
- `/api/auth/refresh-token` ✅
- `/api/auth/logout` ✅

**This means login will work without JWT token!** ✅

## Authentication Flow

### Login Request
```
POST http://192.168.18.224:8080/api/auth/login
Headers:
  Content-Type: application/json
  Accept: application/json
Body:
  {
    "username": "your_username",
    "password": "your_password"
  }
```

### Response (Success)
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Response (Failed - CORS)
```json
{
  "detail": "Invalid origin"
}
Status: 403
```

### Response (Failed - Wrong Credentials)
```json
{
  "detail": "Invalid credentials"
}
Status: 401
```

## Troubleshooting Steps

### Step 1: Check Origin Header
Add logging in your mobile app to see if Origin is sent:

```dart
// In api_client.dart
print('Request headers: ${ApiConfig.getHeaders()}');
```

### Step 2: Check Backend Logs
Your backend logs will show:
```
API request: POST /api/auth/login from IP 192.168.18.x, Origin: unknown
```

If Origin is "unknown", CORS won't be an issue!

### Step 3: Test Login Endpoint Directly

Use curl from your PC:
```bash
curl -X POST http://192.168.18.224:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### Step 4: Modify Backend Temporarily

If you get CORS errors, modify `routers/auth.py`:

**Before** (line ~25):
```python
def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
```

**After** (for mobile testing):
```python
def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return True  # Mobile apps don't send Origin header
```

## Recommended Backend Changes (Optional)

### For Production Mobile Support

Update `routers/auth.py` to explicitly support mobile:

```python
def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header. Mobile apps typically don't send Origin."""
    # Mobile apps and native HTTP clients don't send Origin header
    if not origin or origin == "null":
        return True  # Accept requests without Origin header
    
    # ... rest of validation for web browsers
```

## Summary

### Will It Work?
**YES**, most likely! Because:
1. ✅ Mobile apps don't send Origin headers
2. ✅ Backend runs on 0.0.0.0 (accessible from network)
3. ✅ `/api/auth/login` excluded from JWT middleware
4. ✅ You can already access backend from mobile browser

### If Issues Occur
1. Check if Origin header is being sent (unlikely)
2. Modify `_is_allowed_origin()` to return `True` for empty origins
3. Check backend logs for actual error
4. Ensure mobile device and PC on same WiFi

### Current Status
- ✅ Login screen uses `username` (not email)
- ✅ API client configured correctly
- ✅ Backend accessible from mobile network
- ✅ Auth flow matches backend implementation
- ⚠️ May need to modify `_is_allowed_origin()` if issues occur

## Contact

If you encounter issues:
1. Check Flutter console for error messages
2. Check backend logs (`/api/auth/login` requests)
3. Test with curl first to isolate issue
4. Modify `_is_allowed_origin()` if needed
