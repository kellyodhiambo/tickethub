-- Tuma M-Pesa checkout attempts. Provider credentials and callbacks are handled
-- only by Edge Functions; browser clients cannot write payment state or tickets.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS tuma_merchant_request_id text,
  ADD COLUMN IF NOT EXISTS tuma_checkout_request_id text,
  ADD COLUMN IF NOT EXISTS tuma_receipt text,
  ADD COLUMN IF NOT EXISTS tuma_result_code integer,
  ADD COLUMN IF NOT EXISTS tuma_result_desc text;

CREATE TABLE IF NOT EXISTS public.ticket_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id),
  order_reference text NOT NULL UNIQUE,
  checkout_request_id text UNIQUE,
  merchant_request_id text,
  callback_token_hash text NOT NULL,
  status_token_hash text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  unit_price integer NOT NULL CHECK (unit_price > 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  tier_id text NOT NULL,
  tier_name text NOT NULL,
  attendee_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  receipt_number text,
  result_code integer,
  result_desc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ticket_payment_attempts FROM anon, authenticated;
GRANT SELECT ON public.ticket_payment_attempts TO authenticated;
DROP POLICY IF EXISTS ticket_payment_attempt_owner_read ON public.ticket_payment_attempts;
CREATE POLICY ticket_payment_attempt_owner_read ON public.ticket_payment_attempts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.finalize_tuma_ticket_payment(
  p_attempt_id uuid,
  p_checkout_request_id text,
  p_amount integer,
  p_receipt_number text,
  p_result_code integer,
  p_result_desc text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_attempt public.ticket_payment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_attempt
    FROM public.ticket_payment_attempts
    WHERE id = p_attempt_id
    FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_attempt.status = 'paid' THEN RETURN true; END IF;
  IF v_attempt.status <> 'pending'
     OR v_attempt.checkout_request_id IS DISTINCT FROM p_checkout_request_id
     OR v_attempt.amount <> p_amount THEN
    RETURN false;
  END IF;

  IF p_result_code = 0 AND coalesce(p_receipt_number, '') <> '' THEN
    UPDATE public.ticket_payment_attempts SET status='paid', receipt_number=p_receipt_number,
      result_code=p_result_code, result_desc=p_result_desc, updated_at=now() WHERE id=p_attempt_id;
    UPDATE public.orders SET status='completed', channel='M-Pesa',
      reference=v_attempt.order_reference WHERE id=v_attempt.order_id;
    INSERT INTO public.tickets (
      event_id, user_id, tier_name, price, quantity, qr_code, status,
      payment_reference, buyer_name, buyer_email, buyer_phone, total_amount,
      payment_method, tuma_merchant_request_id, tuma_checkout_request_id,
      tuma_receipt, tuma_result_code, tuma_result_desc, ticket_name,
      payment_status, attendee, order_reference
    )
    SELECT v_attempt.event_id,
      (SELECT user_id FROM public.orders WHERE id=v_attempt.order_id),
      v_attempt.tier_name,
      v_attempt.unit_price,
      1,
      upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
      'valid', v_attempt.order_reference, v_attempt.buyer_name, v_attempt.buyer_email,
      v_attempt.buyer_phone, v_attempt.unit_price,
      'mpesa', v_attempt.merchant_request_id, v_attempt.checkout_request_id,
      p_receipt_number, p_result_code, p_result_desc, v_attempt.tier_name,
      'completed', coalesce(v_attempt.attendee_names->>(n-1), v_attempt.buyer_name),
      v_attempt.order_reference
    FROM generate_series(1, v_attempt.quantity) AS n;
    UPDATE public.events SET
      tickets_sold=coalesce(tickets_sold,0)+v_attempt.quantity,
      ticket_tiers=(
        SELECT coalesce(jsonb_agg(
          CASE WHEN item->>'id'=v_attempt.tier_id
            THEN jsonb_set(item, '{sold}', to_jsonb(coalesce((item->>'sold')::integer,0)+v_attempt.quantity), true)
            ELSE item END
        ), '[]'::jsonb)
        FROM jsonb_array_elements(coalesce(ticket_tiers,'[]'::jsonb)) AS tiers(item)
      )
      WHERE id=v_attempt.event_id;
    RETURN true;
  END IF;

  UPDATE public.ticket_payment_attempts SET status='failed', result_code=p_result_code,
    result_desc=p_result_desc, updated_at=now() WHERE id=p_attempt_id;
  UPDATE public.orders SET status='failed' WHERE id=v_attempt.order_id AND status='pending';
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_tuma_ticket_payment(uuid,text,integer,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_tuma_ticket_payment(uuid,text,integer,text,integer,text) TO service_role;
