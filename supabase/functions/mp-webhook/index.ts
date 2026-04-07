import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const body = await req.json().catch(() => ({}));

    console.log('Webhook received - type:', type, 'body:', JSON.stringify(body));

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN not configured');
      return new Response('OK', { status: 200 });
    }

    // Checkout Pro → type=payment
    if (type === 'payment') {
      const paymentId = body?.data?.id;
      if (!paymentId) return new Response('OK', { status: 200 });

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      if (!res.ok) {
        console.error('Error fetching payment:', paymentId);
        return new Response('OK', { status: 200 });
      }

      const payment = await res.json();
      console.log('Payment detail:', payment.status, payment.external_reference);

      if (payment.status === 'approved' && payment.external_reference) {
        const businessId = payment.external_reference;

        // Actualizar negocio a PRO por 30 días
        const { error: updateErr } = await supabase.from('businesses').update({
          plan: 'pro',
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', businessId);

        if (updateErr) {
          console.error('Error upgrading business:', updateErr.message);
        } else {
          console.log(`✅ Business ${businessId} upgraded to PRO`);

          // Log event (tabla puede no existir, ignorar error)
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

    // Compatibilidad con preapproval (suscripciones antiguas)
    if (type === 'subscription_preapproval') {
      const preapprovalId = body?.data?.id;
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

    return new Response('OK', { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error('Webhook error:', err.message);
    return new Response('OK', { status: 200 }); // Siempre 200 para MP no reintente
  }
});
