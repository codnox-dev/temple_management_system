import os
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request
import secrets
import hashlib

class JWTSecurityService:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 7))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
        self.audience = os.getenv("JWT_AUDIENCE", "https://vamana-temple.netlify.app")
        # Whether to bind tokens to client info (IP/UA). Disabled by default to avoid issues behind proxies.
        self.bind_to_client = os.getenv("JWT_BIND_TO_CLIENT", "false").lower() in {"1", "true", "yes"}
        # When extracting client IP, trust X-Forwarded-For if running behind a reverse proxy
        self.trust_proxy = os.getenv("TRUST_PROXY", "true").lower() in {"1", "true", "yes"}
        
        if not self.secret_key:
            raise ValueError("SECRET_KEY environment variable is required")
    
    def create_access_token(self, data: dict, client_info: Optional[Dict[str, str]] = None) -> str:
        """Create a short-lived JWT access token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        # Add standard claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "aud": self.audience,
            "type": "access"
        })
        
        # Add client binding for additional security (configurable)
        if self.bind_to_client and client_info:
            client_hash = hashlib.sha256(
                f"{client_info.get('ip', '')}{client_info.get('user_agent', '')}".encode()
            ).hexdigest()[:16]
            to_encode["client_hash"] = client_hash
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, data: dict, client_info: Optional[Dict[str, str]] = None) -> str:
        """Create a long-lived JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        # Add standard claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "aud": self.audience,
            "type": "refresh",
            "jti": secrets.token_hex(16)  # Unique token ID for revocation
        })
        
        # Add client binding
        if self.bind_to_client and client_info:
            client_hash = hashlib.sha256(
                f"{client_info.get('ip', '')}{client_info.get('user_agent', '')}".encode()
            ).hexdigest()[:16]
            to_encode["client_hash"] = client_hash
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str, token_type: str = "access", client_info: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience=self.audience
            )
            
            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            
            # Verify client binding if enabled and present
            if self.bind_to_client and client_info and "client_hash" in payload:
                expected_hash = hashlib.sha256(
                    f"{client_info.get('ip', '')}{client_info.get('user_agent', '')}".encode()
                ).hexdigest()[:16]

                if payload["client_hash"] != expected_hash:
                    raise HTTPException(status_code=401, detail="Token bound to different client")
            
            return payload
            
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            raise HTTPException(status_code=401, detail="Token validation failed")
    
    def get_client_info(self, request: Request) -> Dict[str, str]:
        """Extract client information for token binding. If behind a proxy and TRUST_PROXY is true,
        prefer X-Forwarded-For header's first IP."""
        ip = ""
        if self.trust_proxy:
            xff = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
            if xff:
                # Take the first IP in the list
                ip = xff.split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else ""
        return {
            "ip": ip,
            "user_agent": request.headers.get("user-agent", "")
        }
    
    def refresh_access_token(self, refresh_token: str, client_info: Optional[Dict[str, str]] = None) -> str:
        """Generate new access token using refresh token"""
        # Verify refresh token
        payload = self.verify_token(refresh_token, token_type="refresh", client_info=client_info)
        
        # Create new access token with same user data
        user_data = {k: v for k, v in payload.items() 
                    if k not in ["exp", "iat", "aud", "type", "jti", "client_hash"]}
        
        return self.create_access_token(user_data, client_info)

# Global instance
jwt_security = JWTSecurityService()