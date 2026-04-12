-- ============================================================
-- SECURITY MIGRATION: Full RLS + Policy Hardening
-- LoyaltyApp — Proyecto: qcrdbhbxcyqeyxwwhaiv
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. BUSINESSES ────────────────────────────────────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "businesses_owner_select"     ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner_update"     ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner_insert"     ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner_delete"     ON public.businesses;
DROP POLICY IF EXISTS "businesses_public_slug_select" ON public.businesses;

-- Owner CRUD
CREATE POLICY "businesses_owner_select"
  ON public.businesses FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "businesses_owner_update"
  ON public.businesses FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses_owner_insert"
  ON public.businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses_owner_delete"
  ON public.businesses FOR DELETE
  USING (owner_id = auth.uid());

-- Public read by slug for /join/:slug route
CREATE POLICY "businesses_public_slug_select"
  ON public.businesses FOR SELECT
  USING (slug IS NOT NULL);


-- ── 2. CUSTOMERS ─────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_owner_select"  ON public.customers;
DROP POLICY IF EXISTS "customers_owner_insert"  ON public.customers;
DROP POLICY IF EXISTS "customers_owner_update"  ON public.customers;
DROP POLICY IF EXISTS "customers_self_select"   ON public.customers;
DROP POLICY IF EXISTS "customers_self_update"   ON public.customers;
DROP POLICY IF EXISTS "customers_anon_insert"   ON public.customers;

-- Business owner reads all their customers
CREATE POLICY "customers_owner_select"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
    )
  );

-- Business owner inserts customers
CREATE POLICY "customers_owner_insert"
  ON public.customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Business owner updates customers (add points manually)
CREATE POLICY "customers_owner_update"
  ON public.customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Customer reads their own profile
CREATE POLICY "customers_self_select"
  ON public.customers FOR SELECT
  USING (user_id = auth.uid());

-- Customer can update their own record (redemption flow)
CREATE POLICY "customers_self_update"
  ON public.customers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anonymous insert for self-registration via /join/:slug
CREATE POLICY "customers_anon_insert"
  ON public.customers FOR INSERT
  WITH CHECK (true);


-- ── 3. REWARDS ───────────────────────────────────────────────
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards_owner_all"      ON public.rewards;
DROP POLICY IF EXISTS "rewards_public_select"  ON public.rewards;

-- Owner manages their rewards
CREATE POLICY "rewards_owner_all"
  ON public.rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = rewards.business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Anyone can read rewards (needed for client card/catalog)
CREATE POLICY "rewards_public_select"
  ON public.rewards FOR SELECT
  USING (true);


-- ── 4. POINT_TRANSACTIONS ────────────────────────────────────
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_owner_select"    ON public.point_transactions;
DROP POLICY IF EXISTS "transactions_owner_insert"    ON public.point_transactions;
DROP POLICY IF EXISTS "transactions_customer_select" ON public.point_transactions;
DROP POLICY IF EXISTS "transactions_customer_insert" ON public.point_transactions;

-- Owner reads all their business transactions
CREATE POLICY "transactions_owner_select"
  ON public.point_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = point_transactions.business_id AND b.owner_id = auth.uid()
    )
  );

-- Owner inserts transactions (manual add)
CREATE POLICY "transactions_owner_insert"
  ON public.point_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Customer reads their own transactions
CREATE POLICY "transactions_customer_select"
  ON public.point_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = point_transactions.customer_id AND c.user_id = auth.uid()
    )
  );

-- Customer inserts their own redemption transactions
CREATE POLICY "transactions_customer_insert"
  ON public.point_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );


-- ── 5. SUBSCRIPTION_EVENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL,
  mp_payment_id  text,
  status         text,
  plan           text,
  payload        jsonb,
  created_at     timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_events_owner_select" ON public.subscription_events;

-- Owner reads their own subscription events
CREATE POLICY "sub_events_owner_select"
  ON public.subscription_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = subscription_events.business_id AND b.owner_id = auth.uid()
    )
  );
-- Note: INSERT is done via service_role key in mp-webhook (no frontend INSERT needed)


-- ── 6. QR_TOKENS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL,
  customer_id    uuid NOT NULL,
  token          text NOT NULL,
  used           boolean DEFAULT false,
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_tokens_customer_insert" ON public.qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_customer_select" ON public.qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_owner_select"    ON public.qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_owner_update"    ON public.qr_tokens;

-- Cliente puede generar sus propios QR tokens
CREATE POLICY "qr_tokens_customer_insert"
  ON public.qr_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );

-- Cliente puede ver sus propios QR tokens
CREATE POLICY "qr_tokens_customer_select"
  ON public.qr_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = qr_tokens.customer_id AND c.user_id = auth.uid()
    )
  );

-- Dueño del negocio puede leer códigos QR de su negocio
CREATE POLICY "qr_tokens_owner_select"
  ON public.qr_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = qr_tokens.business_id AND b.owner_id = auth.uid()
    )
  );

-- Dueño del negocio puede invalidar/marcar como usados los QR tokens 
CREATE POLICY "qr_tokens_owner_update"
  ON public.qr_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = qr_tokens.business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = qr_tokens.business_id AND b.owner_id = auth.uid()
    )
  );

