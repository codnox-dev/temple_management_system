import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pymongo import ASCENDING, IndexModel
from typing import Optional

# Load environment variables from .env file
load_dotenv()

# --- Database Connection Configuration ---
MONGODB_LOCAL_URL = os.getenv("MONGODB_LOCAL_URL", "")
MONGODB_CLOUD_URL = os.getenv("MONGODB_CLOUD_URL", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "temple_db")

# Determine which database to use as primary
# Options: "local" or "cloud"
# - "local": Use local MongoDB as primary, sync to cloud (for on-premise/offline setups)
# - "cloud": Use cloud MongoDB as primary, no sync needed (for hosted services)
PRIMARY_DATABASE = os.getenv("PRIMARY_DATABASE", "local").lower()

# Validate configuration
if PRIMARY_DATABASE not in ["local", "cloud"]:
    raise ValueError(f"PRIMARY_DATABASE must be 'local' or 'cloud', got '{PRIMARY_DATABASE}'")

# --- Initialize Database Connections ---
local_client: Optional[AsyncIOMotorClient] = None
local_database = None
remote_client: Optional[AsyncIOMotorClient] = None
remote_database = None

# Initialize primary database
if PRIMARY_DATABASE == "local":
    if not MONGODB_LOCAL_URL:
        raise ValueError("PRIMARY_DATABASE is 'local' but MONGODB_LOCAL_URL is not set in .env")
    
    local_client = AsyncIOMotorClient(MONGODB_LOCAL_URL)
    local_database = local_client[DATABASE_NAME]
    print(f"✓ Primary database: LOCAL MongoDB")
    
    # Initialize remote for sync (optional)
    if MONGODB_CLOUD_URL:
        try:
            remote_client = AsyncIOMotorClient(MONGODB_CLOUD_URL)
            remote_database = remote_client[DATABASE_NAME]
            print(f"✓ Secondary database: CLOUD MongoDB (sync enabled)")
        except Exception as e:
            print(f"⚠ Warning: Could not connect to cloud MongoDB: {e}")
            print(f"  Sync features will be disabled.")
    else:
        print("⚠ No MONGODB_CLOUD_URL configured. Sync features will be disabled.")

elif PRIMARY_DATABASE == "cloud":
    if not MONGODB_CLOUD_URL:
        raise ValueError("PRIMARY_DATABASE is 'cloud' but MONGODB_CLOUD_URL is not set in .env")
    
    remote_client = AsyncIOMotorClient(MONGODB_CLOUD_URL)
    remote_database = remote_client[DATABASE_NAME]
    print(f"✓ Primary database: CLOUD MongoDB")
    print(f"  Running in cloud mode - sync features disabled (not needed)")

# Set primary database reference
if PRIMARY_DATABASE == "local":
    client = local_client
    database = local_database
else:  # cloud
    client = remote_client
    database = remote_database

def get_database():
    """Get the primary database instance"""
    return database

def get_local_database():
    """Get the local database instance explicitly (None if cloud-only)"""
    return local_database

def get_remote_database():
    """Get the remote database instance (None if local-only)"""
    return remote_database

def is_sync_enabled() -> bool:
    """
    Check if sync should be enabled.
    Sync is only needed when:
    - PRIMARY_DATABASE is 'local' (on-premise setup)
    - AND remote database is configured
    
    Cloud-hosted instances don't need sync.
    """
    return PRIMARY_DATABASE == "local" and remote_client is not None and remote_database is not None

def get_primary_database_type() -> str:
    """Get the primary database type ('local' or 'cloud')"""
    return PRIMARY_DATABASE

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
events_section_collection = database.get_collection("events_section")
calendar_collection = database.get_collection("calendar")
calendar_audit_collection = database.get_collection("calendar_audit")
login_attempts_collection = database.get_collection("login_attempts")

# Enhanced Security Collections
token_revocation_collection = database.get_collection("token_revocation")
device_fingerprints_collection = database.get_collection("device_fingerprints")
security_events_collection = database.get_collection("security_events")
user_sessions_collection = database.get_collection("user_sessions")

# Sync Management Collections
conflict_logs_collection = database.get_collection("conflict_logs")
sync_logs_collection = database.get_collection("sync_logs")
sync_config_collection = database.get_collection("sync_config")

# Backup Management Collections
backup_metadata_collection = database.get_collection("backup_metadata")

# Ensure unique index on username for admins collection
async def ensure_indexes():
    """Creates required indexes on startup if they don't exist."""
    # Admins
    await admins_collection.create_index([("username", ASCENDING)], unique=True, name="uniq_username")
    # Unique mobile number (combination of prefix + number)
    try:
        await admins_collection.create_index(
            [("mobile_prefix", ASCENDING), ("mobile_number", ASCENDING)],
            unique=True,
            name="uniq_mobile_number"
        )
    except Exception as e:
        # If duplicates exist, index creation will fail; log and continue
        print(f"Warning: Could not create unique index on mobile_number: {e}")

    # Calendar indexes
    # Unique date key
    await calendar_collection.create_index([("dateISO", ASCENDING)], unique=True, name="uniq_dateISO")
    # Query patterns
    await calendar_collection.create_index([("naal", ASCENDING), ("dateISO", ASCENDING)], name="naal_dateISO")
    await calendar_collection.create_index([("malayalam_year", ASCENDING), ("dateISO", ASCENDING)], name="malayalamYear_dateISO")
    await calendar_collection.create_index([("year", ASCENDING), ("month", ASCENDING), ("day", ASCENDING)], name="ymd")

    # Login attempt rate limit indexes
    await login_attempts_collection.create_index(
        [("ip_address", ASCENDING), ("device_identifier", ASCENDING)],
        unique=True,
        name="uniq_ip_device_attempt"
    )
    await login_attempts_collection.create_index([( "window_start", ASCENDING)], name="login_window_idx")
    await login_attempts_collection.create_index([( "blocked_until", ASCENDING)], name="login_block_idx")
    # User sessions indexes
    await user_sessions_collection.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)], name="user_sessions")
    await user_sessions_collection.create_index([("expires_at", ASCENDING)], name="session_expiry")


# Note: The index creation is now within an async function.
# This should be called during your application's startup event in main.py.
