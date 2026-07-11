// src/components/utils/notificationApi.js
//
// In-app notification client.
//
// NOTE: the browser CANNOT call the notification microservice directly —
// that service does not send CORS headers, so every browser request is
// blocked. Instead we go through our own Django API (same-origin, JWT-auth),
// which proxies to the service server-side and attaches the x-api-key.
// The service API key therefore never ships to the browser.

import axiosSecure from "./axiosSecure";

/* ---------------------------------------------------------------
   GET the logged-in user's notifications (inbox / bell list).
   Django resolves the user from the JWT, so no userId is needed.
   Response: { success, data: { notifications[], total, unreadCount } }
--------------------------------------------------------------- */
export const getNotifications = ({
  limit = 20,
  offset = 0,
  channel = "IN_APP",
  status,
} = {}) =>
  axiosSecure.get("/v1/notifications/inbox/", {
    params: { limit, offset, channel, ...(status ? { status } : {}) },
  });

/* ---------------------------------------------------------------
   Mark one notification as read.
   `id` is the service "_id" from the inbox list.
--------------------------------------------------------------- */
export const markNotificationRead = (id) =>
  axiosSecure.patch(`/v1/notifications/inbox/${id}/read/`);
