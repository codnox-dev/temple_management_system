from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from bson import ObjectId
from .main_models import PyObjectId
from datetime import datetime

class OTPRateLimitBase(BaseModel):
    """Base model for OTP rate limiting per device/fingerprint"""
    device_fingerprint: str = Field(..., description="Browser/device fingerprint")
    mobile_number: str = Field(..., description="Mobile number being requested")
    request_count: int = Field(default=0, description="Number of OTP requests in current window")
    last_request_at: datetime = Field(default_factory=datetime.utcnow)
    cooldown_until: Optional[datetime] = Field(default=None, description="Cooldown expiry time")
    cooldown_level: int = Field(default=0, description="Current cooldown level (0-4)")
    # Cooldown levels: 0=no cooldown, 1=3min, 2=10min, 3=1hr, 4=1day
    daily_reset_at: datetime = Field(default_factory=lambda: datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))

class OTPRateLimitCreate(OTPRateLimitBase):
    """Schema for creating OTP rate limit record"""
    pass

class OTPRateLimitInDB(OTPRateLimitBase):
    """OTP rate limit as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

class IPRateLimitBase(BaseModel):
    """Base model for IP-based rate limiting"""
    ip_address: str = Field(..., description="IP address making requests")
    request_count: int = Field(default=0, description="Number of OTP requests in current hour")
    window_start: datetime = Field(default_factory=datetime.utcnow, description="Start of current rate limit window")
    blocked_until: Optional[datetime] = Field(default=None, description="Block expiry time if rate limit exceeded")
    total_blocks: int = Field(default=0, description="Total number of times this IP has been blocked")

class IPRateLimitCreate(IPRateLimitBase):
    """Schema for creating IP rate limit record"""
    pass

class IPRateLimitInDB(IPRateLimitBase):
    """IP rate limit as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

class ResendOTPRequest(BaseModel):
    """Schema for resend OTP request"""
    mobile_number: str = Field(..., example="+911234567890", description="Full mobile number with country code")
    device_fingerprint: str = Field(..., description="Browser/device fingerprint for rate limiting")

class ResendOTPResponse(BaseModel):
    """Response after resending OTP"""
    message: str
    mobile_number: str
    expires_in: int = Field(..., description="Expiration time in seconds")
    cooldown_until: Optional[datetime] = Field(None, description="Next allowed resend time")
    attempts_remaining: int = Field(..., description="Remaining resend attempts before next cooldown")
