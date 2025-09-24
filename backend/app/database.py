import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pymongo import ASCENDING

# Load environment variables from .env file
load_dotenv()

# --- Database Connection ---
MONGO_DETAILS = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "temple_db")

# --- Error Handling for Missing Database URL ---
if not MONGO_DETAILS:
    raise ValueError("No MONGODB_URL set for the database connection. Please set it in your .env file.")


client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DATABASE_NAME]

# --- Collections ---
available_rituals_collection = database.get_collection("available_rituals")
bookings_collection = database.get_collection("bookings")
# This new collection will store bookings made by employees
employee_bookings_collection = database.get_collection("employee_bookings") 
events_collection = database.get_collection("events")
admins_collection = database.get_collection("admins")
gallery_collection = database.get_collection("gallery_images")
stock_collection = database.get_collection("stock")
roles_collection = database.get_collection("roles")
activities_collection = database.get_collection("activities") 
gallery_layouts_collection = database.get_collection("gallery_layouts")
gallery_slideshow_collection = database.get_collection("gallery_slideshow")
events_featured_collection = database.get_collection("events_featured")

# Ensure unique index on username for admins collection
async def ensure_indexes():
    """Creates required indexes on startup if they don't exist."""
    await admins_collection.create_index([("username", ASCENDING)], unique=True)

# Note: The index creation is now within an async function.
# This should be called during your application's startup event in main.py.

