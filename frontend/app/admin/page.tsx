"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, FileText, Upload, Trash2, ArrowLeft, Loader2, Inbox, BarChart3 } from "lucide-react";
import Link from "next/link";

type Doc = { name: string; size_kb: number };

export default function AdminDashboard() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const getToken = () => localStorage.getItem("token");

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/documents", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDocs(res.data.documents);
    } catch {
      setMessage({ type: "error", text: "Failed to load documents." });
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
    fetchDocs();
  }, [router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      setMessage({ type: "error", text: "Only PDF files are allowed." });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://127.0.0.1:8000/admin/documents/upload", formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage({ type: "success", text: `${file.name} uploaded and knowledge base re-indexed!` });
      fetchDocs();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Upload failed." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingName(filename);
    setMessage(null);
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/documents/${filename}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage({ type: "success", text: `${filename} deleted and knowledge base re-indexed.` });
      fetchDocs();
    } catch {
      setMessage({ type: "error", text: "Delete failed." });
    } finally {
      setDeletingName(null);
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
          <Link href="/" className="glass rounded-full p-2.5 hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} className="text-[--text-muted]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight">
                Knowledge Base <span className="gradient-text">Admin</span>
              </h1>
              <p className="font-mono text-[11px] text-[--text-muted]">manage RAG documents</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics"
            className="glass rounded-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <BarChart3 size={14} className="text-[--text-muted]" />
            <span className="text-xs font-mono text-[--text-muted]">Analytics</span>
          </Link>
          <Link
            href="/admin/tickets"
            className="glass rounded-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Inbox size={14} className="text-[--text-muted]" />
            <span className="text-xs font-mono text-[--text-muted]">Ticket Queue</span>
          </Link>
        </div>
      </header>
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 pb-8">
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload box */}
        <label
          className="glass rounded-3xl p-8 flex flex-col items-center justify-center gap-3 mb-6 cursor-pointer hover:bg-white/5 transition-colors border-dashed"
          style={{ borderWidth: 2, borderStyle: "dashed" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader2 size={28} className="text-[--text-muted] animate-spin" />
              <p className="text-sm text-[--text-muted]">Uploading and re-indexing...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Upload size={20} className="text-white" />
              </div>
              <p className="text-sm font-medium">Click to upload a new PDF</p>
              <p className="text-xs text-[--text-muted]">The vector store rebuilds automatically</p>
            </>
          )}
        </label>

        {/* Document list */}
        <div className="glass rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[--border] flex items-center justify-between">
            <span className="font-mono text-[11px] text-[--text-muted]">
              {docs.length} document{docs.length !== 1 ? "s" : ""} in knowledge base
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 size={20} className="text-[--text-muted] animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[--text-muted]">No documents yet.</div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.name}
                className="px-5 py-4 flex items-center justify-between border-b border-[--border] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                    <FileText size={15} className="text-[--text-muted]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-[--text-muted] font-mono">{doc.size_kb} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.name)}
                  disabled={deletingName === doc.name}
                  className="rounded-full p-2 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                >
                  {deletingName === doc.name ? (
                    <Loader2 size={15} className="text-rose-400 animate-spin" />
                  ) : (
                    <Trash2 size={15} className="text-[--text-muted] hover:text-rose-400" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}