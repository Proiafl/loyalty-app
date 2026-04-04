# LoyaltyApp — SQL para Supabase

## INSTRUCCIONES
1. Ir a: https://supabase.com/dashboard/project/qcrdbhbxcyqeyxwwhaiv/sql/new
2. Pegar el SQL de abajo y ejecutar
3. Luego ir a Authentication → Settings → URL Configuration y agregar el dominio del proyecto

---

```sql
-- ─────────────────────────────────────────
-- LoyaltyApp SaaS — Core Schema
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Businesses (tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  type                  text NOT NULL DEFAULT 'otro',
  address               text,
  phone                 text,
  logo_url              text,
  plan                  text NOT NULL DEFAULT 'freemium',
  plan_expires_at       timestamptz,
  points_per_visit      int NOT NULL DEFAULT 10,
  points_per_peso       numeric(10,2),
  points_method         text NOT NULL DEFAULT 'visit',
  qr_ttl_seconds        int NOT NULL DEFAULT 90,
  max_validations_day   int NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Customers
CREATE TABLE IF NOT EXISTS customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name          text NOT NULL,
  phone         text,
  email         text,
  points        int NOT NULL DEFAULT 0,
  total_visits  int NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  status        text NOT NULL DEFAULT 'new',
  birthday      date,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);

-- ── Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  points_required int NOT NULL,
  icon            text DEFAULT '🎁',
  active          boolean NOT NULL DEFAULT true,
  total_redeemed  int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Point Transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type          text NOT NULL,
  points        int NOT NULL,
  token         text,
  reward_id     uuid REFERENCES rewards(id) ON DELETE SET NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── QR Tokens
CREATE TABLE IF NOT EXISTS qr_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,
  used          boolean NOT NULL DEFAULT false,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Subscription Events
CREATE TABLE IF NOT EXISTS subscription_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid REFERENCES businesses(id) ON DELETE SET NULL,
  mp_payment_id       text,
  mp_preapproval_id   text,
  status              text,
  plan                text,
  amount              numeric(10,2),
  payload             jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON point_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON qr_tokens(expires_at);

-- ── RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Businesses: owner solo
CREATE POLICY "biz_owner" ON businesses FOR ALL USING (owner_id = auth.uid());

-- Customers: owner del negocio
CREATE POLICY "cust_owner" ON customers FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Customers: autoregistro público (insert sin auth)
CREATE POLICY "cust_public_insert" ON customers FOR INSERT WITH CHECK (true);

-- Customers: lectura pública (para vista del cliente)
CREATE POLICY "cust_public_read" ON customers FOR SELECT USING (true);

-- Rewards: owner
CREATE POLICY "rew_owner" ON rewards FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "rew_public_read" ON rewards FOR SELECT USING (active = true);

-- Transactions: owner
CREATE POLICY "tx_owner" ON point_transactions FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "tx_public_insert" ON point_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "tx_public_read" ON point_transactions FOR SELECT USING (true);

-- QR tokens: owner + cliente puede insertar
CREATE POLICY "qr_owner" ON qr_tokens FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "qr_public_insert" ON qr_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "qr_public_read" ON qr_tokens FOR SELECT USING (true);
CREATE POLICY "qr_public_update" ON qr_tokens FOR UPDATE USING (true);

-- Businesses: lectura pública por slug (para join page)
CREATE POLICY "biz_public_read" ON businesses FOR SELECT USING (true);

-- Subscription events: owner
CREATE POLICY "sub_owner" ON subscription_events FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
```
