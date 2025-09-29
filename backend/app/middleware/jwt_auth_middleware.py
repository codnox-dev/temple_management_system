import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from ..services.jwt_security_service import jwt_security

# Configure logging for security events
logger = logging.getLogger("jwt_security")
logger.setLevel(logging.INFO)

class JWTAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        # Paths that don't require JWT authentication
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json", "/", 
            "/api/auth/login", "/api/auth/register", "/api/auth/get-token", 
            "/api/auth/refresh-token", "/api"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip validation for CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)
            
        # Skip validation for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Skip validation for non-API paths (static files, etc.)
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Log the request for monitoring
        client_ip = request.client.host if request.client else "unknown"
        origin = request.headers.get("origin", "unknown")
        logger.info(f"API request: {request.method} {request.url.path} from IP {client_ip}, Origin: {origin}")
        
        try:
            # Extract token from Authorization header or cookie
            token = None
            auth_header = request.headers.get("Authorization")
            
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            else:
                # Try to get token from HTTP-only cookie as fallback
                token = request.cookies.get("access_token")
            
            if not token:
                logger.warning(f"Missing token for {request.method} {request.url.path} from IP {client_ip}")
                return JSONResponse(
                    status_code=401,
                    content={
                        "detail": "Authentication required",
                        "error_code": "MISSING_TOKEN"
                    }
                )
            
            # Get client info for token binding
            client_info = jwt_security.get_client_info(request)
            
            # Verify token
            payload = jwt_security.verify_token(token, token_type="access", client_info=client_info)
            
            # Add user info to request state
            request.state.user = payload
            request.state.client_info = client_info
            
            # Continue with the request
            response = await call_next(request)
            return response
            
        except HTTPException as e:
            # Log security violation for monitoring
            logger.warning(
                f"JWT security violation: {request.method} {request.url.path} "
                f"from IP {client_ip}, Error: {e.detail}"
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "detail": e.detail,
                    "error_code": "AUTHENTICATION_FAILED"
                }
            )
            
        except Exception as e:
            # Log the error for debugging (but don't expose details)
            logger.error(f"JWT middleware error: {str(e)}")
            
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Authentication error",
                    "error_code": "AUTH_ERROR"
                }
            )