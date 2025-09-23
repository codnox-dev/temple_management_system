import os
import random
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .routers import rituals, bookings, events, admin, gallery, stock, roles, profile, activity # 1. Import the new profile router
from .database import available_rituals_collection, admins_collection, roles_collection
from .models.role_models import RoleBase
from .services import auth_service
from .models.admin_models import AdminCreate
from .models.ritual_models import AvailableRitualBase
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pymongo import ASCENDING

# Load environment variables from .env file at the very beginning
load_dotenv()

# --- App Initialization ---
app = FastAPI(
    title="Temple Management System API",
    description="API for managing temple rituals, events, and bookings.",
    version="1.1.0"
)

# --- CORS Middleware ---
# Allows the frontend to communicate with the backend
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Startup Event to Populate Database ---
@app.on_event("startup")
async def startup_db_client():
    # --- Ensure Unique Indexes ---
    try:
        await admins_collection.create_index([("username", ASCENDING)], unique=True)
        print("Ensured unique index on admins.username")
    except Exception as e:
        # Will fail if duplicates exist; surface a warning so it can be resolved
        print(f"Warning: Could not ensure unique index on admins.username: {e}")

    # --- Populate Rituals ---
    if await available_rituals_collection.count_documents({}) == 0:
        print("Populating database with initial rituals...")
        initial_rituals = [
            AvailableRitualBase(name='Aarti & Prayers', description='Traditional evening prayers with sacred flames.', price=101, duration='30 mins', popular=True, icon_name='Flame'),
            AvailableRitualBase(name='Puja & Offering', description='Personal worship ceremony with flowers and fruits.', price=251, duration='45 mins', popular=False, icon_name='Flower2'),
            AvailableRitualBase(name='Special Blessing', description='Personalized blessing for health and prosperity.', price=501, duration='1 hour', popular=True, icon_name='Heart'),
            AvailableRitualBase(name='Festival Ceremony', description='Grand rituals for special occasions.', price=1001, duration='2 hours', popular=False, icon_name='Star'),
        ]
        # You would typically insert these into the database.
        # For example: await available_rituals_collection.insert_many([r.model_dump() for r in initial_rituals])
        print("Database populated with initial rituals.")

    # --- Populate Roles ---
    if await roles_collection.count_documents({}) == 0:
        print("Populating roles collection with predefined roles...")
        predefined_roles = [
            RoleBase(role_id=0, role_name='Super Admin', basic_permissions=['*']),
            RoleBase(role_id=1, role_name='Admin', basic_permissions=['departments.manage', 'users.manage', 'approvals.manage']),
            RoleBase(role_id=2, role_name='Privileged User', basic_permissions=['staff.extended']),
            RoleBase(role_id=3, role_name='Editor', basic_permissions=['content.create', 'content.update', 'events.manage']),
            RoleBase(role_id=4, role_name='Employee', basic_permissions=['staff.basic']),
            RoleBase(role_id=5, role_name='Viewer', basic_permissions=['read.only']),
            RoleBase(role_id=6, role_name='Volunteer Coordinator', basic_permissions=['volunteers.manage']),
            RoleBase(role_id=7, role_name='Support / Helpdesk', basic_permissions=['support.assist']),
        ]
        await roles_collection.insert_many([r.model_dump() for r in predefined_roles])
        print("Roles collection populated.")

    # --- Create Default Admin User from .env ---
    if await admins_collection.count_documents({}) == 0:
        print("Creating default admin user from .env file...")
        admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD")
        admin_name = os.getenv("DEFAULT_ADMIN_NAME", "Administrator")
        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com")

        if not admin_password:
            raise ValueError("DEFAULT_ADMIN_PASSWORD is not set in the .env file.")

        # Resolve role details from roles collection (role_id=0)
        super_role = await roles_collection.find_one({"role_id": 0})
        role_name = (super_role or {}).get("role_name", "Super Admin")
        role_perms = (super_role or {}).get("basic_permissions", ["*"])

        hashed_password = auth_service.get_password_hash(admin_password)
        admin_user = AdminCreate(
            name=admin_name,
            email=admin_email,
            username=admin_username,
            hashed_password=hashed_password,
            role=role_name,
            role_id=0,
            mobile_number=int(''.join([str(random.randint(0, 9)) for _ in range(10)])),
            mobile_prefix="+91",
            profile_picture="https://example.com/default-avatar.png",
            dob="1970-01-01",
            created_by="system",
            last_profile_update=None,
            permissions=role_perms,
            notification_preference=["email", "whatsapp"],
        )
        # Use the create_admin function from the auth_service
        await auth_service.create_admin(admin_user)
        print(f"Default admin created with username '{admin_username}'.")
        print("Password is set from the DEFAULT_ADMIN_PASSWORD in your .env file.")


# --- API Routers ---
app.include_router(admin.router, tags=["Admin"], prefix="/api/admin")
app.include_router(rituals.router, tags=["Rituals"], prefix="/api/rituals")
app.include_router(events.router, tags=["Events"], prefix="/api/events")
app.include_router(bookings.router, tags=["Bookings"], prefix="/api/bookings")
app.include_router(gallery.router, tags=["Gallery"], prefix="/api/gallery")
app.include_router(stock.router, tags=["Stock"], prefix="/api/stock")
app.include_router(roles.router, tags=["Roles"], prefix="/api/roles")
app.include_router(profile.router, tags=["Profile"], prefix="/api/profile") # 2. Include the new router
app.include_router(activity.router, tags=["Activity"], prefix="/api/activity")

# Serve static files for profile pictures under /static/
import os as _os
_base_dir = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), ".."))
_profile_dir = _os.path.join(_base_dir, "profile")
try:
    _os.makedirs(_profile_dir, exist_ok=True)
except Exception:
    pass
app.mount("/static", StaticFiles(directory=_base_dir), name="static")

@app.get("/api")
async def root():
    return {"message": "Welcome to the Temple Management System API"}
