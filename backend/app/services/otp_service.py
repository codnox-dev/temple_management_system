import bcrypt
import secrets
import random
from datetime import datetime, timedelta
from typing import Optional
from ..database import otp_collection, admins_collection
from ..models.otp_models import OTPCreate, OTPInDB
import logging

logger = logging.getLogger("otp_service")

class OTPService:
    """Service for handling OTP operations"""
    
    @staticmethod
    def generate_otp() -> str:
        """Generate a secure 6-digit OTP"""
        # Use cryptographically secure random generation
        return f"{secrets.randbelow(900000) + 100000:06d}"
    
    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash OTP using bcrypt for secure storage"""
        return bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
        """Verify OTP against its hash"""
        try:
            return bcrypt.checkpw(plain_otp.encode('utf-8'), hashed_otp.encode('utf-8'))
        except Exception as e:
            logger.error(f"Error verifying OTP hash: {e}")
            return False
    
    @staticmethod
    def normalize_mobile_number(mobile_number: str) -> str:
        """
        Normalize mobile number format:
        - Remove spaces, dashes, parentheses
        - Ensure it starts with country code
        - Default to +91 if no country code provided
        """
        # Remove all non-digit and non-plus characters
        cleaned = ''.join(c for c in mobile_number if c.isdigit() or c == '+')
        
        # If no + at start, assume it's missing country code
        if not cleaned.startswith('+'):
            # If it's 10 digits, assume Indian number
            if len(cleaned) == 10:
                cleaned = '+91' + cleaned
            else:
                # Add + if it looks like it already has country code
                cleaned = '+' + cleaned
        
        return cleaned
    
    @staticmethod
    async def create_otp(mobile_number: str) -> tuple[str, OTPInDB]:
        """
        Create a new OTP for the given mobile number.
        Returns tuple of (plain_otp, otp_document)
        """
        # Normalize mobile number
        normalized_mobile = OTPService.normalize_mobile_number(mobile_number)
        
        # Check if admin exists with this mobile number
        admin = await admins_collection.find_one({
            "$expr": {
                "$eq": [
                    {"$concat": ["$mobile_prefix", {"$toString": "$mobile_number"}]},
                    normalized_mobile
                ]
            }
        })
        
        if not admin:
            raise ValueError("No admin account found with this mobile number")
        
        # Invalidate any existing OTPs for this mobile number
        await otp_collection.delete_many({"mobile_number": normalized_mobile})
        
        # Generate new OTP
        plain_otp = OTPService.generate_otp()
        hashed_otp = OTPService.hash_otp(plain_otp)
        
        # Create OTP document
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        otp_data = OTPCreate(
            mobile_number=normalized_mobile,
            hashed_otp=hashed_otp,
            expires_at=expires_at
        )
        
        # Insert into database
        result = await otp_collection.insert_one(otp_data.model_dump())
        otp_doc = await otp_collection.find_one({"_id": result.inserted_id})
        
        # Print OTP to terminal for debugging (remove in production)
        print(f"🔐 DEBUG OTP for {normalized_mobile}: {plain_otp}")
        logger.info(f"OTP generated for mobile number: {normalized_mobile}")
        
        return plain_otp, OTPInDB(**otp_doc)
    
    @staticmethod
    async def verify_otp(mobile_number: str, plain_otp: str) -> Optional[dict]:
        """
        Verify OTP for the given mobile number.
        Returns admin document if successful, None otherwise.
        """
        # Normalize mobile number
        normalized_mobile = OTPService.normalize_mobile_number(mobile_number)
        
        # Find the OTP document
        otp_doc = await otp_collection.find_one({
            "mobile_number": normalized_mobile,
            "is_used": False
        })
        
        if not otp_doc:
            logger.warning(f"No valid OTP found for mobile: {normalized_mobile}")
            return None
        
        # Check if OTP has expired
        if datetime.utcnow() > otp_doc["expires_at"]:
            logger.warning(f"Expired OTP attempt for mobile: {normalized_mobile}")
            await otp_collection.delete_one({"_id": otp_doc["_id"]})
            return None
        
        # Check max attempts
        if otp_doc["attempts"] >= otp_doc["max_attempts"]:
            logger.warning(f"Max attempts exceeded for mobile: {normalized_mobile}")
            await otp_collection.delete_one({"_id": otp_doc["_id"]})
            return None
        
        # Increment attempt count
        await otp_collection.update_one(
            {"_id": otp_doc["_id"]},
            {"$inc": {"attempts": 1}}
        )
        
        # Verify OTP
        if not OTPService.verify_otp_hash(plain_otp, otp_doc["hashed_otp"]):
            logger.warning(f"Invalid OTP attempt for mobile: {normalized_mobile}")
            return None
        
        # Mark OTP as used and delete it
        await otp_collection.delete_one({"_id": otp_doc["_id"]})
        
        # Find and return admin user
        admin = await admins_collection.find_one({
            "$expr": {
                "$eq": [
                    {"$concat": ["$mobile_prefix", {"$toString": "$mobile_number"}]},
                    normalized_mobile
                ]
            }
        })
        
        if admin:
            # Update last login time
            await admins_collection.update_one(
                {"_id": admin["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            logger.info(f"Successful OTP login for admin: {admin.get('username')} ({normalized_mobile})")
        
        return admin
    
    @staticmethod
    async def cleanup_expired_otps():
        """Clean up expired OTPs from database"""
        result = await otp_collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })
        if result.deleted_count > 0:
            logger.info(f"Cleaned up {result.deleted_count} expired OTPs")

# Global OTP service instance
otp_service = OTPService()