from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from bson import ObjectId
from .main_models import PyObjectId
from datetime import datetime

class OTPBase(BaseModel):
    """Base OTP model with common fields"""
    mobile_number: str = Field(..., example="+911234567890", description="Full mobile number with country code")
    hashed_otp: str = Field(..., description="Bcrypt hashed OTP for security")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="OTP expiration time (5 minutes from creation)")
    is_used: bool = Field(default=False, description="Whether this OTP has been used")
    attempts: int = Field(default=0, description="Number of verification attempts")
    max_attempts: int = Field(default=3, description="Maximum allowed verification attempts")

class OTPCreate(OTPBase):
    """Schema for creating a new OTP"""
    pass

class OTPInDB(OTPBase):
    """OTP model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

class OTPVerificationRequest(BaseModel):
    """Schema for OTP verification request"""
    mobile_number: str = Field(..., example="+911234567890", description="Full mobile number with country code")
    otp: str = Field(..., example="123456", description="6-digit OTP", min_length=6, max_length=6)

class OTPSendRequest(BaseModel):
    """Schema for sending OTP request"""
    mobile_number: str = Field(..., example="+911234567890", description="Full mobile number with country code")

class OTPResponse(BaseModel):
    """Response after sending OTP"""
    message: str
    mobile_number: str
    expires_in: int = Field(..., description="Expiration time in seconds")