#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_user():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['temple_db']
    
    # Check the specific user
    user_id = '68f494d39bf2434b11cb73ee'
    user = await db.admins.find_one({'_id': ObjectId(user_id)})
    
    if user:
        print(f"✓ User found: {user.get('username')}")
        print(f"  Role: '{user.get('role')}'")
        print(f"  Role type: {type(user.get('role'))}")
        print(f"  isAttendance: {user.get('isAttendance', 'FIELD NOT SET')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Created: {user.get('created_at', 'N/A')}")
    else:
        print(f"✗ User with ID {user_id} not found")
    
    print("\n" + "="*50)
    print("All users with Super Admin role:")
    print("="*50)
    
    # Find all super admin users (try different variations)
    variations = ['Super_Admin', 'Super Admin', 'super_admin', 'superadmin', 'SUPER_ADMIN']
    for variation in variations:
        count = await db.admins.count_documents({'role': variation})
        if count > 0:
            print(f"\n'{variation}': {count} users")
            async for u in db.admins.find({'role': variation}):
                print(f"  - {u.get('username')} (ID: {u['_id']}, isAttendance: {u.get('isAttendance', 'NOT SET')})")
    
    await client.close()

if __name__ == '__main__':
    asyncio.run(check_user())
