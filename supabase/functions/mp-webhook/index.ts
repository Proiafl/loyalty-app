import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Security Headers ────────────────────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ── MercadoPago Signature Validation ────────────────────────
async function validateMPSignature(req: Request, body: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  // If no secret configured, skip validation (dev mode)
  if (!secret) {
    console.warn('[Webhook] MP_WEBHOOK_SECRET not set — skipping signature check');
    return true;
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    console.warn('[Webhook] Missing x-signature or x-request-id headers');
    return false;
  }

  // Parse x-signature: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(
    xSignature.split(',').map(s => s.split('=').map(p => p.trim()) as [string, string])
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) {
    console.warn('[Webhook] Malformed x-signature header');
    return false;
  }

  // Build the manifest per MP docs: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
  // For payment notifications, data.id is in the body
  let dataId = '';
  try {
    const parsed = JSON.parse(body);
    dataId = parsed?.data?.id ? String(parsed.data.id) : '';
  } catch (_) { /* ignore */ }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Compute HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(manifest);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const valid = computedHash === v1;
  if (!valid) console.error('[Webhook] Signature mismatch — possible spoofed request');
  return valid;
}

// ── Main Handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    // Read body once for both signature validation and processing
    const body = await req.text();

    // ── Validate MP signature ──────────────────────────────
    const isValid = await validateMPSignature(req, body);
    if (!isValid) {
      console.error('[Webhook] Rejected — invalid signature');
      return new Response('Unauthorized', {
        status: 401,
        headers: { ...SECURITY_HEADERS }
      });
    }

    const bodyObj = body ? JSON.parse(body).catch?.(() => ({})) ?? (() => {
      try { return JSON.parse(body); } catch { return {}; }
    })() : {};

    console.log('Webhook received — type:', type, 'body:', body.substring(0, 200));

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN not configured');
      return new Response('OK', { status: 200, headers: SECURITY_HEADERS });
    }

    // ── Checkout Pro → type=payment ───────────────────────
    if (type === 'payment') {
      const paymentId = bodyObj?.data?.id;
      if (!paymentId) return new Response('OK', { status: 200, headers: SECURITY_HEADERS });

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      if (!res.ok) {
        console.error('Error fetching payment:', paymentId);
        return new Response('OK', { status: 200, headers: SECURITY_HEADERS });
      }

      const payment = await res.json();
      console.log('Payment detail:', payment.status, payment.external_reference);

      if (payment.status === 'approved' && payment.external_reference) {
        const businessId = payment.external_reference;

        const { error: updateErr } = await supabase.from('businesses').update({
          plan: 'pro',
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', businessId);

        if (updateErr) {
          console.error('Error upgrading business:', updateErr.message);
        } else {
          console.log(`✅ Business ${businessId} upgraded to PRO`);

          await supabase.from('subscription_events').insert({
            business_id: businessId,
            mp_payment_id: String(paymentId),
            status: payment.status,
            plan: 'pro',
            payload: payment
          }).maybeSingle().catch(() => {});
        }
      }
    }

    // ── Legacy preapproval compatibility ──────────────────
    if (type === 'subscription_preapproval') {
      const preapprovalId = bodyObj?.data?.id;
      if (preapprovalId) {
        const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
          headers: { 'Authorization': `Bearer ${mpAccessToken}` }
        });
        if (res.ok) {
          const detail = await res.json();
          if (detail.external_reference && detail.status === 'authorized') {
            await supabase.from('businesses').update({
              plan: 'pro',
              plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }).eq('id', detail.external_reference);
            console.log(`✅ Business ${detail.external_reference} upgraded via preapproval`);
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: SECURITY_HEADERS });

  } catch (error) {
    const err = error as Error;
    console.error('Webhook error:', err.message);
    return new Response('OK', { status: 200, headers: SECURITY_HEADERS }); // Always 200 so MP doesn't retry
  }
});
