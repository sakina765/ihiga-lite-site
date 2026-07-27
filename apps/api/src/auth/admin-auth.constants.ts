/** Shared between AuthService (sets the cookie) and AdminAuthController (clears it on logout) so the two can never drift on name/path. */
export const ADMIN_COOKIE_NAME = "ihiga_admin_token";
export const ADMIN_TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12h — an internal staff session, not a farmer-facing one, so a longer-lived cookie is fine.
