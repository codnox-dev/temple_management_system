from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..services.jwt_security_service import jwt_security
from ..services.auth_service import authenticate_admin, get_admin_by_username

router = APIRouter()
logger = logging.getLogger("auth")

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
        
        # Create tokens
        access_token = jwt_security.create_access_token(token_data, client_info)
        refresh_token = jwt_security.create_refresh_token(token_data, client_info)
        
        logger.info(f"Initial token issued to IP {client_info.get('ip', 'unknown')}")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=jwt_security.access_token_expire_minutes * 60,
            refresh_token=refresh_token
        )
        
    except Exception as e:
        logger.error(f"Token creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create token")

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Admin login endpoint - returns JWT tokens for authenticated users
    """
    try:
        # Authenticate admin user
        admin_user = await authenticate_admin(form_data.username, form_data.password)
        if not admin_user:
            logger.warning(f"Failed login attempt for username: {form_data.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get client information for token binding
        client_info = jwt_security.get_client_info(request)
        
        # Create token data
        token_data = {
            "sub": admin_user["username"],
            "user_id": str(admin_user["_id"]),
            "role": admin_user.get("role", "admin"),
            "role_id": admin_user.get("role_id", 1),
            "permissions": admin_user.get("permissions", [])
        }
        
        # Create tokens
        access_token = jwt_security.create_access_token(token_data, client_info)
        refresh_token = jwt_security.create_refresh_token(token_data, client_info)
        
        # Set refresh token as HTTP-only cookie for security
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,  # HTTPS only
            samesite="strict",  # CSRF protection
            max_age=jwt_security.refresh_token_expire_days * 24 * 60 * 60
        )
        
        logger.info(f"Admin login successful: {admin_user['username']} from IP {client_info.get('ip', 'unknown')}")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=jwt_security.access_token_expire_minutes * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication error")

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(request: Request, refresh_request: RefreshTokenRequest = None):
    """
    Refresh access token using refresh token
    """
    try:
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
async def logout(response: Response):
    """
    Logout endpoint - clears refresh token cookie
    """
    response.delete_cookie(key="refresh_token", httponly=True, secure=True, samesite="strict")
    return {"message": "Logged out successfully"}

@router.get("/verify-token")
async def verify_token(request: Request):
    """
    Verify current token and return user info
    """
    # This endpoint is protected by middleware, so if we reach here, token is valid
    user_info = getattr(request.state, 'user', {})
    return {
        "valid": True,
        "user": {k: v for k, v in user_info.items() 
                if k not in ["exp", "iat", "aud", "type", "client_hash"]}
    }