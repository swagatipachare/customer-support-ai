import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from llm_client import call_llm

VALID_INTENTS = ["Billing", "Technical", "Product", "Complaint", "FAQ"]
VALID_SENTIMENTS = ["Positive", "Neutral", "Negative"]

def detect_intent_and_sentiment(user_message):
    prompt = f"""You are a classifier for a customer support system.
The customer may write in any language (English, Hindi, Marathi, Spanish, etc.) — classify based on meaning regardless of language.

Analyze the customer's message and respond in EXACTLY this format (two lines, nothing else):
Intent: <one of Billing, Technical, Product, Complaint, FAQ>
Sentiment: <one of Positive, Neutral, Negative>

Rules for Intent:
- Billing = payments, refunds, invoices, subscriptions
- Technical = login issues, errors, bugs, installation, device not working
- Product = product features, pricing, availability, comparisons
- Complaint = customer dissatisfaction, escalation requests
- FAQ = general questions, policies, company information

Rules for Sentiment:
- Negative = frustrated, angry, upset, disappointed tone
- Neutral = plain factual question, no strong emotion
- Positive = happy, satisfied, complimentary tone

Customer message: "{user_message}"
"""

    result = call_llm(prompt).strip()

    intent = "FAQ"
    sentiment = "Neutral"

    for line in result.split("\n"):
        line = line.strip()
        if line.lower().startswith("intent:"):
            value = line.split(":", 1)[1].strip()
            for valid in VALID_INTENTS:
                if valid.lower() in value.lower():
                    intent = valid
        if line.lower().startswith("sentiment:"):
            value = line.split(":", 1)[1].strip()
            for valid in VALID_SENTIMENTS:
                if valid.lower() in value.lower():
                    sentiment = valid

    # Override: if the customer sounds angry/frustrated, always route to Complaint
    # so they get an empathetic response, regardless of the topic detected.
    if sentiment == "Negative" and intent != "Complaint":
        intent = "Complaint"

    return intent, sentiment


# Keep old function name working for backward compatibility
def detect_intent(user_message):
    intent, _ = detect_intent_and_sentiment(user_message)
    return intent


if __name__ == "__main__":
    test_messages = [
        "I paid yesterday but my subscription is still locked.",
        "This is the third time my order has been delayed, I'm furious!",
        "What is the refund window for damaged items?",
    ]
    for msg in test_messages:
        intent, sentiment = detect_intent_and_sentiment(msg)
        print(f"Message: {msg}\n→ Intent: {intent} | Sentiment: {sentiment}\n")