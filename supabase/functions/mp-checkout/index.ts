import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { businessId, planPrice, payerEmail } = await req.json();

    if (!businessId || !payerEmail) {
      return new Response(JSON.stringify({ error: 'Missing businessId or payerEmail' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: 'MercadoPago not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Determine app base URL dynamically
    const origin = req.headers.get('origin') || 'https://loyaltyapp.futuwebs.com';
    const appUrl = origin.includes('localhost') ? 'http://localhost:5173' : origin;

    // Usar API de Preapproval para suscripciones recurrentes MP
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: "LoyaltyApp Pro — Suscripción Mensual",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          start_date: new Date().toISOString(),
          transaction_amount: planPrice || 25,
          currency_id: "USD"
        },
        payer_email: payerEmail,
        back_url: `${appUrl}/#/pago-exitoso`,
        external_reference: businessId,
        status: "pending"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from MercadoPago:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Error generating subscription', details: data }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Preapproval created:', data.id, 'for business:', businessId);

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
