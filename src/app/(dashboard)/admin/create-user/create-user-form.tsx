'use client'

import { useActionState, useState, useEffect } from 'react'
import { createUser, createProperty } from '@/app/actions/admin'
import { PropertyMultiSelect } from '@/components/ui/property-multi-select'
import type { PropertyOption } from '@/components/ui/property-multi-select'
import { ROLE_LABELS } from '@/lib/types/auth'
import type { UserRole } from '@/lib/types/auth'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'

interface CreateUserFormProps {
  properties: PropertyOption[]
}

export function CreateUserForm({ properties }: CreateUserFormProps) {
  const [selectedProperties, setSelectedProperties] = useState<PropertyOption[]>([])
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>(properties)
  const [copied, setCopied] = useState(false)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{ email: string; role: string; password: string } | null>(null)

  const [state, formAction, isPending] = useActionState(createUser, null)

  // Handle API errors via toast
  useEffect(() => {
    if (state && 'error' in state && state.error) {
      toast.error(state.error)
    }
    if (state && 'success' in state && state.success) {
      setSuccessData({ email: state.email, role: state.role, password: state.password })
      setShowSuccess(true)
    }
  }, [state])

  async function handleCreateProperty(name: string, address: string): Promise<PropertyOption> {
    const result = await createProperty(name, address)
    if ('error' in result) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    const newProp: PropertyOption = { name: result.name, streetAddress: result.streetAddress }
    setAvailableProperties((prev) =>
      [...prev, newProp].sort((a, b) => a.name.localeCompare(b.name))
    )
    return newProp
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const formData = new FormData(form)

    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName = (formData.get('last_name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const role = formData.get('role') as string

    const errors: Record<string, string> = {}
    if (!firstName) errors.first_name = 'First name is required'
    if (!lastName) errors.last_name = 'Last name is required'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email is required'
    if (!role) errors.role = 'Role is required'

    if (Object.keys(errors).length > 0) {
      e.preventDefault()
      setClientErrors(errors)
      return
    }

    setClientErrors({})
  }

  function handleCreateAnother() {
    setShowSuccess(false)
    setSuccessData(null)
    setSelectedProperties([])
    setCopied(false)
    setClientErrors({})
    setAvailableProperties(properties)
  }

  if (showSuccess && successData) {
    return (
      <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-6">
        <h2 className="text-lg font-heading font-bold text-emerald mb-4">User Created Successfully</h2>
        <div className="space-y-3">
          <div>
            <span className="text-text-secondary text-sm">Email:</span>{' '}
            <span className="font-medium">{successData.email}</span>
          </div>
          <div>
            <span className="text-text-secondary text-sm">Role:</span>{' '}
            <span className="font-medium">
              {ROLE_LABELS[successData.role as UserRole] ?? successData.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">Password:</span>
            <code className="bg-white border border-gray-200 rounded px-2 py-1 font-mono text-sm">
              {successData.password}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(successData.password)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Copy password"
            >
              {copied ? (
                <Check size={16} className="text-emerald" />
              ) : (
                <Copy size={16} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateAnother}
          className="mt-6 px-4 py-2 bg-emerald text-white rounded-xl text-sm font-medium hover:bg-emerald/90 transition-colors"
        >
          Create Another User
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-text-primary mb-1.5">
            First Name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald"
          />
          {clientErrors.first_name && (
            <p className="text-red-500 text-xs mt-1">{clientErrors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-text-primary mb-1.5">
            Last Name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald"
          />
          {clientErrors.last_name && (
            <p className="text-red-500 text-xs mt-1">{clientErrors.last_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald"
          />
          {clientErrors.email && (
            <p className="text-red-500 text-xs mt-1">{clientErrors.email}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-1.5">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald bg-white"
          >
            <option value="">Select a role...</option>
            <option value="pm">Property Manager</option>
            <option value="rm">Regional Manager</option>
            <option value="exec">Executive</option>
          </select>
          {clientErrors.role && (
            <p className="text-red-500 text-xs mt-1">{clientErrors.role}</p>
          )}
        </div>

        {/* Properties */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Properties
          </label>
          <PropertyMultiSelect
            properties={availableProperties}
            selected={selectedProperties}
            onChange={setSelectedProperties}
            mode="multi"
            onCreateProperty={handleCreateProperty}
            placeholder="Select properties..."
          />
          {/* Hidden inputs to include property names in FormData */}
          {selectedProperties.map((p) => (
            <input key={p.name} type="hidden" name="property_names" value={p.name} />
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-emerald text-white rounded-xl text-sm font-medium hover:bg-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating User...' : 'Create User'}
        </button>
      </div>
    </form>
  )
}
