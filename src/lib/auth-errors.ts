/**
 * Maps Supabase Auth (and similar) errors to short, user-facing copy (plan §11).
 * Supabase may return `AuthApiError`-like objects; read `.message` defensively.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

function looksLikeEmailNotConfirmed(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("email_not_confirmed") ||
    m.includes("signup requires a confirmed email")
  );
}

export function formatAuthError(error: unknown): string {
  const raw = getErrorMessage(error);
  const msg = raw.toLowerCase();

  // Check before generic "invalid credentials" — some stacks return overlapping text.
  if (looksLikeEmailNotConfirmed(raw)) {
    return (
      "This account is still marked unconfirmed in Supabase (often if it was created while Confirm email was ON). " +
      "Disable Confirm email only affects new sign-ups. " +
      "Fix: Authentication → Users → open your user → confirm the email, " +
      "or run the one-time SQL in supabase/migrations/20260415120000_backfill_auth_email_confirmed_at.sql."
    );
  }

  if (msg.includes("invalid login credentials")) {
    return "That email or password doesn’t match our records. Try again or reset your password.";
  }
  if (msg.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (msg.includes("already taken") || msg.includes("unique")) {
    return "This user ID is already taken. Try another.";
  }

  return raw || "Something went wrong. Please try again.";
}
