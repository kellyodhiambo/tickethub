# Tuma payments setup

TicketHub sends M-Pesa STK Push requests from the `tuma-checkout` Supabase Edge Function. Tuma credentials stay in Supabase secrets; never add them to `.env`, frontend code, or Git. The function accepts both documented Tuma token response shapes (`token` and `data.token`).

## Merchant setup

1. Complete Tuma merchant onboarding and identity verification at <https://merchant.tuma.co.ke>.
2. Create the business profile that should receive ticket-sale settlements, including its bank or M-Pesa settlement details and business email.
3. In Tuma Developer settings, select that business and generate its API key. Tuma starts accounts in sandbox; the live merchant account must be activated before production collections.

## Supabase secrets

In Supabase Dashboard → Edge Functions → Secrets for the TicketHub project, add:

- `TUMA_BUSINESS_EMAIL`: the selected Tuma business profile email
- `TUMA_API_KEY`: the generated Tuma API key

The deployed functions already use the standard Supabase `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` secrets. Do not expose the service role key or Tuma API key in the browser.

## Callback

Set the callback URL supplied to Tuma as-is. It is generated per payment attempt at:

`https://jocwzqjzarihupnpcjmm.supabase.co/functions/v1/tuma-callback?token=<one-time-random-token>`

The callback function is deployed without gateway JWT verification because Tuma cannot send a Supabase user token. It validates the one-time callback token, checkout request ID, and expected amount before finalizing the order. Tickets are issued once, only for a successful callback with a receipt number. The checkout polls the separately token-protected `tuma-payment-status` function.

Tuma's published callback examples do not document a webhook signature. The unique high-entropy callback token is therefore used to authenticate callbacks; contact Tuma and enable a signed callback or payment-status verification endpoint if their account supports one.

## Smoke test

Use a sandbox event/ticket price allowed by the current Tuma sandbox, initiate checkout with a valid Kenyan mobile number, complete the STK prompt, then confirm:

- the order changes from pending to completed;
- one ticket row is issued per ticket quantity;
- the event and tier sold counts increase once;
- replaying the same callback does not issue duplicate tickets.

Do not treat a successful STK initiation response as payment confirmation. The callback is the point at which TicketHub issues tickets.
