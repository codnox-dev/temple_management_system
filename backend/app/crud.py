from .database import (
    available_rituals_collection,
    bookings_collection,
    events_collection,
    admins_collection,
    gallery_collection,
    stock_items_collection,
)
from .schemas import (
    BookingCreate,
    AvailableRitualCreate,
    EventCreate,
    AdminCreate,
    GalleryImageCreate,
    StockItemCreate,
    StockItemUpdate,
)
from bson import ObjectId
from typing import Dict, Any, List
from datetime import datetime, date

# --- Helper function for date conversion ---
def convert_dates_for_mongo(data_dict: dict):
    """Converts date objects to datetime objects for MongoDB storage."""
    for key, value in data_dict.items():
        if isinstance(value, date) and not isinstance(value, datetime):
            data_dict[key] = datetime.combine(value, datetime.min.time())
        # Handle date strings from frontend
        elif isinstance(value, str):
            try:
                # Attempt to parse date string (e.g., "YYYY-MM-DD")
                parsed_date = datetime.fromisoformat(value.split('T')[0])
                data_dict[key] = parsed_date
            except ValueError:
                # Ignore if it's not a valid date string
                pass
    return data_dict

# --- CRUD for Stock Items ---

async def create_stock_item(stock_data: StockItemCreate):
    stock_item = stock_data.model_dump()
    stock_item = convert_dates_for_mongo(stock_item)
    result = await stock_items_collection.insert_one(stock_item)
    new_stock_item = await stock_items_collection.find_one({"_id": result.inserted_id})
    return new_stock_item

async def get_all_stock_items():
    cursor = stock_items_collection.find({}).sort("addedOn", -1)
    return [item async for item in cursor]

async def update_stock_item_by_id(id: str, stock_data: StockItemUpdate):
    update_data = stock_data.model_dump(exclude_unset=True)
    if not update_data:
        # If no data is sent, just return the existing item.
        return await stock_items_collection.find_one({"_id": ObjectId(id)})

    # Convert dates before updating
    update_data = convert_dates_for_mongo(update_data)

    result = await stock_items_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        return None
    return await stock_items_collection.find_one({"_id": ObjectId(id)})

async def delete_stock_item_by_id(id: str) -> bool:
    result = await stock_items_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1


