import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from ..database import otp_rate_limit_collection, ip_rate_limit_collection
from ..models.otp_rate_limit_models import (
    OTPRateLimitCreate,
    OTPRateLimitInDB,
    IPRateLimitCreate,
    IPRateLimitInDB
)

logger = logging.getLogger("otp_rate_limit")

class OTPRateLimitService:
    """Service for managing OTP rate limiting with progressive cooldowns"""
    
    # Cooldown durations in minutes
    COOLDOWN_LEVELS = {
        0: 0,       # No cooldown
        1: 3,       # 3 minutes after 2nd resend
        2: 10,      # 10 minutes after 3rd resend
        3: 60,      # 1 hour after 4th resend
        4: 1440     # 1 day after 5th resend
    }
    
    # Max requests per level before cooldown increases
    REQUESTS_PER_LEVEL = {
        0: 2,   # Can make 2 requests (initial + 1 resend) before 3min cooldown
        1: 1,   # 1 more request before 10min cooldown
        2: 1,   # 1 more request before 1hr cooldown
        3: 1,   # 1 more request before 1day cooldown
        4: 0    # No more requests allowed until daily reset
    }
    
    @staticmethod
    async def check_device_rate_limit(
        device_fingerprint: str,
        mobile_number: str
    ) -> Tuple[bool, Optional[str], Optional[datetime], int]:
        """
        Check if device/mobile combination can send OTP.
        Returns: (allowed, error_message, cooldown_until, attempts_remaining)
        """
        now = datetime.utcnow()
        
        # Find or create rate limit record
        rate_limit = await otp_rate_limit_collection.find_one({
            "device_fingerprint": device_fingerprint,
            "mobile_number": mobile_number
        })
        
        if not rate_limit:
            # First request - create record
            new_record = OTPRateLimitCreate(
                device_fingerprint=device_fingerprint,
                mobile_number=mobile_number,
                request_count=0,
                cooldown_level=0,
                daily_reset_at=now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            )
            await otp_rate_limit_collection.insert_one(new_record.model_dump())
            return True, None, None, 2  # 2 attempts remaining (initial + 1 resend)
        
        # Check if we need to reset daily (after 24 hours from daily_reset_at)
        if now >= rate_limit["daily_reset_at"]:
            logger.info(f"Daily reset for device {device_fingerprint[:8]}...")
            await otp_rate_limit_collection.update_one(
                {"_id": rate_limit["_id"]},
                {
                    "$set": {
                        "request_count": 0,
                        "cooldown_level": 0,
                        "cooldown_until": None,
                        "daily_reset_at": now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1),
                        "last_request_at": now
                    }
                }
            )
            return True, None, None, 2
        
        # Check if currently in cooldown
        if rate_limit.get("cooldown_until") and now < rate_limit["cooldown_until"]:
            time_remaining = rate_limit["cooldown_until"] - now
            minutes_remaining = int(time_remaining.total_seconds() / 60)
            level = rate_limit["cooldown_level"]
            
            if level == 4:  # 1 day cooldown
                hours_remaining = int(time_remaining.total_seconds() / 3600)
                error_msg = f"Too many OTP requests. Please try again after {hours_remaining} hours."
            elif level == 3:  # 1 hour cooldown
                error_msg = f"Too many OTP requests. Please try again after {minutes_remaining} minutes."
            else:
                error_msg = f"Please wait {minutes_remaining} minutes before requesting another OTP."
            
            return False, error_msg, rate_limit["cooldown_until"], 0
        
        # Check if we can make another request at current level
        current_level = rate_limit["cooldown_level"]
        current_count = rate_limit["request_count"]
        max_for_level = OTPRateLimitService.REQUESTS_PER_LEVEL[current_level]
        
        if current_count >= max_for_level:
            # Need to increase cooldown level
            next_level = min(current_level + 1, 4)
            cooldown_minutes = OTPRateLimitService.COOLDOWN_LEVELS[next_level]
            cooldown_until = now + timedelta(minutes=cooldown_minutes)
            
            await otp_rate_limit_collection.update_one(
                {"_id": rate_limit["_id"]},
                {
                    "$set": {
                        "cooldown_level": next_level,
                        "cooldown_until": cooldown_until,
                        "request_count": 0,
                        "last_request_at": now
                    }
                }
            )
            
            if next_level == 4:
                hours = int(cooldown_minutes / 60)
                error_msg = f"Maximum OTP requests exceeded. Please try again after {hours} hours."
            elif next_level == 3:
                error_msg = f"Too many OTP requests. Please try again after 1 hour."
            else:
                error_msg = f"Please wait {cooldown_minutes} minutes before requesting another OTP."
            
            return False, error_msg, cooldown_until, 0
        
        # Allow request and increment counter
        attempts_remaining = max_for_level - current_count - 1
        
        return True, None, None, attempts_remaining
    
    @staticmethod
    async def record_otp_request(device_fingerprint: str, mobile_number: str):
        """Record that an OTP request was made"""
        now = datetime.utcnow()
        
        await otp_rate_limit_collection.update_one(
            {
                "device_fingerprint": device_fingerprint,
                "mobile_number": mobile_number
            },
            {
                "$inc": {"request_count": 1},
                "$set": {"last_request_at": now}
            }
        )
        
        logger.info(f"OTP request recorded for device {device_fingerprint[:8]}... mobile {mobile_number}")
    
    @staticmethod
    async def cleanup_old_records():
        """Clean up old rate limit records"""
        # Remove records older than 2 days
        cutoff = datetime.utcnow() - timedelta(days=2)
        result = await otp_rate_limit_collection.delete_many({
            "last_request_at": {"$lt": cutoff}
        })
        if result.deleted_count > 0:
            logger.info(f"Cleaned up {result.deleted_count} old OTP rate limit records")


