-- ═══════════════════════════════════════════════════════════════
-- LoyaltyApp — Fix RLS para Canjes de Clientes
-- Ejecutar en: https://supabase.com/dashboard/project/qcrdbhbxcyqeyxwwhaiv/sql/new
-- ═══════════════════════════════════════════════════════════════

-- 1. Permitir que un cliente autenticado actualice SU PROPIO registro
DROP POLICY IF EXISTS "cust_self_update" ON customers;
CREATE POLICY "cust_self_update" ON customers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Crear un trigger que descuenta puntos automáticamente
--    cuando se inserta una transacción de tipo 'redeem'
--    (solución robusta que no depende del cliente)
CREATE OR REPLACE FUNCTION fn_apply_point_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET points = GREATEST(0, points + NEW.points)
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_apply_points ON point_transactions;
CREATE TRIGGER trg_apply_points
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_apply_point_transaction();

-- ═══════════════════════════════════════════════════════════════
-- IMPORTANTE: Si existentes transacciones ya suman puntos desde 
-- el código JS, comentar el trigger de arriba para evitar doble 
-- conteo. El trigger es útil si se decide centralizar la lógica aquí.
-- ═══════════════════════════════════════════════════════════════

-- OPCIÓN SIMPLE (sin trigger): solo agregar la política de UPDATE
-- para que el cliente pueda actualizar sus propios puntos:
-- (Ya incluida arriba como "cust_self_update")
