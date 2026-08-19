from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError
import sys, os, shutil

# Make sub-folders importable â€” ALL of these must come first
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "agents"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "database"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "rag"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings"))

_vectorstore_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorstore", "faiss_index.bin")
if not os.path.exists(_vectorstore_path):
    print("Vector store not found â€” building it now (this may take a minute)...")
    from embed_documents import build_vectorstore
    build_vectorstore()
    print("Vector store built successfully.")

# Now these custom imports will all work correctly
from router import route_query
from mongo import save_message, get_conversation_history, get_analytics
from llm_client import summarize_conversation
from users import create_user, get_user_by_email
from auth_utils import hash_password, verify_password, create_access_token
from dependencies import get_current_user
from feedback import save_feedback, get_satisfaction_stats
from embed_documents import build_vectorstore
from tickets import create_ticket, get_all_tickets, resolve_ticket

app = FastAPI()

# Build the vector store on startup if it doesn't exist yet (needed for cloud deployments)
@app.on_event("startup")
def build_vectorstore_if_missing():
    vectorstore_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorstore", "faiss_index.bin")
    if not os.path.exists(vectorstore_path):
        print("Vector store not found â€” building it now...")
        build_vectorstore()
        print("Vector store built successfully.")
    else:
        print("Vector store already exists, skipping build.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://customer-support-ai-teal-nu.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request models ----------

class ChatRequest(BaseModel):
    session_id: str
    message: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str

class FeedbackRequest(BaseModel):
    session_id: str
    user_message: str
    answer: str
    intent: str
    rating: str  # "up" or "down"

class ResolveTicketRequest(BaseModel):
    human_response: str
# ---------- Health check ----------

@app.get("/health")
def health_check():
    return {"status": "backend is running"}


# ---------- Chat endpoints ----------

@app.post("/chat")
def chat(request: ChatRequest, authorization: str = Header(None)):
    user_email = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        from auth_utils import decode_access_token
        payload = decode_access_token(token)
        if payload:
            user_email = payload.get("sub")

    result = route_query(request.message, session_id=request.session_id, user_email=user_email)
    save_message(
        session_id=request.session_id,
        user_message=request.message,
        intent=result["intent"],
        answer=result["answer"],
        sources=result["sources"]
    )
    return result

@app.get("/history/{session_id}")
def history(session_id: str):
    return get_conversation_history(session_id)


@app.get("/summary/{session_id}")
def summary(session_id: str):
    history = get_conversation_history(session_id)
    if not history:
        return {"summary": "No conversation history found for this session."}
    result = summarize_conversation(history)
    return {"summary": result, "message_count": len(history)}


# ---------- Auth endpoints ----------

@app.post("/register")
def register(request: RegisterRequest):
    existing = get_user_by_email(request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(request.password)
    try:
        create_user(request.name, request.email, hashed)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

    token = create_access_token({"sub": request.email, "name": request.name})
    return {"access_token": token, "token_type": "bearer", "name": request.name}


@app.post("/login")
def login(request: LoginRequest):
    user = get_user_by_email(request.email)
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["email"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer", "name": user["name"]}


@app.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    save_feedback(
        session_id=request.session_id,
        user_message=request.user_message,
        answer=request.answer,
        intent=request.intent,
        rating=request.rating
    )
    return {"status": "saved"}


@app.get("/feedback/stats")
def feedback_stats():
    return get_satisfaction_stats()

KB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "knowledge_base")


@app.get("/admin/documents")
def list_documents(current_user: dict = Depends(get_current_user)):
    files = [f for f in os.listdir(KB_DIR) if f.endswith(".pdf")]
    result = []
    for f in files:
        path = os.path.join(KB_DIR, f)
        result.append({
            "name": f,
            "size_kb": round(os.path.getsize(path) / 1024, 1)
        })
    return {"documents": result}


@app.post("/admin/documents/upload")
def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    dest_path = os.path.join(KB_DIR, file.filename)
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Re-build the vector store with the new document included
    build_vectorstore()

    return {"status": "uploaded", "filename": file.filename}


@app.delete("/admin/documents/{filename}")
def delete_document(filename: str, current_user: dict = Depends(get_current_user)):
    path = os.path.join(KB_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(path)
    build_vectorstore()

    return {"status": "deleted", "filename": filename}

@app.get("/admin/tickets")
def list_tickets(status: str = None, current_user: dict = Depends(get_current_user)):
    return {"tickets": get_all_tickets(status)}


@app.post("/admin/tickets/{ticket_id}/resolve")
def resolve_ticket_endpoint(ticket_id: str, request: ResolveTicketRequest, current_user: dict = Depends(get_current_user)):
    updated = resolve_ticket(ticket_id, request.human_response)
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
    updated["_id"] = str(updated["_id"])
    return updated

@app.get("/admin/analytics")
def analytics(current_user: dict = Depends(get_current_user)):
    conv_stats = get_analytics()
    feedback_stats = get_satisfaction_stats()
    return {
        "total_conversations": conv_stats["total_conversations"],
        "total_messages": conv_stats["total_messages"],
        "agent_usage": conv_stats["agent_usage"],
        "satisfaction_rate": feedback_stats.get("satisfaction_rate"),
        "total_feedback": feedback_stats.get("total", 0)
    }
