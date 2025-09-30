import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pymongo import ASCENDING, IndexModel

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
committee_collection = database.get_collection("committee_members")
stock_collection = database.get_collection("stock")
roles_collection = database.get_collection("roles")
activities_collection = database.get_collection("activities") 
gallery_layouts_collection = database.get_collection("gallery_layouts")
gallery_slideshow_collection = database.get_collection("gallery_slideshow")
gallery_home_preview_collection = database.get_collection("gallery_home_preview")
events_featured_collection = database.get_collection("events_featured")
calendar_collection = database.get_collection("calendar")
calendar_audit_collection = database.get_collection("calendar_audit")

# Ensure unique index on username for admins collection
async def ensure_indexes():
    """Creates required indexes on startup if they don't exist."""
    # Admins
    await admins_collection.create_index([("username", ASCENDING)], unique=True, name="uniq_username")
    # Unique google_email only when field exists
    try:
        await admins_collection.create_index(
            [("google_email", ASCENDING)],
            unique=True,
            name="uniq_google_email",
            partialFilterExpression={"google_email": {"$exists": True, "$type": "string"}}
        )
    except Exception as e:
        # If duplicates exist, index creation will fail; log and continue
        print(f"Warning: Could not create unique index on google_email: {e}")

    # Calendar indexes
    # Unique date key
    await calendar_collection.create_index([("dateISO", ASCENDING)], unique=True, name="uniq_dateISO")
    # Query patterns
    await calendar_collection.create_index([("naal", ASCENDING), ("dateISO", ASCENDING)], name="naal_dateISO")
    await calendar_collection.create_index([("malayalam_year", ASCENDING), ("dateISO", ASCENDING)], name="malayalamYear_dateISO")
    await calendar_collection.create_index([("year", ASCENDING), ("month", ASCENDING), ("day", ASCENDING)], name="ymd")

    # Audit indexes
    await calendar_audit_collection.create_index([("dateISO", ASCENDING), ("timestamp", ASCENDING)], name="audit_date_time")

# Note: The index creation is now within an async function.
# This should be called during your application's startup event in main.py.
