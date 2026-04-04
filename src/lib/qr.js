/**
 * QR Token utilities — Client side
 * In production, tokens are generated/validated via Supabase Edge Function.
 * These helpers handle the client-side countdown + display logic.
 */

import { supabase } from './supabase.js'

/** Generate a short alphanumeric token */
export function generateTokenString(businessSlug, customerId) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  const ts = Date.now().toString(36).toUpperCase()
  return `${businessSlug.toUpperCase().slice(0, 3)}-${ts}-${rand}`
}

/**
 * Create a QR token in Supabase for this customer.
 * Returns the token string or null on error.
 */
export async function createQRToken(businessId, customerId, ttlSeconds = 90) {
  const token = generateTokenString(businessId.slice(0, 3), customerId.slice(0, 3))
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

  const { error } = await supabase.from('qr_tokens').insert({
    business_id: businessId,
    customer_id: customerId,
    token,
    expires_at: expiresAt,
    used: false
  })

  if (error) {
    console.error('[QR] Error creating token:', error.message)
    return null
  }
  return token
}

/**
 * Validate a token for a given business.
 * Returns { valid, customer, error } 
 */
export async function validateQRToken(token, businessId) {
  const { data, error } = await supabase
    .from('qr_tokens')
    .select('*, customer:customers(id, name, points)')
    .eq('token', token)
    .eq('business_id', businessId)
    .single()

  if (error || !data) return { valid: false, error: 'Token no reconocido.' }
  if (data.used) return { valid: false, error: `Token ya utilizado (${data.customer?.name}).` }
  if (new Date(data.expires_at) < new Date()) return { valid: false, error: 'QR expirado. Pedile al cliente que genere uno nuevo.' }

  return { valid: true, tokenData: data, customer: data.customer }
}

/**
 * Mark token as used and add points to customer.
 * Call this after business confirms the scan.
 */
export async function confirmQRScan(tokenId, customerId, businessId, pointsToAdd) {
  // 1. Mark token as used
  await supabase.from('qr_tokens').update({ used: true }).eq('id', tokenId)

  // 2. Add points to customer
  const { data: customer } = await supabase
    .from('customers')
    .select('points, total_visits')
    .eq('id', customerId)
    .single()

  const newPoints = (customer?.points || 0) + pointsToAdd
  const newVisits = (customer?.total_visits || 0) + 1

  await supabase.from('customers').update({
    points: newPoints,
    total_visits: newVisits,
    last_visit_at: new Date().toISOString(),
    status: 'active'
  }).eq('id', customerId)

  // 3. Log transaction
  await supabase.from('point_transactions').insert({
    business_id: businessId,
    customer_id: customerId,
    type: 'earn',
    points: pointsToAdd,
    token: tokenId
  })

  return newPoints
}
