// Single source of truth for the admin identity on the FRONTEND. This is a UX
// gate only (show the admin page, attempt the admin fallback) — the real
// security boundary is server-side: authenticate + adminOnly on the backend
// admin routers. Keep in sync with the backend's ADMIN_EMAIL env default.
export const ADMIN_EMAIL = 'kabbarajamil@gmail.com';
