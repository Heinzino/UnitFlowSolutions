'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'var(--font-geist-sans)',
          borderRadius: '12px',
        },
      }}
    />
  )
}
