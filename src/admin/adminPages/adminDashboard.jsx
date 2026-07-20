import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  FaUsers, FaRegFileAlt, FaUserTie, FaUserShield, FaThLarge, FaChartLine,
  FaBuilding, FaRupeeSign, FaCreditCard, FaBullhorn, FaCircleNotch, FaUserCircle,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { PageHeader } from "../../components/ui";
import { RoleBadge } from "../adminComponents/adminUi";

const fmt = (n) => (n ?? 0).toLocaleString();
const fmtMoney = (n) => "₹" + (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function AdminDashboard() {
  const user = useSelector((state) => state.user.data);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosSecure.get("/v1/admin/dashboard/stats/");
        if (alive) setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!user || (user.user_type !== "admin" && user.user_type !== "superadmin")) {
    return <Navigate to="/" />;
  }

  const role = user.user_type;

  const kpis = stats ? [
    { title: "Total Users", value: fmt(stats.users?.total), icon: <FaUsers className="text-xl" />, sub: `${fmt(stats.users?.active)} active` },
    { title: "Revenue", value: fmtMoney(stats.revenue?.total), icon: <FaRupeeSign className="text-xl" />, sub: `${fmtMoney(stats.revenue?.this_month)} this month` },
    { title: "Active Subscriptions", value: fmt(stats.engagement?.active_subscriptions), icon: <FaCreditCard className="text-xl" />, sub: "currently valid" },
    { title: "Total Posts", value: fmt(stats.content?.posts), icon: <FaRegFileAlt className="text-xl" />, sub: `${fmt(stats.content?.companies)} companies` },
  ] : [];

  const breakdown = stats ? [
    { label: "Normal", value: stats.users?.normal, icon: <FaUsers /> },
    { label: "Experts", value: stats.users?.expert, icon: <FaUserTie /> },
    { label: "Entrepreneurs", value: stats.users?.entrepreneur, icon: <FaUserShield /> },
    { label: "Investors", value: stats.users?.investor, icon: <FaChartLine /> },
    { label: "Companies", value: stats.content?.companies, icon: <FaBuilding /> },
    { label: "Active Ads", value: stats.content?.ads_active, icon: <FaBullhorn /> },
  ] : [];

  const growth = stats?.user_growth || [];
  const maxGrowth = Math.max(1, ...growth.map((g) => g.count || 0));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaThLarge />}
        title={role === "superadmin" ? "Super Admin Overview" : "Dashboard Overview"}
        subtitle="Live platform metrics"
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <FaCircleNotch className="animate-spin text-2xl text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 text-danger p-6 text-sm font-medium">
          Failed to load dashboard metrics. Please refresh.
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((card, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-soft text-primary">
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
                <h2 className="text-2xl font-bold mt-1 tracking-tight text-foreground">{card.value}</h2>
                {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* CHART + RECENT ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User growth bar chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">User Growth</h3>
                  <p className="text-xs text-muted-foreground">New signups · last 6 months</p>
                </div>
                <span className="p-2 rounded-md text-primary bg-primary-soft"><FaChartLine /></span>
              </div>
              <div className="h-[18rem] flex items-end justify-between gap-3 sm:gap-5 px-1">
                {growth.map((g, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    <span className="text-xs font-bold text-foreground">{g.count}</span>
                    <div
                      className="w-full max-w-[3.5rem] rounded-t-lg bg-primary/80 hover:bg-primary transition-all"
                      style={{ height: `${Math.max(4, (g.count / maxGrowth) * 100)}%` }}
                      title={`${g.count} signups`}
                    />
                    <span className="text-2xs font-medium text-muted-foreground whitespace-nowrap">{g.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="text-base font-semibold mb-5 text-foreground">Recent Signups</h3>
              <div className="space-y-4">
                {(stats.recent_users || []).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex shrink-0 items-center justify-center overflow-hidden">
                      {u.profile_picture ? (
                        <img src={u.profile_picture} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <FaUserCircle className="text-muted-foreground text-xl" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || `@${u.username}`}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <RoleBadge role={u.user_type} />
                      <span className="text-2xs text-muted-foreground">{timeAgo(u.date_joined)}</span>
                    </div>
                  </div>
                ))}
                {(stats.recent_users || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent signups.</p>
                )}
              </div>
            </div>
          </div>

          {/* ROLE / CONTENT BREAKDOWN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {breakdown.map((b, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground shrink-0">
                  {b.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight">{fmt(b.value)}</p>
                  <p className="text-2xs uppercase tracking-wide font-semibold text-muted-foreground truncate">{b.label}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
