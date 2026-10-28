-- Withdrawal requests must be created by the settlement backend after funds
-- have cleared. Client supplied balances and destinations are not authoritative.
DROP POLICY IF EXISTS organizer_withdrawals_owner_insert ON public.organizer_withdrawals;
REVOKE INSERT ON public.organizer_withdrawals FROM authenticated, anon;
