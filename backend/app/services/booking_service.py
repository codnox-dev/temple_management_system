from fastapi import HTTPException, status
from bson import ObjectId
from ..database import bookings_collection, available_rituals_collection, stock_collection
from ..models import BookingCreate

async def create_booking(booking: BookingCreate):
    """
    Creates a new booking, but first checks for stock availability for all rituals in the booking.
    If stock is sufficient, it creates the booking and then deducts the required stock quantities.
    Raises HTTPException if stock is insufficient or a required stock item is not found.
    """
    # 1. Pre-check stock availability before creating the booking document
    for instance in booking.instances:
        if not ObjectId.is_valid(instance.ritualId):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Ritual ID: {instance.ritualId}")
        
        ritual = await available_rituals_collection.find_one({"_id": ObjectId(instance.ritualId)})
        
        if not ritual:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ritual with ID {instance.ritualId} not found.")

        if ritual.get("required_stock"):
            for req_stock in ritual["required_stock"]:
                stock_item_id = req_stock["stock_item_id"]
                if not ObjectId.is_valid(stock_item_id):
                     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Stock ID: {stock_item_id} for Ritual {ritual['name']}")

                stock_item = await stock_collection.find_one({"_id": ObjectId(stock_item_id)})
                
                if not stock_item:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Stock item required for ritual '{ritual['name']}' not found."
                    )
                
                required_quantity = req_stock["quantity_required"] * instance.quantity
                if stock_item["quantity"] < required_quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for '{stock_item['name']}' to perform '{ritual['name']}'. Required: {required_quantity}, Available: {stock_item['quantity']}."
                    )

    # 2. If all stock checks pass, create the booking
    booking_data = booking.model_dump()
    result = await bookings_collection.insert_one(booking_data)
    new_booking = await bookings_collection.find_one({"_id": result.inserted_id})

    # 3. After successful booking, deduct the stock
    for instance in booking.instances:
        ritual = await available_rituals_collection.find_one({"_id": ObjectId(instance.ritualId)})
        if ritual and ritual.get("required_stock"):
            for req_stock in ritual["required_stock"]:
                quantity_to_deduct = req_stock["quantity_required"] * instance.quantity
                await stock_collection.update_one(
                    {"_id": ObjectId(req_stock["stock_item_id"])},
                    {"$inc": {"quantity": -quantity_to_deduct}}
                )

    return new_booking

async def get_all_bookings():
    cursor = bookings_collection.find({})
    return [booking async for booking in cursor]
