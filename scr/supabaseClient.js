import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymuwcbtavwblikfrugzh.supabase.co'  // Ex: https://xxxxx.supabase.co
const supabaseKey = 'sb_publishable_h24pu3T5Do9G0zGJhpieBw_iQIgcBkM'  // A chave anon/public

export const supabase = createClient(supabaseUrl, supabaseKey)
