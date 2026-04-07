import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { businessId, payerEmail } = await req.json();

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Missing businessId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // payerEmail es requerido por MP, usar fallback si no viene
    const emailToUse = payerEmail || 'pagador@loyaltyapp.com';

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: 'MercadoPago not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const origin = req.headers.get('origin') || 'https://loyaltyapp.futuwebs.com';
    const appUrl = origin.includes('localhost') ? 'http://localhost:5173' : origin;

    // Usar Checkout Pro (preferences) - compatible con cuenta MLA Argentina
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          title: 'LoyaltyApp Pro — Suscripción Mensual',
          quantity: 1,
          unit_price: 25000,  // ARS (moneda de la cuenta MLA)
          currency_id: 'ARS',
          description: 'Acceso ilimitado a clientes y recompensas'
        }],
        payer: {
          email: emailToUse
        },
        back_urls: {
          success: `${appUrl}/#/pago-exitoso`,
          failure: `${appUrl}/#/pago-error`,
          pending: `${appUrl}/#/pago-pendiente`
        },
        auto_return: 'approved',
        external_reference: businessId,
        statement_descriptor: 'LOYALTYAPP PRO'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from MercadoPago:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Error creating preference', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checkout preference created:', data.id, 'for business:', businessId);

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
