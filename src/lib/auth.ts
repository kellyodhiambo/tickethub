export const AUTH_DEFAULT_PATH = "/account";
export const OAUTH_NEXT_STORAGE_KEY = "tickethub-oauth-next";

const prefix = (() => {
  const base = typeof __BASE_PATH__ === "string" ? __BASE_PATH__ : "/";
  const cleaned = base.split("/").filter(Boolean).join("/");
  return cleaned ? `/${cleaned}` : "";
})();

/** Keep production auth on TicketHub; use the current origin for local development. */
const authOrigin = import.meta.env.PROD ? "https://tickets.tribedala.com" : window.location.origin;
export const authCallbackUrl = `${authOrigin}${prefix}/auth/callback`;

/**
 * Only internal, same-origin destinations are allowed after an ordinary sign-in.
 * Auth workflow routes and the callback itself are never valid destinations.
 */
export function validateOrdinaryPostAuthNext(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return AUTH_DEFAULT_PATH;
  if (!next.startsWith("/") || next.startsWith("//")) return AUTH_DEFAULT_PATH;
  if (next.includes("://") || next.startsWith("/\\")) return AUTH_DEFAULT_PATH;

  const path = next.split("?")[0].split("#")[0];
  if (!path || path === "/") return AUTH_DEFAULT_PATH;
  if (path === "/auth" || path.startsWith("/auth/")) return AUTH_DEFAULT_PATH;
  if (["/signin", "/signup", "/forgot-password", "/reset-password"].includes(path)) {
    return AUTH_DEFAULT_PATH;
  }
  return path;
}

/** Turns Supabase auth errors into something a human can act on. */
export function describeAuthError(message: string): string {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) {
    return "That email and password combination does not match an account.";
  }
  if (value.includes("email not confirmed")) {
    return "Confirm your email address before signing in. We can send a fresh six-digit code.";
  }
  if (value.includes("user already registered")) {
    return "An account already exists for this email. Sign in instead.";
  }
  if (value.includes("password should be at least")) {
    return "Use a password with at least 8 characters.";
  }
  if (value.includes("rate limit") || value.includes("too many")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (value.includes("signups not allowed") || value.includes("signup is disabled")) {
    return "New registrations are closed right now. Existing accounts can still sign in.";
  }
  if (value.includes("otp") && value.includes("expired")) {
    return "That code has expired. Request a new one.";
  }
  if (value.includes("token has expired") || value.includes("invalid token")) {
    return "That code is not valid. Check the digits and try again.";
  }
  return message;
}
