import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "services"))

from intent_detector import detect_intent_and_sentiment
from tickets import create_ticket
import billing, technical, product, complaint, faq

AGENT_MAP = {
    "Billing": billing.handle,
    "Technical": technical.handle,
    "Product": product.handle,
    "Complaint": complaint.handle,
    "FAQ": faq.handle,
}

# Phrases that suggest the AI couldn't confidently answer
UNCERTAIN_PHRASES = ["escalate", "not able to find", "unable to find", "human agent"]

def route_query(user_message, session_id="anonymous", user_email=None):
    intent, sentiment = detect_intent_and_sentiment(user_message)
    agent_function = AGENT_MAP.get(intent, faq.handle)
    result = agent_function(user_message)

    ticket_id = None
    answer_lower = result["answer"].lower()
    needs_ticket = sentiment == "Negative" or any(p in answer_lower for p in UNCERTAIN_PHRASES)

    if needs_ticket:
        ticket_id = create_ticket(
            session_id=session_id,
            user_message=user_message,
            intent=intent,
            sentiment=sentiment,
            answer=result["answer"]
        )
        if user_email:
            from email_service import send_ticket_email
            send_ticket_email(user_email, ticket_id, user_message, result["answer"])

    return {
        "intent": intent,
        "sentiment": sentiment,
        "answer": result["answer"],
        "sources": result["sources"],
        "ticket_id": ticket_id
    }