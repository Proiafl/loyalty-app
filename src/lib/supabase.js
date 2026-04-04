import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('[Supabase] Missing env vars. Check .env file.')
}

export const supabase = createClient(url, key)

/** Helper: get current session user */
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

/** Helper: get business for current owner */
export async function getBusiness() {
  const user = await getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()
  if (error) return null
  return data
}

/** Helper: get all customer profiles linked to current user (multi-business) */
export async function getCustomerProfiles() {
  const user = await getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('customers')
    .select('*, business:businesses(id, name, slug, type, logo_url, points_per_visit, qr_ttl_seconds)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
  if (error) return []
  return data || []
}