class IPRateLimitService:
    """Service for IP-based rate limiting"""
    
    MAX_REQUESTS_PER_HOUR = 20
    BLOCK_DURATION_HOURS = 24
    
    @staticmethod
    async def check_ip_rate_limit(ip_address: str) -> Tuple[bool, Optional[str]]:
        """
        Check if IP address can make OTP request.
        Returns: (allowed, error_message)
        """
        now = datetime.utcnow()
        
        # Find IP record
        ip_record = await ip_rate_limit_collection.find_one({
            "ip_address": ip_address
        })
        
        if not ip_record:
            # First request from this IP
            new_record = IPRateLimitCreate(
                ip_address=ip_address,
                request_count=0,
                window_start=now
            )
            await ip_rate_limit_collection.insert_one(new_record.model_dump())
            return True, None
        
        # Check if currently blocked
        if ip_record.get("blocked_until") and now < ip_record["blocked_until"]:
            time_remaining = ip_record["blocked_until"] - now
            hours_remaining = int(time_remaining.total_seconds() / 3600)
            error_msg = f"Too many requests from your IP address. Please try again after {hours_remaining} hours."
            logger.warning(f"Blocked IP {ip_address} attempted request. Blocked for {hours_remaining} more hours.")
            return False, error_msg
        
        # Check if we need to reset the window (1 hour)
        time_since_window_start = now - ip_record["window_start"]
        if time_since_window_start >= timedelta(hours=1):
            # Reset window
            await ip_rate_limit_collection.update_one(
                {"_id": ip_record["_id"]},
                {
                    "$set": {
                        "request_count": 0,
                        "window_start": now,
                        "blocked_until": None
                    }
                }
            )
            return True, None
        
        # Check if limit exceeded
        if ip_record["request_count"] >= IPRateLimitService.MAX_REQUESTS_PER_HOUR:
            # Block IP for 24 hours
            blocked_until = now + timedelta(hours=IPRateLimitService.BLOCK_DURATION_HOURS)
            await ip_rate_limit_collection.update_one(
                {"_id": ip_record["_id"]},
                {
                    "$set": {
                        "blocked_until": blocked_until,
                        "request_count": 0,
                        "window_start": now
                    },
                    "$inc": {"total_blocks": 1}
                }
            )
            
            logger.warning(f"IP {ip_address} exceeded rate limit. Blocked for 24 hours.")
            error_msg = "Too many OTP requests from your IP address. Please try again after 24 hours."
            return False, error_msg
        
        return True, None
    
    @staticmethod
    async def record_ip_request(ip_address: str):
        """Record that an OTP request was made from this IP"""
        await ip_rate_limit_collection.update_one(
            {"ip_address": ip_address},
            {"$inc": {"request_count": 1}}
        )
        
        logger.info(f"OTP request recorded for IP {ip_address}")
    
    @staticmethod
    async def cleanup_old_blocks():
        """Clean up expired IP blocks"""
        now = datetime.utcnow()
        result = await ip_rate_limit_collection.update_many(
            {
                "blocked_until": {"$lt": now}
            },
            {
                "$set": {"blocked_until": None}
            }
        )
        if result.modified_count > 0:
            logger.info(f"Cleaned up {result.modified_count} expired IP blocks")


# Global service instances
otp_rate_limit_service = OTPRateLimitService()
ip_rate_limit_service = IPRateLimitService()
