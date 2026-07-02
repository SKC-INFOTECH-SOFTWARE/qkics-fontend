import { useEffect, useState, useRef } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FaDownload, FaHistory } from "react-icons/fa";

export default function MyDownloads({ theme, searchQuery = "" }) {
  const [downloads, setDownloads] = useState([]);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDownloads(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchDownloads = async (query = "") => {
    try {
      const res = await axiosSecure.get(`/v1/documents/my-downloads/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setDownloads(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = async () => {
    if (!next) return;
    try {
      const res = await axiosSecure.get(next);
      const data = res.data;
      const newItems = Array.isArray(data) ? data : (data?.results || []);
      setDownloads((prev) => [...prev, ...newItems]);
      setNext(data?.next || null);
    } catch (err) {
      console.error("Failed to load more downloads", err);
    }
  };

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [next]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-foreground animate-fadeIn">
      <div className="flex items-center justify-between border-b border-border p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary">
            <FaHistory size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Download History</h2>
            <p className="text-2xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Asset Collective</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Total Assets</p>
          <p className="text-sm font-bold">{downloads.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-6 text-2xs font-black uppercase tracking-widest text-muted-foreground">Document Intelligence</th>
              <th className="p-6 text-2xs font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
              <th className="p-6 text-2xs font-black uppercase tracking-widest text-muted-foreground text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {downloads.length > 0 ? (
              downloads.map((d, i) => (
                <tr key={i} className="group transition-colors duration-300 hover:bg-muted/40">
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <FaDownload size={14} />
                      </div>
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{d.document_title}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`text-2xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm ${d.access_type_snapshot === "PREMIUM"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}>
                      {d.access_type_snapshot}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(d.downloaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-2xs font-bold text-muted-foreground/60 uppercase tracking-tighter">
                        {new Date(d.downloaded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-20 text-center">
                  <p className="text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">No assets discovered in your local collection yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-primary border-muted" />
        </div>
      )}
    </div>
  );
}
