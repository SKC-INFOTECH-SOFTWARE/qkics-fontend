import { useEffect, useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FiDownload, FiX, FiCalendar, FiShield, FiFileText } from "react-icons/fi";
import useModalEscape from "../hooks/useModalEscape";

export default function DocumentDetailsModal({ uuid, onClose }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useModalEscape(onClose);

  const fetchDetails = async () => {
    try {
      const res = await axiosSecure.get(`/v1/documents/${uuid}/`);
      setDoc(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError("");
    try {
      const res = await axiosSecure.get(
        `/v1/documents/${uuid}/download/`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title}.pdf`;
      link.click();
    } catch (err) {
      setError(err.response?.data?.message || "Download failed. You might not have access.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isPremium = doc?.access_type === "PREMIUM";

  if (!doc) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-card border border-border p-6 animate-pulse">
        <div className="h-9 w-9 rounded-xl bg-muted mb-4" />
        <div className="w-3/4 h-5 rounded bg-muted mb-3" />
        <div className="w-full h-3 rounded bg-muted/70 mb-2" />
        <div className="w-5/6 h-3 rounded bg-muted/70" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-card text-foreground border border-border">
        {/* Header */}
        <div className="relative flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
            <FiFileText className="text-lg" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-tight truncate pr-2">{doc.title}</h3>
            <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Document Insight</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto max-h-[55vh] custom-scrollbar">
          {doc.description && (
            <p className="text-sm leading-relaxed mb-5 break-words text-muted-foreground">
              {doc.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className="p-1.5 rounded-lg bg-primary-soft text-primary shrink-0">
                <FiCalendar />
              </span>
              <div className="min-w-0">
                <p className="text-3xs text-muted-foreground uppercase font-black tracking-wider">Published</p>
                <p className="text-xs font-bold truncate">{new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className={`p-1.5 rounded-lg shrink-0 ${isPremium ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                <FiShield />
              </span>
              <div className="min-w-0">
                <p className="text-3xs text-muted-foreground uppercase font-black tracking-wider">Access</p>
                <p className={`text-xs font-bold ${isPremium ? "text-amber-500" : "text-emerald-500"}`}>{doc.access_type}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg border border-danger/20 bg-danger/10 text-danger text-sm flex items-center gap-2 animate-shake">
              <FiX className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 font-bold text-sm rounded-xl border border-border text-foreground hover:bg-muted transition-all"
          >
            Dismiss
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-[2] px-4 py-2.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none"
          >
            {isDownloading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <FiDownload className="text-base" />
            )}
            {isDownloading ? "Preparing..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
