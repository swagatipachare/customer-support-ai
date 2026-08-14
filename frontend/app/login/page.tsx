"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="glass relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="font-display font-semibold text-xl">Welcome back</h1>
          <p className="text-sm text-[--text-muted] mt-1">Log in to TechMart Support</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="glass rounded-xl flex items-center gap-2 px-3 py-2.5">
            <Mail size={16} className="text-[--text-muted]" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[--text-muted]"
            />
          </div>
          <div className="glass rounded-xl flex items-center gap-2 px-3 py-2.5">
            <Lock size={16} className="text-[--text-muted]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[--text-muted]"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="gradient-btn w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-[--text-muted] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="gradient-text font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}