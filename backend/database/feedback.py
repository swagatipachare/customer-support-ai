import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi
from datetime import datetime, timezone

load_dotenv()

import certifi
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["techmart_support"]
feedback = db["feedback"]


def save_feedback(session_id, user_message, answer, intent, rating):
    """rating: 'up' or 'down'"""
    feedback.insert_one({
        "session_id": session_id,
        "user_message": user_message,
        "answer": answer,
        "intent": intent,
        "rating": rating,
        "created_at": datetime.now(timezone.utc)
    })


def get_satisfaction_stats():
    total = feedback.count_documents({})
    if total == 0:
        return {"total": 0, "satisfaction_rate": None}
    positive = feedback.count_documents({"rating": "up"})
    return {
        "total": total,
        "positive": positive,
        "negative": total - positive,
        "satisfaction_rate": round((positive / total) * 100, 1)
    }