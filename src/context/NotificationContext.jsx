import { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    getNotifications,
    markNotificationRead,
} from "../components/utils/notificationApi";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// How often we re-check the unread badge while the tab is open & visible.
const BADGE_POLL_MS = 30000; // 30s

export const NotificationProvider = ({ children }) => {
    const user = useSelector((state) => state.user?.data);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Notification service keys notifications by the Django user PK (as a string).
    const userId = user?.id;

    /* Full inbox fetch (list + counts) — used on notification page open
       and on manual refresh. Heavier: pulls the latest 20 items. */
    const fetchNotifications = async (isRefresh = false) => {
        if (!userId) return;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await getNotifications({
                userId,
                channel: "IN_APP",
                limit: 20,
                offset: 0,
            });

            // API returns { data: { notifications, unreadCount, total } }
            const data = res.data?.data;

            setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
            setUnreadCount(data?.unreadCount || 0);
            setTotalCount(data?.total || 0);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            if (isRefresh) setRefreshing(false);
            else setLoading(false);
        }
    };

    /* Lightweight badge poll — only the counts, tiny payload (limit=1).
       Runs on an interval app-wide without clobbering the list. */
    const refreshUnreadCount = async () => {
        if (!userId) return;
        try {
            const res = await getNotifications({
                userId,
                channel: "IN_APP",
                limit: 1,
                offset: 0,
            });
            const data = res.data?.data;
            setUnreadCount(data?.unreadCount || 0);
            setTotalCount(data?.total || 0);
        } catch {
            /* silent — background badge poll */
        }
    };

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        // Populate list + badge once on login / app boot.
        fetchNotifications();

        // Poll the badge only while the tab is actually visible.
        const tick = () => {
            if (document.visibilityState === "visible") refreshUnreadCount();
        };
        const intervalId = setInterval(tick, BADGE_POLL_MS);

        // And re-check immediately when the user returns to the tab.
        const onVisible = () => {
            if (document.visibilityState === "visible") refreshUnreadCount();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const markAsRead = async (id, isAlreadyRead) => {
        if (isAlreadyRead) return;

        // Optimistic: `id` is the "_id" from the GET list response.
        setNotifications((prev) =>
            prev.map((notif) =>
                notif._id === id ? { ...notif, readAt: new Date().toISOString() } : notif
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await markNotificationRead(id);
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
            fetchNotifications();
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                totalCount,
                loading,
                refreshing,
                fetchNotifications,
                refreshUnreadCount,
                markAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
