# Testing Guide - Mobile Backend Integration

## Pre-Test Checklist

### Backend Status
- [ ] Backend is running on your PC
- [ ] Command running: `uvicorn main:app --host 0.0.0.0 --port 8080`
- [ ] Can see startup logs
- [ ] MongoDB connected

### Network Configuration
- [ ] PC and mobile device on same WiFi network
- [ ] PC WiFi adapter IP: `192.168.18.224`
- [ ] Port 8080 accessible (firewall allows it)

### Backend Accessibility Test
From mobile browser, visit:
- [ ] `http://192.168.18.224:8080/` - Should show health check
- [ ] `http://192.168.18.224:8080/docs` - Should show Swagger UI

### Flutter App
- [ ] Dependencies installed: `flutter pub get`
- [ ] No compilation errors: `flutter analyze`
- [ ] Device/emulator ready: `flutter devices`

## Test Procedure

### Test 1: Network Connectivity
**Purpose**: Verify mobile device can reach backend

1. Open mobile browser
2. Navigate to: `http://192.168.18.224:8080/`
3. **Expected**: JSON response with "healthy" status
4. **If fails**: Check WiFi, firewall, backend running

### Test 2: Swagger UI Access
**Purpose**: Verify API documentation accessible

1. Open mobile browser
2. Navigate to: `http://192.168.18.224:8080/docs`
3. **Expected**: Swagger UI loads
4. **If fails**: Backend may not be running correctly

### Test 3: Login via Swagger (Baseline)
**Purpose**: Test login endpoint with known working tool

1. Open Swagger UI on mobile browser
2. Find `POST /api/auth/login`
3. Click "Try it out"
4. Enter your credentials:
   ```json
   {
     "username": "admin",
     "password": "your_actual_password"
   }
   ```
5. Execute
6. **Expected**: 200 response with tokens
7. **If 401**: Wrong credentials
8. **If 403**: Origin/CORS issue

### Test 4: Flutter App Login
**Purpose**: Test actual mobile app login

#### Run the App
```bash
cd d:\temple_app
flutter run
```

#### Login Flow Test
1. App opens to login screen
2. Enter credentials:
   - Username: `admin` (or your backend username)
   - Password: (your actual password)
3. Tap "Login"
4. **Expected**: Navigate to home screen with bottom navigation
5. **If error**: Check error message and Flutter console

#### Expected Responses

**Success** (200):
```
✅ Navigate to home screen
✅ User name appears in profile
✅ Tokens stored
```

**Wrong Credentials** (401):
```
❌ SnackBar: "Invalid username or password"
❌ Stay on login screen
```

**Network Error**:
```
❌ SnackBar: "Connection error. Please check your network."
❌ Flutter console shows connection refused/timeout
```

**CORS Error** (403):
```
❌ SnackBar: "Invalid origin" or similar
❌ Check backend logs for CORS rejection
```

### Test 5: Mark Attendance
**Purpose**: Test authenticated API call

1. After successful login
2. Go to Attendance tab (should be default)
3. Tap "Mark Attendance" button
4. **Expected**: Success message and attendance appears in recent list
5. **If fails**: Check Flutter console and backend logs

### Test 6: View Reports
**Purpose**: Test data retrieval from backend

1. Navigate to Report tab
2. Should load attendance records
3. **Expected**: List of attendance records from backend
4. **If empty**: Check if you have attendance data in MongoDB
5. **If error**: Check Flutter console

### Test 7: Session Persistence
**Purpose**: Test token storage

1. Close the app completely
2. Reopen the app
3. **Expected**: Should stay logged in (requires implementation)
4. **Currently**: Will need to login again (session not persisted on app start)

## Debugging

### Check Flutter Console
Look for:
```
Login error: <error message>
Mark attendance error: <error message>
```

### Check Backend Logs
Look for:
```
API request: POST /api/auth/login from IP 192.168.18.x
Login failed: Invalid credentials
Authentication failed for POST /api/attendance/mark
```

