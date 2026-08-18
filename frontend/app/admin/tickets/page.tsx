"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type TicketType = {
  ticket_id: string;
  session_id: string;
  user_message: string;
  intent: string;
  sentiment: string;
  ai_answer: string;
  status: string;
  created_at: string;
  human_response?: string;
};

export default function TicketQueue() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const router = useRouter();

  const getToken = () => localStorage.getItem("token");

  const fetchTickets = async (status: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/tickets?status=${status}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTickets(res.data.tickets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTickets(filter);
  }, [filter, router]);

  const handleResolve = async (ticketId: string) => {
    const reply = replyDrafts[ticketId];
    if (!reply || !reply.trim()) return;

    setSubmitting(ticketId);
    try {
      await axios.post(
        `${API_URL}/admin/tickets/${ticketId}/resolve`,
        { human_response: reply },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchTickets(filter);
    } catch {
      // silent
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-3xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="glass rounded-full p-2.5 hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} className="text-[--text-muted]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight">
                Ticket <span className="gradient-text">Queue</span>
              </h1>
              <p className="font-mono text-[11px] text-[--text-muted]">human agent handoff</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 pb-8">
        <div className="glass rounded-full p-1 flex gap-1 mb-6 w-fit">
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-colors ${
              filter === "open" ? "gradient-btn text-white" : "text-[--text-muted] hover:text-white"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-colors ${
              filter === "resolved" ? "gradient-btn text-white" : "text-[--text-muted] hover:text-white"
            }`}
          >
            Resolved
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={22} className="text-[--text-muted] animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-sm text-[--text-muted]">
            No {filter} tickets right now.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.ticket_id} className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {t.status === "open" ? (
                      <AlertCircle size={14} className="text-rose-400" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    )}
                    <span className="font-mono text-xs text-[--text-muted]">{t.ticket_id}</span>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: t.sentiment === "Negative" ? "rgba(251,113,133,0.15)" : "rgba(255,255,255,0.06)",
                        color: t.sentiment === "Negative" ? "#fb7185" : "var(--text-muted)",
                      }}
                    >
                      {t.sentiment}
                    </span>
                    <span className="font-mono text-[10px] text-[--text-muted]">{t.intent}</span>
                  </div>
                  <span className="text-[10px] text-[--text-muted]">
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-[--text-muted] mb-1">Customer:</p>
                  <p className="text-sm bg-white/5 rounded-xl p-3 border border-[--border]">{t.user_message}</p>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-[--text-muted] mb-1">AI's response:</p>
                  <p className="text-sm text-[--text-muted] italic">{t.ai_answer}</p>
                </div>

                {t.status === "resolved" ? (
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">Your response:</p>
                    <p className="text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                      {t.human_response}
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a human response..."
                      value={replyDrafts[t.ticket_id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [t.ticket_id]: e.target.value }))
                      }
                      className="flex-1 glass rounded-xl px-3 py-2 text-sm outline-none placeholder:text-[--text-muted]"
                    />
                    <button
                      onClick={() => handleResolve(t.ticket_id)}
                      disabled={submitting === t.ticket_id}
                      className="gradient-btn rounded-xl px-4 py-2 flex items-center justify-center disabled:opacity-50"
                    >
                      {submitting === t.ticket_id ? (
                        <Loader2 size={14} className="text-white animate-spin" />
                      ) : (
                        <Send size={14} className="text-white" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}