async def get_stock_analytics_data(period: str, year: int) -> List[Dict[str, Any]]:
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)
    
    match_stage = {"$match": {"addedOn": {"$gte": start_date, "$lt": end_date}}}
    
    pipeline = [match_stage]
    
    if period == "monthly":
        pipeline.extend([
            {"$group": {
                "_id": {"$month": "$addedOn"},
                "totalItems": {"$sum": "$quantity"},
                "totalValue": {"$sum": {"$multiply": ["$quantity", "$price"]}},
                "lowStockItems": {"$sum": {"$cond": [{"$lte": ["$quantity", "$minimumStock"]}, 1, 0]}},
                "newItemsAdded": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ])
    elif period == "yearly":
        pipeline.extend([
            {"$group": {
                "_id": {"$year": "$addedOn"},
                "totalItems": {"$sum": "$quantity"},
                "totalValue": {"$sum": {"$multiply": ["$quantity", "$price"]}},
                "lowStockItems": {"$sum": {"$cond": [{"$lte": ["$quantity", "$minimumStock"]}, 1, 0]}},
                "newItemsAdded": {"$sum": 1}
            }},
            {"$sort": {"_id": -1}}
        ])

    cursor = stock_items_collection.aggregate(pipeline)
    results = []
    async for doc in cursor:
        if period == "monthly":
            # Create a full date for strftime, otherwise it might fail on some systems
            month_name = datetime(year, doc["_id"], 1).strftime("%B")
            results.append({
                "month": month_name,
                "year": year,
                "totalItems": doc.get("totalItems", 0),
                "totalValue": doc.get("totalValue", 0),
                "lowStockItems": doc.get("lowStockItems", 0),
                "newItemsAdded": doc.get("newItemsAdded", 0),
            })
        else:
             results.append({
                "year": doc["_id"],
                "totalItems": doc.get("totalItems", 0),
                "totalValue": doc.get("totalValue", 0),
                "lowStockItems": doc.get("lowStockItems", 0),
                "newItemsAdded": doc.get("newItemsAdded", 0),
            })
    return results

async def get_stock_analytics_by_category(year: int) -> List[Dict[str, Any]]:
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)
    
    pipeline = [
        {"$match": {"addedOn": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "totalItems": {"$sum": "$quantity"},
            "totalValue": {"$sum": {"$multiply": ["$quantity", "$price"]}}
        }},
        {"$project": {
            "category": "$_id",
            "totalItems": 1,
            "totalValue": 1,
            "_id": 0
        }},
        {"$sort": {"totalValue": -1}}
    ]
    
    cursor = stock_items_collection.aggregate(pipeline)
    results = [doc async for doc in cursor]
    
    total_value_all_categories = sum(item['totalValue'] for item in results)
    if total_value_all_categories > 0:
        for item in results:
            item['percentage'] = round((item['totalValue'] / total_value_all_categories) * 100, 2)
    else:
         for item in results:
            item['percentage'] = 0

    return results

# --- CRUD for Available Rituals ---

async def get_all_available_rituals():
    cursor = available_rituals_collection.find({})
    return [ritual async for ritual in cursor]

async def create_ritual(ritual_data: AvailableRitualCreate):
    ritual = ritual_data.model_dump()
    result = await available_rituals_collection.insert_one(ritual)
    new_ritual = await available_rituals_collection.find_one({"_id": result.inserted_id})
    return new_ritual

async def update_ritual_by_id(id: str, ritual_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await available_rituals_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": ritual_data}
    )
    if result.matched_count == 0:
        return None
    return await available_rituals_collection.find_one({"_id": ObjectId(id)})

async def delete_ritual_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await available_rituals_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1

# --- CRUD for Events ---

async def get_all_events():
    cursor = events_collection.find({})
    return [event async for event in cursor]

async def get_event_by_id(id: str):
    if not ObjectId.is_valid(id):
        return None
    return await events_collection.find_one({"_id": ObjectId(id)})

async def create_event(event_data: EventCreate):
    event = event_data.model_dump()
    result = await events_collection.insert_one(event)
    return await events_collection.find_one({"_id": result.inserted_id})

async def update_event_by_id(id: str, event_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await events_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": event_data}
    )
    if result.matched_count == 0:
        return None
    return await events_collection.find_one({"_id": ObjectId(id)})

async def delete_event_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await events_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1

# --- CRUD for Gallery Images ---

async def get_all_gallery_images():
    cursor = gallery_collection.find({})
    return [image async for image in cursor]

async def create_gallery_image(image_data: GalleryImageCreate):
    image = image_data.model_dump()
    result = await gallery_collection.insert_one(image)
    new_image = await gallery_collection.find_one({"_id": result.inserted_id})
    return new_image

async def update_gallery_image_by_id(id: str, image_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await gallery_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": image_data}
    )
    if result.matched_count == 0:
        return None
    return await gallery_collection.find_one({"_id": ObjectId(id)})

async def delete_gallery_image_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await gallery_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1

# --- CRUD for Bookings & Admins ---
async def create_booking(booking: BookingCreate):
    booking_data = booking.model_dump()
    result = await bookings_collection.insert_one(booking_data)
    new_booking = await bookings_collection.find_one({"_id": result.inserted_id})
    return new_booking

async def get_all_bookings():
    cursor = bookings_collection.find({})
    return [booking async for booking in cursor]

async def create_admin(admin_data: AdminCreate):
    admin = admin_data.model_dump()
    await admins_collection.insert_one(admin)

async def get_admin_by_username(username: str):
    return await admins_collection.find_one({"username": username})
