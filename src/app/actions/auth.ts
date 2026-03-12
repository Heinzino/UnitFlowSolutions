'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROLE_ROUTES } from '@/lib/types/auth'

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  const role = data.user?.app_metadata?.role as string | undefined
  const dest = (role && ROLE_ROUTES[role as keyof typeof ROLE_ROUTES]) ?? '/property'
  redirect(dest)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
