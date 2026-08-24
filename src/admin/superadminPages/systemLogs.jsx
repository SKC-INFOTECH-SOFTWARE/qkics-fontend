import { useCallback, useEffect, useMemo, useState } from "react";
import { FaTerminal, FaExclamationTriangle, FaTimesCircle, FaListUl } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import {
  PageHeader, SearchInput, Button, Badge, AdminModal,
} from "../../components/ui";
import { AdminTable } from "../adminComponents/adminUi";

/* level → Badge variant */
const LEVEL_VARIANT = {
  CRITICAL: "danger",
  ERROR:    "danger",
  WARNING:  "warning",
  INFO:     "primary",
  DEBUG:    "neutral",
};

const CATEGORIES = [
  "AUTH", "PAYMENT", "BOOKING", "CALL", "CHAT",
  "COMMUNITY", "NOTIFICATION", "ADMIN", "SYSTEM",
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function StatCard({ icon, label, value, tone }) {
  const toneCls = {
    danger:  "text-danger",
    warning: "text-warning",
    neutral: "text-foreground",
  }[tone] || "text-foreground";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${toneCls}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-black leading-none text-foreground">{value ?? "—"}</p>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function SystemLogs() {
  const { showAlert } = useAlert();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [detail, setDetail] = useState(null); // selected log row

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosSecure.get("/v1/admin/system-logs/stats/");
      setStats(res.data);
    } catch {
      /* stats are best-effort */
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (search.trim()) params.search = search.trim();
      if (level) params.level = level;
      if (category) params.category = category;
      const res = await axiosSecure.get("/v1/admin/system-logs/", { params });
      const data = res.data;
      setLogs(Array.isArray(data) ? data : data?.results || []);
      setHasNext(Boolean(data?.next));
    } catch (err) {
      console.error(err);
      showAlert("Failed to load system logs", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, level, category]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [search, level, category]);

  const columns = useMemo(() => ([
    { key: "level", label: "Level" },
    { key: "category", label: "Category" },
    { key: "message", label: "Message" },
    { key: "logger", label: "Source" },
    { key: "time", label: "Time" },
  ]), []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaTerminal />}
        title="System Logs"
        subtitle="Application warnings and errors captured across the platform"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Logs" }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<FaListUl />} label="Total logs" value={stats?.total} tone="neutral" />
        <StatCard icon={<FaTimesCircle />} label="Errors" value={stats?.errors} tone="danger" />
        <StatCard icon={<FaExclamationTriangle />} label="Warnings" value={stats?.warnings} tone="warning" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search message, source…"
        />
        <div className="flex gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
          >
            <option value="">All levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
          >
            <option value="">All areas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={logs}
        loading={loading}
        loadingLabel="Loading logs…"
        empty={{
          icon: <FaTerminal />,
          title: "No logs",
          description: "Warnings and errors will appear here as they happen.",
        }}
        renderRow={(log) => (
          <>
            <td className="py-3 px-5">
              <Badge variant={LEVEL_VARIANT[log.level] || "neutral"}>{log.level}</Badge>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground font-semibold">
              {log.category}
            </td>
            <td className="py-3 px-5">
              <button
                type="button"
                onClick={() => setDetail(log)}
                className="text-left font-medium text-foreground hover:text-primary line-clamp-2 max-w-[520px]"
                title="View details"
              >
                {log.message || "—"}
              </button>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-2xs font-mono text-muted-foreground">
              {log.logger_name || "—"}
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              {fmtDate(log.created_at)}
            </td>
          </>
        )}
      />

      {/* Pagination */}
      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm font-bold text-muted-foreground">Page {page}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <AdminModal
          open
          onClose={() => setDetail(null)}
          title={`${detail.level} · ${detail.category}`}
          subtitle={fmtDate(detail.created_at)}
          icon={<FaTerminal />}
          size="lg"
        >
          <div className="space-y-4 p-1">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Source</p>
              <p className="font-mono text-sm text-foreground break-all">{detail.logger_name || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">{detail.message || "—"}</p>
            </div>
            {detail.detail && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Traceback</p>
                <pre className="max-h-[40vh] overflow-auto rounded-lg bg-muted p-3 text-2xs font-mono text-foreground">
                  {detail.detail}
                </pre>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
