import os
from dotenv import load_dotenv
from groq import Groq

# Load .env from project root
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def call_llm(prompt, model="llama-3.1-8b-instant"):
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content


def summarize_conversation(history):
    """history = list of {user_message, answer, intent} dicts from MongoDB"""
    conversation_text = "\n".join(
        [f"Customer: {h['user_message']}\nAgent ({h['intent']}): {h['answer']}" for h in history]
    )

    prompt = f"""Summarize this customer support conversation in 2-3 short sentences.
Mention the main issue(s) raised and whether they were resolved.

Conversation:
{conversation_text}

Summary:"""

    return call_llm(prompt).strip()