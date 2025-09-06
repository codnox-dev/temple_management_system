import os
from motor.motor_asyncio import AsyncIOMotorClient

# --- Database Connection ---
MONGO_DETAILS = os.getenv("MONGODB_URL", "mongodb://mongo:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "temple_db")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DATABASE_NAME]

# --- Collections ---
# Stores the list of available rituals for booking
available_rituals_collection = database.get_collection("available_rituals")

# Stores booking transactions
bookings_collection = database.get_collection("bookings")

# Stores temple events
events_collection = database.get_collection("events")

# Stores admin users
admins_collection = database.get_collection("admins")
