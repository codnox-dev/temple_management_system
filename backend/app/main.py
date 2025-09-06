from fastapi import FastAPI
from .routers import rituals, bookings, events, admin
from .database import available_rituals_collection, admins_collection
from . import crud, auth
from .schemas import AvailableRitualBase, AdminCreate
from typing import List
import asyncio
from fastapi.middleware.cors import CORSMiddleware

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
    # --- Populate Rituals ---
    if await available_rituals_collection.count_documents({}) == 0:
        print("Populating database with initial rituals...")
        initial_rituals = [
            AvailableRitualBase(name='Aarti & Prayers', description='Traditional evening prayers with sacred flames.', price=101, duration='30 mins', popular=True, icon_name='Flame'),
            AvailableRitualBase(name='Puja & Offering', description='Personal worship ceremony with flowers and fruits.', price=251, duration='45 mins', popular=False, icon_name='Flower2'),
            AvailableRitualBase(name='Special Blessing', description='Personalized blessing for health and prosperity.', price=501, duration='1 hour', popular=True, icon_name='Heart'),
            AvailableRitualBase(name='Festival Ceremony', description='Grand rituals for special occasions.', price=1001, duration='2 hours', popular=False, icon_name='Star'),
        ]
        await crud.create_initial_rituals(initial_rituals)
        print("Database populated with initial rituals.")

    # --- Create Default Admin User ---
    if await admins_collection.count_documents({}) == 0:
        print("Creating default admin user...")
        hashed_password = auth.get_password_hash("adminpassword")
        admin_user = AdminCreate(username="admin", hashed_password=hashed_password)
        await crud.create_admin(admin_user)
        print("Default admin created with username 'admin' and password 'adminpassword'.")


# --- API Routers ---
app.include_router(admin.router, tags=["Admin"], prefix="/api/admin")
app.include_router(rituals.router, tags=["Rituals"], prefix="/api/rituals")
app.include_router(events.router, tags=["Events"], prefix="/api/events")
app.include_router(bookings.router, tags=["Bookings"], prefix="/api/bookings")

@app.get("/api")
async def root():
    return {"message": "Welcome to the Temple Management System API"}
