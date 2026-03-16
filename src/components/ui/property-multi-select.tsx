'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PropertyOption {
  name: string
  streetAddress: string
}

export interface PropertyMultiSelectProps {
  properties: PropertyOption[]
  selected: PropertyOption[]
  onChange: (selected: PropertyOption[]) => void
  mode?: 'single' | 'multi'
  onCreateProperty?: (name: string, address: string) => Promise<PropertyOption>
  placeholder?: string
}

export function PropertyMultiSelect({
  properties,
  selected,
  onChange,
  mode = 'multi',
  onCreateProperty,
  placeholder = 'Select properties',
}: PropertyMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Click-outside handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function isSelected(prop: PropertyOption) {
    return selected.some((s) => s.name === prop.name && s.streetAddress === prop.streetAddress)
  }

  function toggle(prop: PropertyOption) {
    if (isSelected(prop)) {
      onChange(selected.filter((s) => s.name !== prop.name || s.streetAddress !== prop.streetAddress))
    } else {
      if (mode === 'single') {
        onChange([prop])
      } else {
        onChange([...selected, prop])
      }
    }
  }

  function remove(prop: PropertyOption) {
    onChange(selected.filter((s) => s.name !== prop.name || s.streetAddress !== prop.streetAddress))
  }

  async function handleCreate() {
    if (!onCreateProperty || !newName.trim()) return
    setSaving(true)
    try {
      const created = await onCreateProperty(newName.trim(), newAddress.trim())
      if (mode === 'single') {
        onChange([created])
      } else {
        onChange([...selected, created])
      }
      setNewName('')
      setNewAddress('')
      setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  // Build trigger label
  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0].name
        : `${selected.length} properties selected`

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'bg-card border border-gray-200 rounded-xl px-3 py-2 text-sm text-left',
          'hover:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent',
          'transition-colors',
          selected.length === 0 ? 'text-text-secondary' : 'text-text-primary'
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-text-secondary shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Chips — always visible when selections exist */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((prop) => (
            <span
              key={`${prop.name}-${prop.streetAddress}`}
              className="bg-emerald/10 text-emerald border border-emerald/20 rounded-lg px-2 py-1 text-sm flex items-center gap-1"
            >
              {prop.name}
              <button
                type="button"
                aria-label={`Remove ${prop.name}`}
                onClick={() => remove(prop)}
                className="hover:text-emerald-dark focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search input */}
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-100 text-sm focus:outline-none rounded-t-xl"
            autoFocus
          />

          {/* Property list */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredProperties.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-secondary">No properties found</p>
            ) : (
              filteredProperties.map((prop) => {
                const checked = isSelected(prop)
                return (
                  <label
                    key={`${prop.name}-${prop.streetAddress}`}
                    role="option"
                    aria-selected={checked}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors',
                      'hover:bg-surface',
                      checked && 'text-emerald'
                    )}
                  >
                    <input
                      type="checkbox"
                      role="checkbox"
                      aria-label={prop.name}
                      checked={checked}
                      onChange={() => toggle(prop)}
                      className="accent-emerald"
                    />
                    <span className="flex-1 truncate">{prop.name}</span>
                  </label>
                )
              })
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Create new property section */}
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors rounded-b-xl"
            >
              <Plus size={14} />
              Create new property
            </button>
          ) : (
            <div className="p-3 space-y-2">
              <input
                type="text"
                placeholder="Property name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-badge text-sm focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Street address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-badge text-sm focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setNewName('')
                    setNewAddress('')
                  }}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !newName.trim()}
                  className={cn(
                    'px-3 py-1.5 text-sm bg-emerald text-white rounded-pill transition-colors',
                    'hover:bg-emerald-dark disabled:opacity-50 disabled:pointer-events-none'
                  )}
                >
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
