// src/components/utils/notificationApi.js
//
// Direct REST client for the external notification microservice.
// Auth is a static service key sent as `x-api-key` on every request
// (no JWT here — this talks to notification.mesmi.co.in, not our Django API).
// WebSocket/real-time is intentionally skipped; the inbox refreshes on
// screen open / manual refresh / background polling (see NotificationContext).

import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_NOTIFICATION_URL || "https://notification.mesmi.co.in";
const API_KEY =
  import.meta.env.VITE_NOTIFICATION_API_KEY ||
  "ns_skc_d81ae6b063768ddb8b4d553c922d71fe6f68c6bb";

const notificationApi = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
});

/* ---------------------------------------------------------------
   1. GET a user's notifications (inbox / bell list)
   Response: { data: { notifications[], total, unreadCount } }
--------------------------------------------------------------- */
export const getNotifications = ({
  userId,
  limit = 20,
  offset = 0,
  channel = "IN_APP",
  status,
} = {}) =>
  notificationApi.get("/notifications", {
    params: { userId, limit, offset, channel, ...(status ? { status } : {}) },
  });

/* ---------------------------------------------------------------
   2. Mark one notification as read.
   `id` MUST be the "_id" from the GET list response.
--------------------------------------------------------------- */
export const markNotificationRead = (id) =>
  notificationApi.patch(`/notifications/${id}/read`);

/* ---------------------------------------------------------------
   3. Register a push (FCM) token — call after login.
--------------------------------------------------------------- */
export const registerPushToken = ({
  userId,
  token,
  platform = "web",
  deviceId,
}) =>
  notificationApi.post("/push-tokens/register", {
    userId: String(userId),
    token,
    platform,
    ...(deviceId ? { deviceId } : {}),
  });

/* ---------------------------------------------------------------
   4. Unregister a push token — call on logout.
--------------------------------------------------------------- */
export const unregisterPushToken = (token) =>
  notificationApi.post("/push-tokens/unregister", { token });

export default notificationApi;
