import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const type = url.searchParams.get('type') || (await req.clone().json()).type;
    const body = await req.json();

    console.log('Webhook received:', type, action, JSON.stringify(body));

    // Handle subscription payment payload
    if (type === 'subscription_preapproval') {
      const { data } = body;
      const preapprovalId = data.id;

      // Obtener detalles de la suscripcion para ver el external_reference
      const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
      if (mpAccessToken) {
        const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
          headers: { 'Authorization': `Bearer ${mpAccessToken}` }
        });
        
        if (res.ok) {
          const detail = await res.json();
          const businessId = detail.external_reference;
          const status = detail.status; // 'authorized', 'paused', 'cancelled'
          
          if (businessId && status === 'authorized') {
            // Actualizar negocio a PRO
            await supabase.from('businesses').update({
              plan: 'pro',
              plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }).eq('id', businessId);
            
            // Log event
            await supabase.from('subscription_events').insert({
              business_id: businessId,
              mp_preapproval_id: preapprovalId,
              status: status,
              plan: 'pro',
              payload: detail
            });
            
            console.log(`Business ${businessId} upgraded to PRO`);
          }
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
