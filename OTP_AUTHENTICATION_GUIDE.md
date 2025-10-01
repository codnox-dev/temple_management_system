# OTP Authentication System - Implementation Summary

## 🔄 Migration from Google OAuth to OTP Authentication

This document summarizes the complete rework of the authentication system from Google OAuth to OTP-based authentication.

## 📋 Changes Made

### 1. New Models (`backend/app/models/otp_models.py`)
- **OTPBase**: Base OTP model with mobile number, hashed OTP, expiration, and usage tracking
- **OTPCreate**: Schema for creating new OTPs
- **OTPInDB**: OTP model as stored in database
- **OTPVerificationRequest**: Schema for OTP verification requests
- **OTPSendRequest**: Schema for sending OTP requests
- **OTPResponse**: Response after sending OTP

### 2. New Service (`backend/app/services/otp_service.py`)
- **OTPService**: Complete service for OTP operations
  - `generate_otp()`: Generates secure 6-digit OTPs using cryptographically secure random
  - `hash_otp()`: Hashes OTPs using bcrypt for secure storage
  - `verify_otp_hash()`: Verifies OTP against its hash
  - `normalize_mobile_number()`: Normalizes mobile number format with country codes
  - `create_otp()`: Creates and stores new OTP, prints to terminal for debugging
  - `verify_otp()`: Verifies OTP and returns admin user if valid
  - `cleanup_expired_otps()`: Removes expired OTPs from database

### 3. Updated Database (`backend/app/database.py`)
- Added `otp_collection` for storing OTP documents
- Added indexes for mobile_number and TTL expiration
- OTPs automatically expire after 5 minutes

### 4. Updated Authentication Router (`backend/app/routers/auth.py`)
- **Removed**: Google OAuth endpoints and logic
- **Added**: `/api/auth/send-otp` - Send OTP to mobile number
- **Added**: `/api/auth/verify-otp` - Verify OTP and get access token
- **Updated**: CORS handling for new endpoints
- **Updated**: Error messages to reference OTP authentication

### 5. Updated Admin Models (`backend/app/models/admin_models.py`)
- **Removed**: `google_email` field from all admin schemas
- **Removed**: Google OAuth related fields and validations
- **Kept**: Mobile number fields (`mobile_number`, `mobile_prefix`)

### 6. Updated Auth Service (`backend/app/services/auth_service.py`)
- **Removed**: `get_admin_by_google_email()` function
- **Added**: `get_admin_by_mobile()` function for mobile-based lookups

### 7. Updated Admin Router (`backend/app/routers/admin.py`)
- **Removed**: Google email uniqueness checks
- **Added**: Mobile number uniqueness validation
- **Updated**: Admin creation and update logic

### 8. Updated Requirements (`backend/requirements.txt`)
- **Added**: `bcrypt` for secure OTP hashing
- **Removed**: `google-auth` dependency

## 🔐 Security Features

1. **Hashed OTP Storage**: OTPs are stored as bcrypt hashes, never in plain text
2. **Time-Limited**: OTPs expire after 5 minutes automatically
3. **Single Use**: OTPs are deleted immediately after successful verification
4. **Rate Limited**: Maximum 3 verification attempts per OTP
5. **Mobile Number Validation**: Only registered admin mobile numbers can receive OTPs
6. **Secure Random Generation**: Uses cryptographically secure random number generation

## 🚀 API Endpoints

### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile_number": "+911234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "mobile_number": "+911234567890",
  "expires_in": 300
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile_number": "+911234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## 📱 Mobile Number Format

The system expects mobile numbers in international format:
- **Correct**: `+911234567890` (country code + number)
- **Incorrect**: `1234567890` (will be auto-prefixed with +91)

Admin documents should have:
- `mobile_prefix`: "+91" (or other country code)
- `mobile_number`: 1234567890 (numeric, 10 digits for India)

## 🧪 Testing

1. **Test Script**: `python test_otp_auth.py`
   - Tests complete OTP authentication flow
   - Verifies token generation and validation

## 🐳 Deployment Steps

1. **Update Docker containers**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **Test the system**:
   ```bash
   python test_otp_auth.py
   ```

## 🎯 Frontend Integration

Update your frontend to use the new endpoints:

```javascript
// Send OTP
const sendOTP = async (mobileNumber) => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobileNumber })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (mobileNumber, otp) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      mobile_number: mobileNumber, 
      otp: otp 
    })
  });
  return response.json();
};
```

## 🔧 Debug Features

- **Terminal OTP Display**: OTPs are printed to the backend terminal for debugging
- **Detailed Logging**: All OTP operations are logged with appropriate levels
- **Attempt Tracking**: Failed verification attempts are tracked and limited

## ⚠️ Important Notes

1. **Remove Google OAuth**: All Google authentication code has been removed
2. **Mobile Number Required**: All admin accounts must have valid mobile numbers
3. **Country Code**: Mobile numbers must include country code (+91 for India)
4. **Production**: Remove terminal OTP printing in production environments
5. **SMS Integration**: Integrate with SMS provider instead of terminal printing

## 🎉 Benefits

1. **No External Dependencies**: No need for Google OAuth configuration
2. **Universal Access**: Works with any mobile number, no Google account required
3. **Secure**: Industry-standard OTP implementation with proper hashing
4. **Simple**: Straightforward user experience
5. **Fast**: Quick login process without external redirects