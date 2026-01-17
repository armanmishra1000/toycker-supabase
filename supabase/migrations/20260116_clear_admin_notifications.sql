-- Clear all admin notifications
-- This allows for a fresh start, removing any stale notifications from deleted orders or tests.

BEGIN;

TRUNCATE TABLE public.admin_notifications;

COMMIT;
