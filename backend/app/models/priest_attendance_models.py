"""
Priest Attendance Management Models

This module handles:
- Priest information and daily salary rates
- Daily attendance tracking
- Monthly salary calculations
- Attendance reports and filtering
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom type for MongoDB ObjectId validation"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# ============= Priest Models =============

class PriestBase(BaseModel):
    """Base model for priest information"""
    name: str = Field(..., min_length=1, max_length=100, description="Priest's full name")
    phone: Optional[str] = Field(None, max_length=15, description="Contact phone number")
    email: Optional[str] = Field(None, description="Email address")
    daily_salary: float = Field(..., ge=0, description="Daily salary rate")
    address: Optional[str] = Field(None, max_length=500, description="Residential address")
    specialization: Optional[str] = Field(None, max_length=200, description="Specialization or rituals expertise")
    is_active: bool = Field(default=True, description="Active status")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")


class PriestCreate(PriestBase):
    """Model for creating a new priest"""
    pass


class PriestUpdate(BaseModel):
    """Model for updating priest information"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    email: Optional[str] = None
    daily_salary: Optional[float] = Field(None, ge=0)
    address: Optional[str] = Field(None, max_length=500)
    specialization: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)


class PriestInDB(PriestBase):
    """Priest model as stored in database"""
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class PriestResponse(PriestBase):
    """Response model for priest with attendance stats"""
    id: str
    created_at: datetime
    updated_at: datetime
    total_days_worked: Optional[int] = 0
    current_month_days: Optional[int] = 0
    current_month_salary: Optional[float] = 0.0

    class Config:
        populate_by_name = True


# ============= Attendance Models =============

class AttendanceRecordBase(BaseModel):
    """Base model for daily attendance record"""
    priest_id: str = Field(..., description="Priest's unique ID")
    attendance_date: date = Field(..., description="Date of attendance")
    is_present: bool = Field(default=True, description="Presence status")
    check_in_time: Optional[str] = Field(None, description="Check-in time (HH:MM)")
    check_out_time: Optional[str] = Field(None, description="Check-out time (HH:MM)")
    half_day: bool = Field(default=False, description="Half day attendance")
    overtime_hours: float = Field(default=0.0, ge=0, description="Overtime hours")
    notes: Optional[str] = Field(None, max_length=500, description="Daily notes")


class AttendanceRecordCreate(AttendanceRecordBase):
    """Model for creating attendance record"""
    pass


class AttendanceRecordUpdate(BaseModel):
    """Model for updating attendance record"""
    is_present: Optional[bool] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    half_day: Optional[bool] = None
    overtime_hours: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class AttendanceRecordInDB(AttendanceRecordBase):
    """Attendance record as stored in database"""
    id: str = Field(alias="_id")
    marked_by: str = Field(..., description="User ID who marked attendance")
    daily_salary: float = Field(..., description="Salary rate on that day")
    calculated_salary: float = Field(..., description="Calculated salary for the day")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, date: lambda v: v.isoformat()}


class AttendanceRecordResponse(BaseModel):
    """Response model for attendance record with priest info"""
    id: str
    priest_id: str
    priest_name: str
    attendance_date: date
    is_present: bool
    check_in_time: Optional[str]
    check_out_time: Optional[str]
    half_day: bool
    overtime_hours: float
    daily_salary: float
    calculated_salary: float
    notes: Optional[str]
    marked_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {date: lambda v: v.isoformat()}


# ============= Bulk Attendance Models =============

class BulkAttendanceEntry(BaseModel):
    """Single entry in bulk attendance marking"""
    priest_id: str
    is_present: bool = True
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    half_day: bool = False
    overtime_hours: float = 0.0
    notes: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    """Model for marking attendance for multiple priests"""
    attendance_date: date
    attendances: List[BulkAttendanceEntry]


# ============= Report Models =============

class MonthlyAttendanceStats(BaseModel):
    """Monthly attendance statistics for a priest"""
    priest_id: str
    priest_name: str
    daily_salary: float
    total_days_present: int
    total_half_days: int
    total_full_days: int
    total_overtime_hours: float
    base_salary: float  # full_days * daily_salary + half_days * daily_salary/2
    overtime_pay: float  # if applicable
    total_salary: float
    attendance_percentage: float


class MonthlyReport(BaseModel):
    """Complete monthly report for all priests"""
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    total_working_days: int
    priests_stats: List[MonthlyAttendanceStats]
    total_salary_disbursed: float
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {date: lambda v: v.isoformat()}


class AttendanceFilter(BaseModel):
    """Model for filtering attendance records"""
    priest_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2000)
    is_present: Optional[bool] = None


# ============= Dashboard Models =============

class AttendanceDashboard(BaseModel):
    """Dashboard statistics for attendance"""
    today_present: int
    today_absent: int
    today_total: int
    current_month_total_salary: float
    active_priests_count: int
    inactive_priests_count: int
    current_month: int
    current_year: int


# ============= Response Models =============

class AttendanceResponse(BaseModel):
    """Generic response for attendance operations"""
    success: bool
    message: str
    data: Optional[dict] = None


class PaginatedPriestResponse(BaseModel):
    """Paginated response for priest list"""
    priests: List[PriestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedAttendanceResponse(BaseModel):
    """Paginated response for attendance records"""
    records: List[AttendanceRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
