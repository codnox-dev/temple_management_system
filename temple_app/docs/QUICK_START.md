# Quick Start - Backend Integration

## 🚀 Quick Start Guide

### Prerequisites
✅ Flutter SDK installed  
✅ Backend running at `192.168.18.224:8080`  
✅ Mobile device/emulator on same network  
✅ MongoDB connected to backend  

### Step 1: Install Dependencies
```bash
cd d:\temple_app
flutter pub get
```

### Step 2: Verify Backend Connection
Test in your browser or curl:
```bash
curl http://192.168.18.224:8080/docs
```
You should see the Swagger UI.

### Step 3: Run the App

**For Android:**
```bash
flutter run
```

**For iOS:**
```bash
flutter run
```

**For specific device:**
```bash
flutter devices  # List available devices
flutter run -d <device-id>
```

### Step 4: Login
Use credentials from your backend database:
- Username: (your backend username)
- Password: (your backend password)

### Step 5: Test Features
1. ✅ Login with real credentials
2. ✅ Mark attendance
3. ✅ View attendance records
4. ✅ Check reports
5. ✅ View profile
6. ✅ Logout

## 🔧 Configuration

### Change Backend URL
Edit `lib/config/api_config.dart`:
```dart
static const String baseUrl = 'http://YOUR_IP:YOUR_PORT';
```

### For Android Emulator (Backend on localhost)
```dart
static const String baseUrl = 'http://10.0.2.2:8080';
```

### For iOS Simulator (Backend on localhost)
```dart
static const String baseUrl = 'http://localhost:8080';
// OR
static const String baseUrl = 'http://127.0.0.1:8080';
```

## 🐛 Troubleshooting

### "Connection refused" error
**Solution:**
1. Check backend is running: `curl http://192.168.18.224:8080/docs`
2. Verify firewall allows connections
3. Ensure device and backend on same WiFi network
4. Try pinging backend from device: `ping 192.168.18.224`

### "Unauthorized" error
**Solution:**
1. Verify credentials in backend database
2. Check token hasn't expired
3. Try logging out and back in
4. Check backend logs for authentication errors

### No data showing
**Solution:**
1. Check backend logs for errors
2. Verify MongoDB is connected
3. Test endpoints in Swagger UI (`/docs`)
4. Check Flutter console for error messages

### Network timeout
**Solution:**
1. Increase timeout in `api_client.dart` if needed
2. Check network speed
3. Verify backend performance

## 📱 Build for Release

### Android APK
```bash
flutter build apk --release
```
APK location: `build/app/outputs/flutter-apk/app-release.apk`

### iOS IPA
```bash
flutter build ios --release
```

## 🔒 Security Notes

⚠️ **Current Setup (Development)**:
- Using HTTP (not HTTPS)
- Backend IP hardcoded
- Tokens in SharedPreferences

✅ **For Production**:
- Use HTTPS
- Environment variables for backend URL
- Implement certificate pinning
- Add token refresh logic
- Use secure storage (flutter_secure_storage)

## 📚 Documentation Files

- `README.md` - Main project documentation
- `docs/BACKEND_INTEGRATION.md` - Detailed integration guide
- `docs/INTEGRATION_SUMMARY.md` - Summary of changes made
- `docs/QUICK_START.md` - This file
- `docs/FEATURES.md` - Feature documentation
- `docs/PROJECT_SUMMARY.md` - Project structure
- `docs/APP_FLOW.md` - User flow diagrams
- `docs/SCREENS.md` - Screen descriptions
- `docs/VERIFICATION.md` - Testing checklist

## 🆘 Need Help?

### Check Logs
**Flutter Console:**
- Shows API call errors
- Network errors
- Parse errors

**Backend Logs:**
- Shows incoming requests
- Authentication errors
- Database errors

### Test API Directly
Visit Swagger UI: `http://192.168.18.224:8080/docs`
- Test login endpoint
- Test attendance endpoints
- Verify response formats

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't connect to backend | Check network, firewall, backend status |
| Login fails | Verify credentials in database |
| Attendance not saving | Check backend logs, MongoDB connection |
| App crashes | Check Flutter console for stack trace |
| Slow performance | Check network speed, backend performance |

## ✅ Checklist

Before testing:
- [ ] Backend is running
- [ ] MongoDB is connected
- [ ] Backend accessible from mobile device
- [ ] Flutter dependencies installed (`flutter pub get`)
- [ ] No compilation errors (`flutter analyze`)

After testing:
- [ ] Login works
- [ ] Attendance marking works
- [ ] Records display correctly
- [ ] Logout works
- [ ] Session persists (close and reopen app)

## 🎯 Next Steps

1. Test all features thoroughly
2. Add test user accounts in backend
3. Configure production environment
4. Implement remaining features (GPS, notifications)
5. Add comprehensive error handling
6. Write automated tests
7. Prepare for deployment

## 📞 Support

For backend issues:
- Check backend logs
- Review FastAPI documentation
- Check MongoDB connection

For mobile app issues:
- Check Flutter console
- Review this documentation
- Check network inspector

---

**Happy Testing! 🎉**
