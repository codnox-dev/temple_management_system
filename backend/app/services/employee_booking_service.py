from ..database import employee_bookings_collection, available_rituals_collection, stock_collection
from ..models.employee_booking_models import EmployeeBookingCreate
from fastapi import HTTPException, status
from bson import ObjectId

async def create_employee_booking(booking: EmployeeBookingCreate):
    """
    Creates a booking initiated by an employee, checks for stock, and deducts it.
    This now uses the dedicated 'employee_bookings_collection'.
    """
    total_required_stock = {}
    
    # 1. Aggregate all required stock for the entire booking
    for instance in booking.instances:
        ritual = await available_rituals_collection.find_one({"_id": ObjectId(instance.ritualId)})
        if not ritual or not ritual.get("required_stock"):
            continue
        
        for stock_req in ritual["required_stock"]:
            item_id = stock_req["stock_item_id"]
            quantity_needed = stock_req["quantity_required"] * instance.quantity
            total_required_stock[item_id] = total_required_stock.get(item_id, 0) + quantity_needed

    # 2. Verify stock availability
    for item_id, required_qty in total_required_stock.items():
        stock_item = await stock_collection.find_one({"_id": ObjectId(item_id)})
        if not stock_item or stock_item["quantity"] < required_qty:
            item_name = stock_item["name"] if stock_item else f"ID {item_id}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {item_name}. Required: {required_qty}, Available: {stock_item.get('quantity', 0) if stock_item else 0}"
            )

    # 3. Deduct stock
    for item_id, required_qty in total_required_stock.items():
        await stock_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$inc": {"quantity": -required_qty}}
        )

    # 4. Create the booking in the correct collection
    booking_data = booking.model_dump()
    result = await employee_bookings_collection.insert_one(booking_data)
    new_booking = await employee_bookings_collection.find_one({"_id": result.inserted_id})
    return new_booking

async def get_all_employee_bookings():
    """Retrieves all employee bookings from the database."""
    cursor = employee_bookings_collection.find({})
    return [booking async for booking in cursor]

