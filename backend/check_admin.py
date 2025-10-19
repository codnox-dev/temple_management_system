import asyncio
import os
from app.database import admins_collection
from app.services import auth_service
from dotenv import load_dotenv

load_dotenv()

async def check_admin():
    admin = await admins_collection.find_one({'username': 'admin'})
    print(f'Admin found: {admin is not None}')
    
    if admin:
        print(f'Admin username: {admin.get("username")}')
        print(f'Admin role: {admin.get("role")}')
        print(f'Admin role_id: {admin.get("role_id")}')
        print(f'Last login: {admin.get("last_login")}')
        print(f'Has hashed_password: {admin.get("hashed_password") is not None}')
        print(f'Hashed password length: {len(admin.get("hashed_password", ""))}')
        print(f'Hashed password starts with: {admin.get("hashed_password", "")[:30]}')
        
        # Test with default password from .env
        default_pwd = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin123')
        print(f'\nTesting with password from .env: "{default_pwd}"')
        result = auth_service.verify_password(default_pwd, admin.get('hashed_password'))
        print(f'Password verification result: {result}')
        
        # Test hashing the default password
        test_hash = auth_service.hash_password(default_pwd)
        print(f'\nTest hash of default password starts with: {test_hash[:30]}')
        print(f'DB hash matches test hash: {admin.get("hashed_password") == test_hash}')
        
        # Test with different common passwords
        for test_pwd in ['admin123', 'admin', 'password', 'ChangeMeNow123!']:
            result = auth_service.verify_password(test_pwd, admin.get('hashed_password'))
            print(f'Testing password "{test_pwd}": {result}')

if __name__ == "__main__":
    asyncio.run(check_admin())