### Common Issues

#### Issue: "Connection refused"
**Cause**: Can't reach backend
**Solution**:
- Verify backend running
- Check IP address correct
- Test in mobile browser first
- Check firewall

#### Issue: "Invalid username or password"
**Cause**: Wrong credentials
**Solution**:
- Check username in MongoDB admins collection
- Verify password
- Try admin credentials first
- Check backend logs

#### Issue: "Invalid origin" (403)
**Cause**: CORS blocking request
**Solution**:
- Check `docs/CORS_AND_MOBILE.md`
- Modify `routers/auth.py` `_is_allowed_origin()` function
- Change `return False` to `return True` for empty origins

#### Issue: "Unauthorized" (401) on attendance
**Cause**: Token not being sent or expired
**Solution**:
- Check token was saved: Print in api_client.dart
- Verify Authorization header being sent
- Check backend JWT middleware logs

#### Issue: No data showing
**Cause**: Backend returns empty array or different format
**Solution**:
- Check backend response in Swagger UI
- Verify data exists in MongoDB
- Check JSON parsing in Flutter

## Verification Checklist

After all tests:
- [ ] Can login with backend credentials
- [ ] Can mark attendance
- [ ] Can view attendance records
- [ ] Can see profile information
- [ ] Can logout
- [ ] Error messages are clear
- [ ] No unhandled exceptions in Flutter console

## Performance Checks

- [ ] Login completes within 2-3 seconds
- [ ] Attendance marking is fast (< 1 second)
- [ ] Records load quickly
- [ ] No lag in navigation

## Next Steps After Successful Testing

1. Implement session persistence (load user on app start)
2. Add loading indicators for all API calls
3. Improve error messages
4. Add retry logic for failed requests
5. Implement pull-to-refresh
6. Add pagination for reports
7. Implement offline mode with local storage

## Backend Credentials Reminder

**Default Super Admin** (from .env):
- Username: Set in `DEFAULT_ADMIN_USERNAME`
- Password: Set in `DEFAULT_ADMIN_PASSWORD`
- Default: `admin` / `ChangeMeNow123!`

**Check your .env file** for actual credentials!

## API Endpoints Being Tested

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/records` - Get records
- `GET /api/attendance/dashboard` - Get statistics

## Logging for Debug

### Add to api_client.dart
```dart
print('Making request to: ${ApiConfig.getFullUrl(endpoint)}');
print('Headers: ${ApiConfig.getHeaders(token: _accessToken)}');
print('Body: ${jsonEncode(body)}');
```

### Add to auth_service.dart
```dart
print('Login request for username: $username');
print('Response: $response');
print('Tokens saved: $_accessToken');
```

### Check these in Flutter Console

## Mobile Device Requirements

- Android 5.0+ or iOS 11+
- WiFi enabled and connected
- Same network as backend PC
- No VPN or proxy interfering

## Emulator Testing

### Android Emulator
- Use `10.0.2.2:8080` instead of `192.168.18.224:8080`
- Or use PC's actual IP if emulator supports it

### iOS Simulator
- Use `192.168.18.224:8080` (actual PC IP)
- Or use `localhost:8080` if backend on same Mac

## Success Criteria

✅ **Minimum Viable**:
- Login works
- Can mark attendance
- Can view own attendance records

✅ **Full Success**:
- All above +
- Statistics display correctly
- Date filtering works
- Error handling works
- Logout works
- Session persists

## Support

**If stuck**:
1. Check all items in Pre-Test Checklist
2. Review error messages carefully
3. Compare Swagger UI results with app results
4. Check `docs/CORS_AND_MOBILE.md`
5. Review `docs/BACKEND_INTEGRATION.md`

**Common Quick Fixes**:
- Restart backend
- Restart app
- Clear app data (Settings > Apps > Your App > Clear Data)
- Verify WiFi connection
- Check backend logs

---

**Ready to test? Start with Test 1 and work through sequentially!**
