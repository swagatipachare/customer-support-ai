import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timezone

load_dotenv()

import certifi
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["techmart_support"]
conversations = db["conversations"]


def save_message(session_id, user_message, intent, answer, sources):
    conversations.insert_one({
        "session_id": session_id,
        "user_message": user_message,
        "intent": intent,
        "answer": answer,
        "sources": sources,
        "timestamp": datetime.now(timezone.utc)
    })


def get_conversation_history(session_id):
    return list(conversations.find({"session_id": session_id}).sort("timestamp", 1))


if __name__ == "__main__":
    # Quick test
    save_message(
        session_id="test-session-1",
        user_message="How long does shipping take?",
        intent="FAQ",
        answer="Metro cities take 2-4 business days.",
        sources=["ShippingPolicy.pdf"]
    )
    print("✅ Test message saved!")

    history = get_conversation_history("test-session-1")
    print(f"\nRetrieved {len(history)} message(s):")
    for msg in history:
        print(msg)

def get_analytics():
    all_conversations = list(conversations.find())
    total_conversations = len(set(c["session_id"] for c in all_conversations))
    total_messages = len(all_conversations)

    agent_usage = {}
    for c in all_conversations:
        intent = c.get("intent", "Unknown")
        agent_usage[intent] = agent_usage.get(intent, 0) + 1

    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "agent_usage": agent_usage
    }