function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export interface AdminLoginRequest {
  phoneNumber: string;
  password: string;
}

export interface AdminLoginResponse {
  adminId: string;
  phoneNumber: string;
}

export interface AdminMeResponse {
  adminId: string;
}

async function extractErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  const message = data?.message;
  if (typeof message === "string") {
    return message;
  }
  // NestJS's ValidationPipe always returns `message` as an array of
  // constraint-violation strings, even for a single failing field.
  if (Array.isArray(message) && message.every((entry) => typeof entry === "string")) {
    return message.join("; ");
  }
  return `Request failed with status ${response.status}`;
}

/**
 * `credentials: "include"` is required on every admin call, not just login —
 * the admin session cookie lives on the API's own origin (set by
 * AdminAuthController), not the frontend's, since apps/web and apps/api are
 * different origins (and different sites once deployed to vercel.app /
 * onrender.com) — without this, the browser never attaches it.
 */
export async function adminLogin(body: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await fetch(`${getApiUrl()}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function adminLogout(): Promise<void> {
  await fetch(`${getApiUrl()}/admin/auth/logout`, { method: "POST", credentials: "include" });
}

/** Returns null for "not logged in as an admin" (401/403) rather than throwing — callers gate on presence/absence, not on the failure reason. */
export async function adminMe(): Promise<AdminMeResponse | null> {
  const response = await fetch(`${getApiUrl()}/admin/auth/me`, { credentials: "include" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}
