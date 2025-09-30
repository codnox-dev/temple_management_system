from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from ..database import admins_collection
from .jwt_security_service import jwt_security
from ..models import AdminCreate

# Token URL is only used for docs; tokens are issued under /api/auth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Admin Database Operations ---
async def create_admin(admin: AdminCreate):
    """
    Used to create a new admin user in the database.
    This function takes an AdminCreate schema object, dumps it to a dictionary,
    and inserts it into the admins_collection.
    """
    admin_data = admin.model_dump()
    result = await admins_collection.insert_one(admin_data)
    new_admin = await admins_collection.find_one({"_id": result.inserted_id})
    return new_admin

async def get_admin_by_username(username: str):
    """Fetches a single admin user from the database by username."""
    return await admins_collection.find_one({"username": username})

async def get_admin_by_google_email(google_email: str):
    """Fetch admin by linked Google email."""
    return await admins_collection.find_one({"google_email": google_email})

# --- Dependency for protected routes ---
async def get_current_admin(request: Request, token: str = Depends(oauth2_scheme)):
    """
    Validate JWT (prefer the already-verified payload from middleware), then
    load and return the current admin document from the database.
    
    Accepts tokens issued by the unified jwt_security service (with audience
    and optional client binding) to avoid decode mismatches.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # If middleware already validated, reuse its payload to keep validation consistent
        payload = getattr(request.state, "user", None)
        if not payload:
            # Fallback: verify using the centralized JWT security service
            client_info = jwt_security.get_client_info(request)
            payload = jwt_security.verify_token(token, token_type="access", client_info=client_info)

        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except HTTPException:
        # Bubble up auth errors from jwt_security.verify_token
        raise
    except Exception:
        raise credentials_exception
    
    admin = await get_admin_by_username(username)
    if admin is None:
        raise credentials_exception
    return admin
