'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAILS } from '@/lib/constants/admin'
import { base, rateLimiter } from '@/lib/airtable/client'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { revalidateTag } from 'next/cache'

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export async function createUser(prevState: unknown, formData: FormData) {
  // 1. Verify caller is admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email as (typeof ADMIN_EMAILS)[number])) {
    return { error: 'Unauthorized' }
  }

  // 2. Extract and validate form data
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const propertyNames = formData.getAll('property_names') as string[]

  if (!firstName?.trim()) return { error: 'First name is required' }
  if (!lastName?.trim()) return { error: 'Last name is required' }
  if (!email?.trim()) return { error: 'Email is required' }
  if (!role || !['pm', 'rm', 'exec'].includes(role)) return { error: 'Invalid role' }

  // 3. Generate password
  const password = generatePassword()

  // 4. Create user via Admin API
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, property_ids: propertyNames },
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
    },
  })

  if (error) return { error: error.message }
  return { success: true, email, role, password }
}

export async function createProperty(name: string, streetAddress: string) {
  // 1. Verify caller is admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email as (typeof ADMIN_EMAILS)[number])) {
    return { error: 'Unauthorized' }
  }

  // 2. Create property in Airtable
  await rateLimiter.acquire()
  await base('Properties').create({
    'Property Name': name,
    'Street Address': streetAddress,
  })

  // 3. Invalidate properties cache
  revalidateTag(CACHE_TAGS.properties)

  return { name, streetAddress }
}
