# TechMart Support — Multi-Agent AI Customer Support Assistant

An AI-powered customer support platform for a fictional electronics retailer, **TechMart Electronics**, built using Retrieval-Augmented Generation (RAG) and a multi-agent architecture. Customer questions are automatically classified, routed to the right specialist AI agent, and answered using the company's real knowledge base documents.

## Live Demo

- **App (frontend):** https://customer-support-ai-teal-nu.vercel.app
- **API (backend):** https://techmart-support-backend-l6gu.onrender.com
- **API docs:** https://techmart-support-backend-l6gu.onrender.com/docs

> Note: the backend runs on Render's free tier and may take up to a minute to "wake up" if it's been idle. The first request after inactivity can be slow — subsequent requests are fast.

---

## Features

### Core
- **User Authentication** — Register, Login, JWT-based session management
- **Chat Interface** — Real-time chat window with conversation history and typing indicator
- **Intent Detection Agent** — Classifies each message into Billing, Technical, Product, Complaint, or FAQ
- **Agent Router** — Routes each query to the correct specialized agent
- **5 Specialized Agents** — Billing, Technical Support, Product, Complaint, FAQ
- **Knowledge Base (RAG)** — 6 company PDFs (FAQ, Refund Policy, Shipping Policy, Warranty, Pricing, User Manual) chunked, embedded, and retrieved via FAISS
- **Conversation Memory** — Full chat history stored in MongoDB
- **Analytics Dashboard** — Total conversations, messages, satisfaction rate, and agent usage breakdown

### Bonus Enhancements
- **Sentiment Analysis** — Detects frustrated customers and auto-routes them to the Complaint Agent
- **Automatic Ticket Creation** — Generates a ticket ID for escalated or low-confidence responses
- **AI-Generated Conversation Summaries** — One-click summary of any chat session
- **Customer Satisfaction Feedback** — Thumbs up/down on every AI response, tracked for analytics
- **Multilingual Conversations** — Responds in whatever language the customer writes in
- **Admin Dashboard** — Upload/delete knowledge base PDFs; vector store re-indexes automatically
- **Human-Agent Handoff** — Ticket queue where a human agent can view and reply to escalated conversations
- **Voice Support** — Browser-based speech-to-text input and text-to-speech replies
- **Email & WhatsApp Integration** — SendGrid email notification on ticket creation, plus a WhatsApp click-to-chat handoff button

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React), TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| LLM | Llama-family models via Groq API |
| Embeddings | FastEmbed (BAAI/bge-small-en-v1.5) |
| Vector Database | FAISS |
| Database | MongoDB Atlas |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Email | SendGrid |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## Project Structure

```
customer-support-ai/
├── backend/
│   ├── agents/          # Intent detection, router, and 5 specialized agents
│   ├── auth/             # JWT auth utilities and route protection
│   ├── database/         # MongoDB connections (conversations, users, tickets, feedback)
│   ├── embeddings/        # Embedding generation for RAG
│   ├── rag/              # PDF chunking and retrieval logic
│   ├── services/          # Email (SendGrid) integration
│   ├── vectorstore/       # Auto-generated FAISS index (not committed)
│   └── main.py           # FastAPI entry point
│
├── frontend/
│   └── app/
│       ├── page.tsx           # Main chat interface
│       ├── login/, register/  # Auth pages
│       └── admin/             # Knowledge base admin, ticket queue, analytics
│
├── knowledge_base/        # Company PDF documents used for RAG
├── datasets/              # Public reference datasets (not committed — see below)
└── README.md
```

---

## Setup Instructions (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- A free [Groq](https://console.groq.com) API key
- A free [MongoDB Atlas](https://cloud.mongodb.com) cluster
- A free [SendGrid](https://signup.sendgrid.com) account (for email notifications)

### 1. Clone the repository
```bash
git clone https://github.com/swagatipachare/customer-support-ai.git
cd customer-support-ai
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r backend/requirements.txt
```

Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_string
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_sender_email
```

Build the initial vector store:
```bash
python backend/embeddings/embed_documents.py
```

Run the backend:
```bash
uvicorn backend.main:app --reload
```
Backend runs at `http://127.0.0.1:8000` — interactive API docs at `/docs`.

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 4. Use the app
1. Register a new account at `/register`
2. Log in
3. Start chatting — try: *"What is your refund policy?"*
4. Visit `/admin` (logged in) for the Knowledge Base Admin, Ticket Queue, and Analytics dashboards

---

## Deployment

This project is deployed with a fully cloud-hosted architecture:

| Component | Platform | Live URL |
|---|---|---|
| Frontend | Vercel | https://customer-support-ai-teal-nu.vercel.app |
| Backend | Render | https://techmart-support-backend-l6gu.onrender.com |
| Database | MongoDB Atlas | (cloud-hosted, not publicly browsable) |

To redeploy your own instance: connect this repository to Vercel (root directory `frontend`, environment variable `NEXT_PUBLIC_API_URL` pointing to your backend) and to Render (root directory `backend`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`, with the same environment variables as the local `.env` file above). Add your Vercel URL to the `allow_origins` list in `backend/main.py`.

---

## Note on `datasets/`

The `datasets/` folder (Banking77, SQuAD, CFPB, DailyDialog, MS MARCO) contains large public reference datasets used during development for intent-classification research. They are **not required** to run the app and are excluded from version control due to file size — the app's actual knowledge base is the PDFs in `knowledge_base/`.

---

## Deliverables

- Source code (this repository)
- Knowledge base documents (`knowledge_base/`)
- Project report
- Demo video
- Live deployment links (above)

---

## License

Built as an academic capstone project. Not for commercial use.