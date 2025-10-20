"""
Quick script to set isAttendance flag for the admin user
Run this from the backend directory: python set_admin_attendance.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def set_attendance_flag():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.temple_db
    
    # Update the admin user
    user_id = "68f494d39bf2434b11cb73ee"
    
    result = await db.admins.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"isAttendance": True}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully set isAttendance=True for user {user_id}")
        
        # Verify
        user = await db.admins.find_one({"_id": ObjectId(user_id)})
        print(f"User: {user.get('name')} (@{user.get('username')})")
        print(f"Role: {user.get('role')}")
        print(f"isAttendance: {user.get('isAttendance', False)}")
    else:
        print(f"❌ User {user_id} not found or already has isAttendance=True")
    
    # Show all users with isAttendance=True
    print("\n📋 All users enrolled in attendance:")
    cursor = db.admins.find({"isAttendance": True})
    async for user in cursor:
        print(f"  - {user.get('name')} (@{user.get('username')}) - Role: {user.get('role')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(set_attendance_flag())
