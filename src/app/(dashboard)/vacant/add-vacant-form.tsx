'use client'

import { useState } from 'react'
import { PropertyMultiSelect, FLOOR_PLANS } from '@/components/ui/property-multi-select'
import type { PropertyOption, NewPropertyData } from '@/components/ui/property-multi-select'
import { addVacantUnits } from '@/app/actions/vacant'
import type { AddVacantUnitsResult } from '@/app/actions/vacant'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'

interface AddVacantFormProps {
  properties: PropertyOption[]
}

interface UnitRow {
  id: string
  unitNumber: string
  floorPlan: string
  unitNumberError: boolean
  floorPlanError: boolean
  duplicateWarning: boolean
}

function emptyRow(): UnitRow {
  return {
    id: crypto.randomUUID(),
    unitNumber: '',
    floorPlan: '',
    unitNumberError: false,
    floorPlanError: false,
    duplicateWarning: false,
  }
}

export function AddVacantForm({ properties }: AddVacantFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption[]>([])
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>(properties)
  const [streetAddress, setStreetAddress] = useState('')
  const [rows, setRows] = useState<UnitRow[]>([emptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    property: string
    created: { unitNumber: string; floorPlan: string }[]
    failed?: { unitNumber: string; floorPlan: string; error?: string }[]
  } | null>(null)
  const [propertyError, setPropertyError] = useState(false)

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(id: string) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRow(id: string, field: 'unitNumber' | 'floorPlan', value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: value,
              unitNumberError: field === 'unitNumber' ? false : r.unitNumberError,
              floorPlanError: field === 'floorPlan' ? false : r.floorPlanError,
            }
          : r
      )
    )
  }

  async function handleCreateProperty(data: NewPropertyData): Promise<PropertyOption> {
    const result = await addVacantUnits(data.name, data.streetAddress, [
      { unitNumber: data.unitNumber, floorPlan: data.floorPlan },
    ])
    if ('error' in result) {
      toast.error(result.error)
      return { name: data.name, streetAddress: data.streetAddress }
    }
    if (result.failed.length > 0) {
      toast.error(result.failed[0]?.error ?? 'Failed to create property')
      return { name: data.name, streetAddress: data.streetAddress }
    }
    const newProp: PropertyOption = { name: data.name, streetAddress: data.streetAddress }
    setAvailableProperties((prev) =>
      [...prev, newProp].sort((a, b) => a.name.localeCompare(b.name))
    )
    toast.success(`Created ${data.name} with unit ${data.unitNumber}`)
    return newProp
  }

  async function handleSubmit() {
    // 1. Property required
    if (selectedProperty.length === 0) {
      setPropertyError(true)
      return
    }

    // 2. Validate each row
    let hasErrors = false
    const unitNumbers = rows.map((r) => r.unitNumber.trim())
    const validatedRows = rows.map((r) => {
      const unitNumberError = !r.unitNumber.trim()
      const floorPlanError = !r.floorPlan
      const count = unitNumbers.filter((n) => n === r.unitNumber.trim() && n !== '').length
      const duplicateWarning = count > 1 && r.unitNumber.trim() !== ''
      if (unitNumberError || floorPlanError) hasErrors = true
      return { ...r, unitNumberError, floorPlanError, duplicateWarning }
    })
    setRows(validatedRows)
    if (hasErrors) return

    // 3. Call server action
    setSubmitting(true)
    const prop = selectedProperty[0]
    const result = await addVacantUnits(
      prop.name,
      streetAddress,
      rows.map((r) => ({ unitNumber: r.unitNumber.trim(), floorPlan: r.floorPlan }))
    )
    setSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    // 4. Handle result
    if (result.failed.length === 0) {
      // Full success
      setSuccessData({ property: prop.name, created: result.created })
      setShowSuccess(true)
    } else if (result.created.length > 0) {
      // Partial success — show card, pre-populate failed rows
      setSuccessData({ property: prop.name, created: result.created, failed: result.failed })
      setShowSuccess(true)
      setRows(
        result.failed.map((f) => ({ ...emptyRow(), unitNumber: f.unitNumber, floorPlan: f.floorPlan }))
      )
    } else {
      // All failed — toast the first error
      toast.error(result.failed[0]?.error ?? 'Failed to add units. Please try again.')
    }
  }

  function handleAddMore() {
    if (successData?.failed && successData.failed.length > 0) {
      // Partial failure: rows already set to failed units, just hide success card
      setShowSuccess(false)
      setSuccessData(null)
    } else {
      // Full success: reset rows to one empty row
      setShowSuccess(false)
      setSuccessData(null)
      setRows([emptyRow()])
    }
  }

  // Dynamic submit button label
  const validUnitCount = rows.filter((r) => r.unitNumber.trim() && r.floorPlan).length
  const buttonLabel = submitting
    ? 'Adding units...'
    : validUnitCount === 0
      ? 'Add Off Market Units'
      : validUnitCount === 1
        ? 'Add 1 Off Market Unit'
        : `Add ${validUnitCount} Off Market Units`
  const buttonDisabled = submitting || validUnitCount === 0

  // Success card
  if (showSuccess && successData) {
    return (
      <div className="bg-card rounded-card shadow-sm border border-card-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center">
            <Check size={16} className="text-emerald" />
          </div>
          <h2 className="text-lg font-heading font-bold text-text-primary">
            {successData.created.length} Off Market Unit
            {successData.created.length !== 1 ? 's' : ''} Added to {successData.property}
          </h2>
        </div>
        <ul className="text-sm text-text-primary pl-4 list-disc space-y-1">
          {successData.created.map((u) => (
            <li key={u.unitNumber}>
              {u.unitNumber} — {u.floorPlan}
            </li>
          ))}
        </ul>
        {/* Partial failure section */}
        {successData.failed && successData.failed.length > 0 && (
          <div className="bg-alert-past-target rounded-card p-3 mt-4">
            <p className="text-sm font-medium text-negative mb-1">
              The following units could not be added:
            </p>
            <ul className="text-sm text-text-primary pl-4 list-disc space-y-1">
              {successData.failed.map((f) => (
                <li key={f.unitNumber}>
                  {f.unitNumber} — {f.floorPlan}: {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={handleAddMore}
          className="mt-6 w-full py-2.5 bg-emerald text-white rounded-pill text-sm font-medium hover:bg-emerald/90 transition-colors"
        >
          Add More Units
        </button>
      </div>
    )
  }

  // Empty property list state (PM with no assigned properties)
  if (properties.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No properties assigned to your account. Contact an admin to update your property access.
      </p>
    )
  }

  return (
    <div className="bg-card rounded-card shadow-sm border border-card-border p-6 space-y-5">
      {/* Property selector */}
      <div>
        <label className="block text-sm font-bold text-text-primary mb-1.5">Property</label>
        <PropertyMultiSelect
          properties={availableProperties}
          selected={selectedProperty}
          onChange={(sel) => {
            setSelectedProperty(sel)
            setPropertyError(false)
            if (sel.length > 0) setStreetAddress(sel[0].streetAddress)
            else setStreetAddress('')
          }}
          mode="single"
          onCreateProperty={handleCreateProperty}
          placeholder="Select a property..."
        />
        {/* Street address auto-fill display */}
        {selectedProperty.length > 0 && streetAddress && (
          <p className="text-sm text-text-secondary mt-1">{streetAddress}</p>
        )}
        {propertyError && (
          <p className="text-sm text-negative mt-1">Please select a property</p>
        )}
      </div>

      {/* Unit rows */}
      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="border border-card-border rounded-card p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Unit number */}
              <div className="flex-1 w-full">
                <label
                  htmlFor={`unit-number-${row.id}`}
                  className="block text-sm font-bold text-text-primary mb-1.5"
                >
                  Unit Number
                </label>
                <input
                  id={`unit-number-${row.id}`}
                  type="text"
                  placeholder="e.g. 101"
                  value={row.unitNumber}
                  onChange={(e) => updateRow(row.id, 'unitNumber', e.target.value)}
                  disabled={submitting}
                  className={`w-full px-3 py-2 bg-card border rounded-badge text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    row.unitNumberError
                      ? 'border-negative'
                      : row.duplicateWarning
                        ? 'border-status-blocked'
                        : 'border-gray-200'
                  }`}
                />
                {row.unitNumberError && (
                  <p className="text-sm text-negative mt-1">Unit number is required</p>
                )}
                {row.duplicateWarning && !row.unitNumberError && (
                  <p className="text-sm text-status-blocked mt-1">Duplicate unit number</p>
                )}
              </div>

              {/* Floor plan */}
              <div className="flex-1 w-full">
                <label
                  htmlFor={`floor-plan-${row.id}`}
                  className="block text-sm font-bold text-text-primary mb-1.5"
                >
                  Floor Plan
                </label>
                <select
                  id={`floor-plan-${row.id}`}
                  value={row.floorPlan}
                  onChange={(e) => updateRow(row.id, 'floorPlan', e.target.value)}
                  disabled={submitting}
                  className={`w-full px-3 py-2 bg-card border rounded-badge text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    row.floorPlanError ? 'border-negative' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select floor plan</option>
                  {FLOOR_PLANS.map((fp) => (
                    <option key={fp} value={fp}>
                      {fp}
                    </option>
                  ))}
                </select>
                {row.floorPlanError && (
                  <p className="text-sm text-negative mt-1">Floor plan is required</p>
                )}
              </div>

              {/* Remove button */}
              <div className="sm:pt-7">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={submitting || rows.length <= 1}
                  aria-label={
                    row.unitNumber ? `Remove unit ${row.unitNumber}` : `Remove unit row`
                  }
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-text-secondary hover:text-negative transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Another Unit button */}
      <button
        type="button"
        onClick={addRow}
        disabled={submitting}
        className="w-full py-2.5 border border-emerald text-emerald rounded-pill text-sm font-medium hover:bg-emerald/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Add Another Unit
      </button>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={buttonDisabled}
        className="w-full py-2.5 bg-emerald text-white rounded-pill text-sm font-medium hover:bg-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
