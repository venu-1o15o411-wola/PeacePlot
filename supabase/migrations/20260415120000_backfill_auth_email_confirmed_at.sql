-- ONE-TIME: After disabling "Confirm email" in Authentication → Providers → Email,
-- existing users may still have email_confirmed_at = NULL, so signInWithPassword
-- returns "Email not confirmed". This backfill marks those users as confirmed.
--
-- Run once in Supabase SQL Editor (postgres). Review before production multi-tenant use.
-- See plan.md §4.4.0

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
