import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "rag"))

from llm_client import call_llm
from retriever import retrieve_relevant_chunks

def answer_with_context(user_message, role_description, top_k=3):
    """Shared logic: retrieve context, then ask the LLM to answer using it."""
    chunks = retrieve_relevant_chunks(user_message, top_k=top_k)
    context_text = "\n\n".join([f"[From {c['source']}]: {c['text']}" for c in chunks])

    prompt = f"""{role_description}

Use ONLY the context below to answer the customer's question. If the context doesn't contain the answer, say you'll escalate this to a human agent — do not make up information.

IMPORTANT: Detect the language the customer is writing in (e.g. English, Hindi, Marathi, Spanish, etc.) and respond in that SAME language, even though the context documents below are in English. Translate the relevant information naturally — do not respond in English if the customer wrote in another language.

Context:
{context_text}

Customer question: {user_message}

Answer (in the customer's language):"""
    
    answer = call_llm(prompt)
    return {
        "answer": answer,
        "sources": list(set([c["source"] for c in chunks]))
    }