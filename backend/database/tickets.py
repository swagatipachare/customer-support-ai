import os
import random
import string
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timezone

load_dotenv()

import certifi
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["techmart_support"]
tickets = db["tickets"]


def generate_ticket_id():
    """e.g. TM-8F3K2A"""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TM-{suffix}"


def create_ticket(session_id, user_message, intent, sentiment, answer):
    ticket_id = generate_ticket_id()
    tickets.insert_one({
        "ticket_id": ticket_id,
        "session_id": session_id,
        "user_message": user_message,
        "intent": intent,
        "sentiment": sentiment,
        "ai_answer": answer,
        "status": "open",
        "created_at": datetime.now(timezone.utc)
    })
    return ticket_id


def get_ticket(ticket_id):
    return tickets.find_one({"ticket_id": ticket_id})

def get_all_tickets(status=None):
    query = {"status": status} if status else {}
    results = list(tickets.find(query).sort("created_at", -1))
    for t in results:
        t["_id"] = str(t["_id"])
    return results


def resolve_ticket(ticket_id, human_response):
    tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "status": "resolved",
            "human_response": human_response,
            "resolved_at": datetime.now(timezone.utc)
        }}
    )
    return get_ticket(ticket_id)