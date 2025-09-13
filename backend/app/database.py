import os
from motor.motor_asyncio import AsyncIOMotorClient

# --- Database Connection ---
MONGO_DETAILS = os.getenv("MONGODB_URL", "mongodb://mongo:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "temple_db")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DATABASE_NAME]

# --- Collections ---
available_rituals_collection = database.get_collection("available_rituals")
bookings_collection = database.get_collection("bookings")
events_collection = database.get_collection("events")
admins_collection = database.get_collection("admins")
gallery_collection = database.get_collection("gallery_images")

