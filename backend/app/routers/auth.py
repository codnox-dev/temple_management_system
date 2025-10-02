from fastapi import APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks, status
import os
import re
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..services.jwt_security_service import jwt_security
from ..services.auth_service import get_admin_by_username, get_admin_by_mobile, update_last_login
from ..services.otp_service import otp_service
from ..services.otp_rate_limit_service import otp_rate_limit_service, ip_rate_limit_service
from ..services.activity_service import create_activity
from ..models.otp_models import OTPSendRequest, OTPVerificationRequest, OTPResponse
from ..models.activity_models import ActivityCreate
from ..database import admins_collection

router = APIRouter()
logger = logging.getLogger("auth")


def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set."""
    if not origin:
        return False
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

# Handle CORS preflight requests for auth endpoints
@router.options("/get-token")
@router.options("/send-otp") 
@router.options("/resend-otp")
@router.options("/verify-otp")
@router.options("/refresh-token")
async def handle_cors_preflight(request: Request):
    """Handle CORS preflight requests for auth endpoints"""
    origin = request.headers.get("origin", "")
    headers = {
        "Access-Control-Allow-Origin": origin if origin else "*",
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "authorization, content-type"),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "600",
    }
    return Response(status_code=200, headers=headers)

# OAuth2 scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/get-token", response_model=TokenResponse)
async def get_initial_token(request: Request):
    """
    Get an initial access token for the frontend.
    This endpoint provides a short-lived token for the React app to use.
    """
    try:
        # Get client information for token binding
        client_info = jwt_security.get_client_info(request)
        
        # Create a basic token for frontend initialization
        # In a real app, you might want to require some form of authentication here
        token_data = {
            "sub": "frontend_app",
            "scope": "api_access",
            "client_ip": client_info.get("ip", "")
        }
        
        # Create short-lived access token only (no refresh token for unauthenticated bootstrap)
        access_token = jwt_security.create_access_token(token_data, client_info)

        logger.info(f"Initial token issued to IP {client_info.get('ip', 'unknown')}")

        return TokenResponse(
            access_token=access_token,
            expires_in=jwt_security.access_token_expire_minutes * 60
        )
        
    except Exception as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create token")

@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(request: Request, background_tasks: BackgroundTasks, payload: OTPSendRequest):
    """
    Send OTP to mobile number for authentication.
    Rate limited by device fingerprint and IP address.
    """
    try:
        # CSRF mitigation: validate Origin header explicitly
        origin = request.headers.get("origin", "")
        if not _is_allowed_origin(origin):
            raise HTTPException(status_code=403, detail="Invalid origin")
        
        # Get client IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Check IP rate limit
        ip_allowed, ip_error = await ip_rate_limit_service.check_ip_rate_limit(client_ip)
        if not ip_allowed:
            logger.warning(f"IP rate limit exceeded for {client_ip}")
            raise HTTPException(status_code=429, detail=ip_error)
        
        # Check device rate limit
        device_allowed, device_error, cooldown_until, attempts_remaining = await otp_rate_limit_service.check_device_rate_limit(
            payload.device_fingerprint,
            payload.mobile_number
        )
        
        if not device_allowed:
            logger.warning(f"Device rate limit exceeded for fingerprint {payload.device_fingerprint[:8]}...")
            raise HTTPException(status_code=429, detail=device_error)
        
        # Fetch admin by mobile number
        admin = await get_admin_by_mobile(payload.mobile_number)
        if admin and admin.get("isRestricted", False):
            raise HTTPException(
                status_code=403,
                detail="Your account has been restricted. Please contact the administrator for more details."
            )

        # Generate and send OTP
        plain_otp, otp_doc = await otp_service.create_otp(payload.mobile_number)
        
        # Record the request
        await otp_rate_limit_service.record_otp_request(payload.device_fingerprint, payload.mobile_number)
        await ip_rate_limit_service.record_ip_request(client_ip)
        
        # Schedule cleanup in background
        background_tasks.add_task(otp_service.cleanup_expired_otps)
        background_tasks.add_task(otp_rate_limit_service.cleanup_old_records)
        background_tasks.add_task(ip_rate_limit_service.cleanup_old_blocks)
        
        logger.info(f"OTP sent to mobile number: {payload.mobile_number} from IP {client_ip}")
        
        return OTPResponse(
            message="OTP sent successfully",
            mobile_number=otp_doc.mobile_number,
            expires_in=300,  # 5 minutes
            cooldown_until=cooldown_until,
            attempts_remaining=attempts_remaining
        )
        
    except ValueError as e:
        logger.warning(f"OTP send failed: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/resend-otp", response_model=OTPResponse)
async def resend_otp(request: Request, background_tasks: BackgroundTasks, payload: OTPSendRequest):
    """
    Resend OTP to mobile number. Uses same rate limiting as send-otp.
    Deletes existing OTP and generates a new one.
    """
    try:
        # CSRF mitigation: validate Origin header explicitly
        origin = request.headers.get("origin", "")
        if not _is_allowed_origin(origin):
            raise HTTPException(status_code=403, detail="Invalid origin")
        
        # Get client IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Check IP rate limit
        ip_allowed, ip_error = await ip_rate_limit_service.check_ip_rate_limit(client_ip)
        if not ip_allowed:
            logger.warning(f"IP rate limit exceeded for {client_ip} on resend")
            raise HTTPException(status_code=429, detail=ip_error)
        
        # Check device rate limit
        device_allowed, device_error, cooldown_until, attempts_remaining = await otp_rate_limit_service.check_device_rate_limit(
            payload.device_fingerprint,
            payload.mobile_number
        )
        
        if not device_allowed:
            logger.warning(f"Device rate limit exceeded for fingerprint {payload.device_fingerprint[:8]}... on resend")
            raise HTTPException(status_code=429, detail=device_error)
        
        # Fetch admin by mobile number
        admin = await get_admin_by_mobile(payload.mobile_number)
        if admin and admin.get("isRestricted", False):
            raise HTTPException(
                status_code=403,
                detail="Your account has been restricted. Please contact the administrator for more details."
            )

        # Delete existing OTP and generate new one
        # The create_otp method already handles deletion of existing OTPs
        plain_otp, otp_doc = await otp_service.create_otp(payload.mobile_number)
        
        # Record the resend request
        await otp_rate_limit_service.record_otp_request(payload.device_fingerprint, payload.mobile_number)
        await ip_rate_limit_service.record_ip_request(client_ip)
        
        # Schedule cleanup in background
        background_tasks.add_task(otp_service.cleanup_expired_otps)
        background_tasks.add_task(otp_rate_limit_service.cleanup_old_records)
        background_tasks.add_task(ip_rate_limit_service.cleanup_old_blocks)
        
        logger.info(f"OTP resent to mobile number: {payload.mobile_number} from IP {client_ip}")
        
        return OTPResponse(
            message="OTP resent successfully",
            mobile_number=otp_doc.mobile_number,
            expires_in=300,  # 5 minutes
            cooldown_until=cooldown_until,
            attempts_remaining=attempts_remaining
        )
        
    except ValueError as e:
        logger.warning(f"OTP resend failed: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP resend error: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend OTP")

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_login(request: Request, response: Response, payload: OTPVerificationRequest):
    """
    Verify OTP and authenticate admin user.
    """
    try:
        # CSRF mitigation: validate Origin header explicitly
        origin = request.headers.get("origin", "")
        if not _is_allowed_origin(origin):
            raise HTTPException(status_code=403, detail="Invalid origin")

        # Verify OTP and get admin user
        admin_user = await otp_service.verify_otp(payload.mobile_number, payload.otp)
        if not admin_user:
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        # Check if admin is restricted
        if admin_user.get("isRestricted", False):
            logger.warning(f"Login attempt by restricted admin: {admin_user.get('username')}")
            raise HTTPException(status_code=403, detail="Account is restricted")

        # Update last login timestamp
        await update_last_login(admin_user["_id"])

        # Log activity
        await create_activity(ActivityCreate(
            username=admin_user["username"],
            role=admin_user.get("role", "Unknown"),
            activity="Logged in"
        ))

        # Get client information for optional token binding
        client_info = jwt_security.get_client_info(request)

        # Create token data aligned with existing JWT system
        token_data = {
            "sub": admin_user.get("username"),
            "user_id": str(admin_user.get("_id")),
            "role": admin_user.get("role", "admin"),
            "role_id": admin_user.get("role_id", 1),
            "permissions": admin_user.get("permissions", []),
        }

        access_token = jwt_security.create_access_token(token_data, client_info)
        refresh_token = jwt_security.create_refresh_token(token_data, client_info)

        # Set refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=jwt_security.refresh_token_expire_days * 24 * 60 * 60,
        )

        # Get role-based token duration
        token_duration = jwt_security.get_token_duration(admin_user.get("role_id"))

        mobile_display = f"{admin_user.get('mobile_prefix', '')}{admin_user.get('mobile_number', '')}"
        logger.info(f"OTP login successful for admin: {admin_user.get('username')} ({mobile_display}) with {token_duration // 60}min token")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=token_duration,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(status_code=500, detail="Authentication error")

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, response: Response):
    """
    Handle user login and update last login timestamp.
    """
    form_data = await request.json()
    username = form_data.get("username")
    password = form_data.get("password")

    # Authenticate user
    admin = await get_admin_by_username(username)
    if not admin or not jwt_security.verify_password(password, admin.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # Update last login timestamp
    await update_last_login(admin["_id"])

    # Log activity
    await create_activity(ActivityCreate(
        username=admin["username"],
        role=admin.get("role", "Unknown"),
        activity="Logged in"
    ))

    # Generate token
    token = jwt_security.create_access_token(data={"sub": username})
    return TokenResponse(
        access_token=token,
        expires_in=3600
    )

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(request: Request, refresh_request: RefreshTokenRequest = None):
    """
    Refresh access token using refresh token
    """
    try:
        # CSRF mitigation: validate Origin header explicitly
        origin = request.headers.get("origin", "")
        if not _is_allowed_origin(origin):
            raise HTTPException(status_code=403, detail="Invalid origin")

        # Get refresh token from request body or HTTP-only cookie
        refresh_token = None
        if refresh_request and refresh_request.refresh_token:
            refresh_token = refresh_request.refresh_token
        else:
            refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token required")
        
        # Get client information
        client_info = jwt_security.get_client_info(request)
        
        # Create new access token
        new_access_token = jwt_security.refresh_access_token(refresh_token, client_info)
        
        # Decode token to get role_id for proper expires_in calculation
        payload = jwt_security.verify_token(new_access_token, token_type="access", client_info=client_info)
        token_duration = jwt_security.get_token_duration(payload.get("role_id"))
        
        logger.info(f"Token refreshed for IP {client_info.get('ip', 'unknown')}")
        
        return TokenResponse(
            access_token=new_access_token,
            expires_in=token_duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout endpoint - clears refresh token cookie
    """
    # CSRF mitigation: validate Origin header explicitly
    origin = request.headers.get("origin", "")
    if not _is_allowed_origin(origin):
        raise HTTPException(status_code=403, detail="Invalid origin")

    # Use the same attributes as when the cookie was set to ensure browsers remove it
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return {"message": "Logged out successfully"}

@router.get("/verify-token")
async def verify_token(request: Request):
    """
    Verify current token and return user info
    """
    # Extract token from Authorization header
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        # Try to get token from HTTP-only cookie as fallback
        token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    # Get client info
    client_info = jwt_security.get_client_info(request)
    
    # Verify token
    try:
        payload = jwt_security.verify_token(token, token_type="access", client_info=client_info)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Return filtered user info
    return {
        "valid": True,
        "user": {k: v for k, v in payload.items() 
                if k not in ["exp", "iat", "aud", "type", "client_hash"]}
    }