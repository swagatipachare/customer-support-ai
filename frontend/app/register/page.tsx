"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
            await axios.post(`${API_URL}/register`, { name, email, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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
          <h1 className="font-display font-semibold text-xl">Create account</h1>
          <p className="text-sm text-[--text-muted] mt-1">Join TechMart Support</p>
        </div>

       {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg px-3 py-2 mb-4">
            ✓ Account created! Redirecting you to login...
          </div>
        )}
        <div className="space-y-3">
          <div className="glass rounded-xl flex items-center gap-2 px-3 py-2.5">
            <User size={16} className="text-[--text-muted]" />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[--text-muted]"
            />
          </div>
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
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-[--text-muted]"
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="gradient-btn w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-[--text-muted] mt-5">
          Already have an account?{" "}
          <Link href="/login" className="gradient-text font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}