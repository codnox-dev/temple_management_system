"""
Quick script to add default temple location configuration
Run this once to set up a test location for the mobile app
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "temple_management"

async def add_default_location():
    """Add a default temple location for testing"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get first super admin (role_id = 0)
    super_admin = await db.admins.find_one({"role_id": 0})
    
    if not super_admin:
        print("❌ No super admin found! Please create a super admin first.")
        print("   Create one with role_id: 0 in the admins collection")
        return
    
    admin_id = str(super_admin["_id"])
    admin_name = super_admin["name"]
    
    print(f"✅ Found super admin: {admin_name} ({admin_id})")
    
    # Check if location already exists
    existing = await db.location_config.find_one({"is_active": True})
    if existing:
        print(f"⚠️  Active location already exists: {existing['name']}")
        print("   If you want to replace it, delete it first from MongoDB")
        return
    
    # Default location (you can change these coordinates)
    # Example: Guruvayoor Temple, Kerala (you should use your actual temple coordinates)
    default_location = {
        "name": "Temple Location",
        "latitude": 10.5937,  # Example: Guruvayoor Temple latitude
        "longitude": 76.0399,  # Example: Guruvayoor Temple longitude
        "check_in_radius": 100.0,  # 100 meters - user must be within this to check-in
        "outside_radius": 500.0,  # 500 meters - beyond this is considered "outside"
        "address": "Temple Address, City, State",
        "notes": "Default temple location for GPS attendance",
        "created_by": admin_id,
        "updated_by": admin_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
    }
    
    # Insert location
    result = await db.location_config.insert_one(default_location)
    print("\n✅ Default location added successfully!")
    print(f"   ID: {result.inserted_id}")
    print(f"   Name: {default_location['name']}")
    print(f"   Coordinates: {default_location['latitude']}, {default_location['longitude']}")
    print(f"   Check-in radius: {default_location['check_in_radius']}m")
    print(f"   Outside radius: {default_location['outside_radius']}m")
    print("\n📱 Mobile app can now fetch location config!")
    print("   Restart the Flutter app to load the new configuration.")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    print("🏛️  Adding default temple location...\n")
    print("⚠️  IMPORTANT: Update the coordinates below to match your actual temple location!")
    print("   You can get coordinates from Google Maps:")
    print("   1. Right-click on temple location in Google Maps")
    print("   2. Click on the coordinates to copy them")
    print("   3. Update latitude and longitude in this script\n")
    
    asyncio.run(add_default_location())
