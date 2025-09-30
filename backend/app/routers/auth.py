from fastapi import APIRouter, HTTPException, Depends, Request, Response
import os
import re
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..services.jwt_security_service import jwt_security
from ..services.auth_service import get_admin_by_username, get_admin_by_google_email
from ..database import admins_collection
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

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
@router.options("/login") 
@router.options("/refresh-token")
@router.options("/google")
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

class GoogleLoginRequest(BaseModel):
    id_token: str

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

@router.post("/google", response_model=TokenResponse)
async def google_login(request: Request, response: Response, payload: GoogleLoginRequest):
    """
    Google Sign-In endpoint: accepts a Google ID token from the frontend, verifies it,
    validates the email, looks up the admin by google_email, and issues our own JWTs.
    """
    try:
        # CSRF mitigation: validate Origin header explicitly
        origin = request.headers.get("origin", "")
        if not _is_allowed_origin(origin):
            raise HTTPException(status_code=403, detail="Invalid origin")

        # Verify Google ID token
        client = google_requests.Request()
        try:
            # Verify signature first
            idinfo = google_id_token.verify_oauth2_token(payload.id_token, client)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        # Validate email and verification
        email = idinfo.get("email")
        email_verified = idinfo.get("email_verified", False)
        if not email or not email_verified:
            raise HTTPException(status_code=401, detail="Unverified Google account")

        # Enforce audience/client ID match
        expected_auds = [a.strip() for a in os.getenv("GOOGLE_CLIENT_IDS", os.getenv("GOOGLE_CLIENT_ID", "")).split(",") if a.strip()]
        if expected_auds:
            aud = idinfo.get("aud")
            if aud not in expected_auds:
                logger.warning(f"Google login rejected due to audience mismatch: aud={aud}")
                raise HTTPException(status_code=401, detail="Invalid Google client")

        # Find admin by google_email
        admin_user = await get_admin_by_google_email(email)
        if not admin_user:
            logger.warning(f"Google login denied for unlinked email: {email}")
            raise HTTPException(status_code=403, detail="No admin account linked to this Google email")

        # Optional: sync profile picture only (do not alter name via Google)
        picture = idinfo.get("picture")
        if picture:
            try:
                await admins_collection.update_one({"_id": admin_user["_id"]}, {"$set": {"profile_picture": picture}})
            except Exception:
                pass

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

        logger.info(f"Google login successful for admin: {admin_user.get('username')} ({email})")
        return TokenResponse(
            access_token=access_token,
            expires_in=jwt_security.access_token_expire_minutes * 60,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(status_code=500, detail="Authentication error")

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Password-based login is disabled. Use /api/auth/google with Google ID token.
    """
    raise HTTPException(status_code=403, detail="Password login disabled. Use Google Sign-In.")

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
        
        logger.info(f"Token refreshed for IP {client_info.get('ip', 'unknown')}")
        
        return TokenResponse(
            access_token=new_access_token,
            expires_in=jwt_security.access_token_expire_minutes * 60
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