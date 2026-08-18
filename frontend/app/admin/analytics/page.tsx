"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, ArrowLeft, Loader2, MessageSquare, ThumbsUp, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Analytics = {
  total_conversations: number;
  total_messages: number;
  agent_usage: Record<string, number>;
  satisfaction_rate: number | null;
  total_feedback: number;
};

const AGENT_COLORS: Record<string, string> = {
  Billing: "#ffb020",
  Technical: "#4fd1c5",
  Product: "#a78bfa",
  Complaint: "#fb7185",
  FAQ: "#60a5fa",
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    axios
      .get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const maxAgentCount = data ? Math.max(...Object.values(data.agent_usage), 1) : 1;

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
                Analytics <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="font-mono text-[11px] text-[--text-muted]">support performance overview</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="text-[--text-muted] animate-spin" />
          </div>
        ) : !data ? (
          <div className="glass rounded-3xl p-10 text-center text-sm text-[--text-muted]">
            Couldn't load analytics.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(96,165,250,0.15)" }}>
                  <Users size={16} className="text-sky-400" />
                </div>
                <p className="text-2xl font-display font-semibold">{data.total_conversations}</p>
                <p className="text-xs text-[--text-muted] mt-1">Total Conversations</p>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(167,139,250,0.15)" }}>
                  <MessageSquare size={16} className="text-violet-400" />
                </div>
                <p className="text-2xl font-display font-semibold">{data.total_messages}</p>
                <p className="text-xs text-[--text-muted] mt-1">Total Messages</p>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(74,222,128,0.15)" }}>
                  <ThumbsUp size={16} className="text-green-400" />
                </div>
                <p className="text-2xl font-display font-semibold">
                  {data.satisfaction_rate !== null ? `${data.satisfaction_rate}%` : "—"}
                </p>
                <p className="text-xs text-[--text-muted] mt-1">Satisfaction Rate</p>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(255,176,32,0.15)" }}>
                  <BarChart3 size={16} className="text-amber-400" />
                </div>
                <p className="text-2xl font-display font-semibold">{data.total_feedback}</p>
                <p className="text-xs text-[--text-muted] mt-1">Feedback Received</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h2 className="font-display font-semibold text-sm mb-5">Agent Usage Breakdown</h2>
              <div className="space-y-4">
                {Object.entries(data.agent_usage).length === 0 ? (
                  <p className="text-sm text-[--text-muted]">No conversations yet.</p>
                ) : (
                  Object.entries(data.agent_usage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([agent, count]) => (
                      <div key={agent}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-mono" style={{ color: AGENT_COLORS[agent] || "var(--text-muted)" }}>
                            {agent}
                          </span>
                          <span className="text-[--text-muted] font-mono">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(count / maxAgentCount) * 100}%`,
                              background: AGENT_COLORS[agent] || "#8b92a0",
                            }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}