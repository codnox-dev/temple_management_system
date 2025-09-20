import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

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
events_collection = database.get_collection("events")
admins_collection = database.get_collection("admins")
gallery_collection = database.get_collection("gallery_images")
stock_collection = database.get_collection("stock")
roles_collection = database.get_collection("roles")
