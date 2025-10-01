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
        # Role-based token durations
        self.low_privilege_token_minutes = int(os.getenv("LOW_PRIVILEGE_TOKEN_MINUTES", 10))
        self.high_privilege_token_minutes = int(os.getenv("HIGH_PRIVILEGE_TOKEN_MINUTES", 60))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
        self.audience = os.getenv("JWT_AUDIENCE", "https://vamana-temple.netlify.app")
        # Whether to bind tokens to client info (IP/UA). Disabled by default to avoid issues behind proxies.
        self.bind_to_client = os.getenv("JWT_BIND_TO_CLIENT", "false").lower() in {"1", "true", "yes"}
        # When extracting client IP, trust X-Forwarded-For if running behind a reverse proxy
        self.trust_proxy = os.getenv("TRUST_PROXY", "true").lower() in {"1", "true", "yes"}
        
        if not self.secret_key:
            raise ValueError("SECRET_KEY environment variable is required")
    
    def create_access_token(self, data: dict, client_info: Optional[Dict[str, str]] = None) -> str:
        """Create a short-lived JWT access token with role-based expiration"""
        to_encode = data.copy()
        
        # Determine token duration based on role_id
        role_id = data.get("role_id", 1)
        if role_id is not None and role_id >= 4:
            # Higher privilege roles get longer session times
            expire_minutes = self.high_privilege_token_minutes
        else:
            # Lower privilege roles get shorter session times (more secure)
            expire_minutes = self.low_privilege_token_minutes
        
        expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
        
        # Add standard claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "aud": self.audience,
            "type": "access"
        })
        
        # Add unique token ID for revocation
        to_encode["jti"] = secrets.token_hex(16)
        
        # Optionally bind to client (IP/UA) for additional security
        if self.bind_to_client and client_info:
            to_encode["client_hash"] = self._hash_client_info(client_info)
        
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
            "type": "refresh"
        })
        
        # Add unique token ID for revocation
        to_encode["jti"] = secrets.token_hex(16)
        
        # Optionally bind to client (IP/UA) for additional security
        if self.bind_to_client and client_info:
            to_encode["client_hash"] = self._hash_client_info(client_info)
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str, token_type: str = "access", client_info: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience=self.audience,
                options={"require": ["exp", "iat", "aud"]}
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            
            # Verify client binding if enabled
            if self.bind_to_client and client_info:
                expected_hash = self._hash_client_info(client_info)
                if payload.get("client_hash") != expected_hash:
                    raise HTTPException(status_code=401, detail="Token not valid for this client")
            
            return payload
            
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    def _hash_client_info(self, client_info: Dict[str, str]) -> str:
        """Create a hash of client information for token binding"""
        client_string = f"{client_info.get('ip', '')}{client_info.get('user_agent', '')}"
        return hashlib.sha256(client_string.encode()).hexdigest()
    
    def get_client_info(self, request: Request) -> Dict[str, str]:
        """Extract client information from request for token binding"""
        # Get real IP, considering proxy headers if trust_proxy is enabled
        ip = ""
        if self.trust_proxy:
            # Check common proxy headers in order of preference
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                # Take the first IP in the chain (original client)
                ip = forwarded_for.split(",")[0].strip()
            else:
                real_ip = request.headers.get("x-real-ip")
                if real_ip:
                    ip = real_ip.strip()
        
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
    
    def get_token_duration(self, role_id: Optional[int] = None) -> int:
        """Get token duration in seconds based on role_id"""
        if role_id is not None and role_id >= 4:
            return self.high_privilege_token_minutes * 60
        else:
            return self.low_privilege_token_minutes * 60

# Global instance
jwt_security = JWTSecurityService()