from fastapi import APIRouter, HTTPException, Query, Body, status
from .. import crud
from ..schemas import StockItemCreate, StockItemUpdate, StockItemInDB
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/stock", response_model=StockItemInDB, status_code=status.HTTP_201_CREATED)
async def create_stock_item(stock_item: StockItemCreate):
    """
    Create a new stock item.
    """
    return await crud.create_stock_item(stock_item)

@router.get("/stock", response_model=List[StockItemInDB])
async def get_all_stock_items():
    """
    Retrieve all stock items.
    """
    return await crud.get_all_stock_items()

@router.put("/stock/{item_id}", response_model=StockItemInDB)
async def update_stock_item(item_id: str, stock_item: StockItemUpdate = Body(...)):
    """
    Update a stock item by its ID.
    """
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    updated_item = await crud.update_stock_item_by_id(item_id, stock_item)
    if updated_item is None:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return updated_item

@router.delete("/stock/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock_item(item_id: str):
    """
    Delete a stock item by its ID.
    """
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid ObjectId format")

    deleted = await crud.delete_stock_item_by_id(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return

@router.get("/stock/analytics")
async def get_stock_analytics(
    period: str = Query("monthly", enum=["monthly", "yearly"]),
    year: int = Query(datetime.now().year)
):
    """
    Get stock analytics data.
    Can be filtered by period (monthly or yearly) and year.
    """
    try:
        analytics_data = await crud.get_stock_analytics_data(period, year)
        return analytics_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock/analytics/category")
async def get_stock_category_analytics(year: int = Query(datetime.now().year)):
    """
    Get stock analytics data grouped by category for a specific year.
    """
    try:
        analytics_data = await crud.get_stock_analytics_by_category(year)
        return analytics_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

