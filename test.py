from pymongo import MongoClient

# Replace this with your MongoDB URI
MONGO_URI = "mongodb+srv://codnoxdev_db_user:LRbvzDD2AbLodP0G@cluster0.je8cht0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Replace this with your database name
DB_NAME = "temple_db"

# Connect to MongoDB
client = MongoClient(MONGO_URI)

# Select the database
db = client[DB_NAME]

# List all collections
collections = db.list_collection_names()

# Drop all collections
for collection_name in collections:
    db.drop_collection(collection_name)
    print(f"Dropped collection: {collection_name}")

print("All collections in the database have been dropped.")
