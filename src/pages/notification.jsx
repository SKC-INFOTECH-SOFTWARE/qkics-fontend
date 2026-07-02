import { FaBell, FaSync, FaCheckCircle, FaInbox } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";
import { PageHeader, LoadingSpinner } from "../components/ui";

export default function NotificationPage() {
  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
  } = useNotifications();

  const handleMarkAsRead = (id, isAlreadyRead) => {
    markAsRead(id, isAlreadyRead);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={<FaBell />}
        title="Notifications"
        description="Stay updated with your latest alerts and messages."
        align="center"
        size="md"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/50 px-4 py-2.5 font-bold">
            <span className="text-primary">
              {unreadCount} <span className="text-2xs uppercase tracking-wide text-muted-foreground">Unread</span>
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="text-foreground">
              {totalCount} <span className="text-2xs uppercase tracking-wide text-muted-foreground">Total</span>
            </span>
          </div>

          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing || loading}
            className="rounded-xl border border-border bg-muted/50 p-3 text-foreground transition-all hover:bg-muted disabled:opacity-50"
            title="Refresh"
          >
            <FaSync className={`${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </PageHeader>

      <div className="w-full h-px mb-8 bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="animate-fadeIn">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
              <FaInbox className="text-4xl" />
            </div>
            <h3 className="mb-1.5 text-lg font-bold text-foreground">You're all caught up!</h3>
            <p className="max-w-sm text-sm font-medium text-muted-foreground">
              There are no new notifications to display right now. Check back later.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => {
              const isRead = !!notif.readAt;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleMarkAsRead(notif._id, isRead)}
                  className={`group relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${isRead
                    ? "border-border bg-card/50 hover:border-border hover:bg-card"
                    : "border-primary/30 bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5"
                    }`}
                >
                  {!isRead && (
                    <span className="absolute left-0 top-5 h-8 w-1 -translate-x-px rounded-r-full bg-primary" />
                  )}
                  <div className="flex gap-4">
                    <div className="mt-1.5 flex-shrink-0">
                      <div
                        className={`h-2.5 w-2.5 rounded-full transition-all ${isRead ? "border border-muted-foreground/40 bg-transparent" : "bg-primary shadow-[0_0_10px_var(--primary)]"
                          }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className={`text-base font-bold leading-tight ${isRead ? "text-foreground" : "text-primary"}`}>
                          {notif.renderedSubject}
                        </h4>
                        <span className="whitespace-nowrap text-2xs font-bold uppercase tracking-widest text-muted-foreground/60">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      <p className={`mb-3 text-sm leading-relaxed ${isRead ? "text-muted-foreground" : "text-foreground/80"}`}>
                        {notif.renderedBody}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-1 text-2xs font-black uppercase tracking-widest text-muted-foreground">
                          {notif.event.replace(/_/g, " ")}
                        </span>

                        {isRead && (
                          <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-emerald-500">
                            <FaCheckCircle /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
