-- Keep paginated public catalogue reads and their date ordering index-backed.
-- This table is shared with Tribedala, so this index is intentionally scoped to
-- the public event statuses used by TicketHub.
CREATE INDEX IF NOT EXISTS events_public_status_date_id_idx
  ON public.events (status, date, id)
  WHERE status IN ('upcoming', 'ongoing');
