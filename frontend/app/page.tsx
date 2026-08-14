"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  CreditCard,
  Wrench,
  Package,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  User,
  Ticket,
  LogOut,
  FileText,
  X,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Mic,
  MicOff,
  Volume2,
  MessageCircle,
} from "lucide-react";

type Message = {
  role: "user" | "bot";
  text: string;
  intent?: string;
  sources?: string[];
  ticketId?: string;
  userMessage?: string;
  feedbackGiven?: "up" | "down" | null;
};

const AGENT_STYLES: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  Billing: { color: "#ffb020", label: "Billing", icon: CreditCard },
  Technical: { color: "#4fd1c5", label: "Technical", icon: Wrench },
  Product: { color: "#a78bfa", label: "Product", icon: Package },
  Complaint: { color: "#fb7185", label: "Complaint", icon: AlertCircle },
  FAQ: { color: "#60a5fa", label: "FAQ", icon: HelpCircle },
};

const SUGGESTIONS = [
  "What is your refund policy?",
  "How long does shipping take?",
  "My device won't turn on",
  "Do you offer EMI options?",
];

const WHATSAPP_NUMBER = "918975265237";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const sessionId = useRef("session-" + Math.random().toString(36).slice(2, 9));
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (!token) {
      router.push("/login");
    } else {
      setUserName(name);
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    router.push("/login");
  };

  const handleFeedback = async (index: number, rating: "up" | "down") => {
    const msg = messages[index];
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, feedbackGiven: rating } : m))
    );
    try {
      await axios.post("http://127.0.0.1:8000/feedback", {
        session_id: sessionId.current,
        user_message: msg.userMessage || "",
        answer: msg.text,
        intent: msg.intent || "FAQ",
        rating: rating,
      });
    } catch {
      // fail silently — feedback is non-critical
    }
  };

  const handleSummarize = async () => {
    setShowSummary(true);
    setSummaryLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/summary/${sessionId.current}`);
      setSummary(res.data.summary);
    } catch {
      setSummary("Couldn't generate a summary right now. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    synth.speak(utterance);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/chat",
        { session_id: sessionId.current, message: text },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.answer,
          intent: res.data.intent,
          sources: res.data.sources,
          ticketId: res.data.ticket_id,
          userMessage: text,
          feedbackGiven: null,
        },
      ]);
      speak(res.data.answer);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Connection lost. Check that the backend server is running, then try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[--text-muted] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg leading-tight">
              TechMart <span className="gradient-text">Support</span>
            </h1>
            <p className="font-mono text-[11px] text-[--text-muted]">
              {userName ? `hi, ${userName}` : "multi-agent AI assistant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="font-mono text-[11px] text-[--text-muted]">5 agents online</span>
          </div>
          <button
            onClick={handleSummarize}
            disabled={messages.length === 0}
            className="glass rounded-full p-2.5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Summarize conversation"
          >
            <FileText size={14} className="text-[--text-muted]" />
          </button>
          <Link
            href="/admin"
            className="glass rounded-full p-2.5 hover:bg-white/10 transition-colors"
            title="Admin dashboard"
          >
            <Settings size={14} className="text-[--text-muted]" />
          </Link>
          <button
            onClick={handleLogout}
            className="glass rounded-full p-2.5 hover:bg-white/10 transition-colors"
            title="Log out"
          >
            <LogOut size={14} className="text-[--text-muted]" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 pb-6 min-h-0">
        <div
          ref={scrollRef}
          className="glass flex-1 overflow-y-auto chat-scroll rounded-3xl p-6 space-y-5 shadow-2xl shadow-black/40"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2">
                <Sparkles size={26} className="text-white" />
              </div>
              <p className="font-display text-2xl font-semibold">
                How can we help <span className="gradient-text">today?</span>
              </p>
              <p className="text-sm max-w-sm text-[--text-muted]">
                Ask about orders, refunds, shipping, warranty, or products — your
                question is routed to the right specialist automatically.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="glass font-mono text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20need%20help%20with%20my%20TechMart%20order`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
              >
                <MessageCircle size={13} />
                Prefer WhatsApp? Chat with us there
              </a>
            </div>
          )}

          {messages.map((msg, i) => {
            const agent = msg.intent ? AGENT_STYLES[msg.intent] : null;
            const AgentIcon = agent?.icon;
            return (
              <div key={i} className={`rise-in flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                  style={
                    msg.role === "user"
                      ? { background: "rgba(255,255,255,0.08)" }
                      : { background: agent ? `${agent.color}22` : "rgba(255,255,255,0.08)" }
                  }
                >
                  {msg.role === "user" ? (
                    <User size={15} className="text-[--text-muted]" />
                  ) : AgentIcon ? (
                    <AgentIcon size={15} style={{ color: agent!.color }} />
                  ) : (
                    <Sparkles size={15} className="text-[--text-muted]" />
                  )}
                </div>

                <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {agent && (
                    <span
                      className="font-mono text-[10px] tracking-wide mb-1 px-2 py-0.5 rounded-full"
                      style={{ color: agent.color, background: `${agent.color}18` }}
                    >
                      {agent.label} AGENT
                    </span>
                  )}
                  <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white", borderRadius: "16px 16px 4px 16px" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px" }
                    }
                  >
                    {msg.text}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.sources.map((s) => (
                        <span key={s} className="font-mono text-[10px] px-2 py-1 rounded-full glass text-[--text-muted]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.ticketId && (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="px-3 py-2 rounded-xl text-[11px] font-mono flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300">
                        <Ticket size={12} />
                        Ticket created: {msg.ticketId}
                      </div>
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hi, I need help with my TechMart support ticket ${msg.ticketId}. My question was: "${msg.userMessage}"`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl text-[11px] font-mono flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors w-fit"
                      >
                        <MessageCircle size={12} />
                        Continue on WhatsApp
                      </a>
                    </div>
                  )}

                  {msg.role === "bot" && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => handleFeedback(i, "up")}
                        disabled={!!msg.feedbackGiven}
                        className="rounded-full p-1.5 transition-colors disabled:cursor-default"
                        style={{
                          background: msg.feedbackGiven === "up" ? "rgba(74, 222, 128, 0.15)" : "transparent",
                        }}
                      >
                        <ThumbsUp
                          size={13}
                          className={msg.feedbackGiven === "up" ? "text-green-400" : "text-[--text-muted] hover:text-green-400"}
                        />
                      </button>
                      <button
                        onClick={() => handleFeedback(i, "down")}
                        disabled={!!msg.feedbackGiven}
                        className="rounded-full p-1.5 transition-colors disabled:cursor-default"
                        style={{
                          background: msg.feedbackGiven === "down" ? "rgba(251, 113, 133, 0.15)" : "transparent",
                        }}
                      >
                        <ThumbsDown
                          size={13}
                          className={msg.feedbackGiven === "down" ? "text-rose-400" : "text-[--text-muted] hover:text-rose-400"}
                        />
                      </button>
                      {msg.feedbackGiven && (
                        <span className="text-[10px] text-[--text-muted] font-mono">Thanks for the feedback!</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 rise-in">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/8">
                <Sparkles size={15} className="text-[--text-muted]" />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5 bg-white/5 border border-[--border]" style={{ borderRadius: "16px 16px 16px 4px" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 pulse-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass flex gap-2 mt-4 p-2 rounded-full items-center">
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-white/10"
            title={voiceEnabled ? "Voice replies on" : "Voice replies off"}
          >
            <Volume2 size={15} className={voiceEnabled ? "text-emerald-400" : "text-[--text-muted]"} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[--text-muted]"
          />
          <button
            onClick={toggleListening}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ background: isListening ? "rgba(251,113,133,0.15)" : "rgba(255,255,255,0.06)" }}
            title="Voice input"
          >
            {isListening ? (
              <MicOff size={16} className="text-rose-400" />
            ) : (
              <Mic size={16} className="text-[--text-muted]" />
            )}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="gradient-btn w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 disabled:opacity-50 shadow-lg shadow-indigo-500/30"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </main>

      {showSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowSummary(false)}
        >
          <div
            className="glass rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50 rise-in"
            style={{ background: "#14171cee" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[--text-muted]" />
                <h2 className="font-display font-semibold text-base">Conversation Summary</h2>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-[--text-muted]" />
              </button>
            </div>

            {summaryLoading ? (
              <div className="flex items-center gap-1.5 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40 pulse-dot"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-[--text]">{summary}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}