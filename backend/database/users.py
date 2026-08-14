import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi
from datetime import datetime, timezone

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["techmart_support"]
users = db["users"]

users.create_index("email", unique=True)


def create_user(name, email, hashed_password):
    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc),
    }
    result = users.insert_one(user)
    return str(result.inserted_id)


def get_user_by_email(email):
    return users.find_one({"email": email})