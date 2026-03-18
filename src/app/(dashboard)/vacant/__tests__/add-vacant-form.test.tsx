import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock addVacantUnits server action
const mockAddVacantUnits = vi.fn()
vi.mock('@/app/actions/vacant', () => ({
  addVacantUnits: (...args: unknown[]) => mockAddVacantUnits(...args),
}))

// Mock sonner toast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

import { AddVacantForm } from '../add-vacant-form'
import type { PropertyOption } from '@/components/ui/property-multi-select'
import { FLOOR_PLANS } from '@/components/ui/property-multi-select'

const testProperties: PropertyOption[] = [
  { name: 'Maple Apartments', streetAddress: '123 Main St' },
  { name: 'Oak Residences', streetAddress: '456 Oak Ave' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AddVacantForm', () => {
  /* UNIT-02: PropertyMultiSelect renders with provided properties */
  it('renders PropertyMultiSelect with provided properties', () => {
    render(<AddVacantForm properties={testProperties} />)
    // PropertyMultiSelect trigger renders with placeholder text
    expect(screen.getByText('Select a property...')).toBeInTheDocument()
  })

  /* UNIT-04: Renders one unit card by default and adds another on button click */
  it('renders one unit card by default and adds another on "Add Another Unit" click', () => {
    render(<AddVacantForm properties={testProperties} />)

    // Initially one unit number input
    const inputs = screen.getAllByPlaceholderText('e.g. 101')
    expect(inputs).toHaveLength(1)

    // Click "Add Another Unit"
    fireEvent.click(screen.getByText('+ Add Another Unit'))

    // Now two unit number inputs
    const inputsAfter = screen.getAllByPlaceholderText('e.g. 101')
    expect(inputsAfter).toHaveLength(2)
  })

  /* UNIT-04: Removes a unit card when remove button is clicked */
  it('removes a unit card when remove button is clicked', () => {
    render(<AddVacantForm properties={testProperties} />)

    // Add a second row first
    fireEvent.click(screen.getByText('+ Add Another Unit'))
    expect(screen.getAllByPlaceholderText('e.g. 101')).toHaveLength(2)

    // Remove buttons — find all remove buttons (aria-label containing "Remove unit")
    const removeButtons = screen.getAllByRole('button', { name: /Remove unit/i })
    // Click the first remove button
    fireEvent.click(removeButtons[0])

    // Back to one row
    expect(screen.getAllByPlaceholderText('e.g. 101')).toHaveLength(1)
  })

  /* UNIT-05: Renders all 7 FLOOR_PLANS values in floor plan dropdown */
  it('renders all 7 FLOOR_PLANS values in floor plan dropdown', () => {
    render(<AddVacantForm properties={testProperties} />)

    // Floor plan select options — find the select by looking for "Select floor plan" option
    const selects = screen.getAllByRole('combobox')
    // Should have at least one floor plan select
    const floorPlanSelect = selects[0]

    // Verify placeholder option
    expect(floorPlanSelect).toHaveTextContent('Select floor plan')

    // Verify all 7 FLOOR_PLANS values are present
    expect(FLOOR_PLANS).toHaveLength(7)
    for (const fp of FLOOR_PLANS) {
      const option = floorPlanSelect.querySelector(`option[value="${fp}"]`)
      expect(option).toBeInTheDocument()
      expect(option?.textContent).toBe(fp)
    }
  })

  /* UNIT-04: Shows validation errors on submit when unit number is empty */
  it('shows validation errors on submit when unit number is empty', async () => {
    render(<AddVacantForm properties={testProperties} />)

    // Select a property by clicking the trigger and checking a property
    fireEvent.click(screen.getByText('Select a property...'))
    await waitFor(() => {
      expect(screen.getByLabelText('Maple Apartments')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText('Maple Apartments'))

    // Select a floor plan (so validUnitCount > 0 and submit button is enabled)
    // but leave unit number empty
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '1br 1ba' } })

    // Submit button is now enabled (floor plan selected, but unit number still empty)
    // validUnitCount counts rows where BOTH unitNumber and floorPlan are filled
    // Since unit number is empty, validUnitCount === 0, so button is still disabled.
    // Instead, we need to fill unit number, select floor plan, add a second row,
    // and leave that second row's unit number empty to trigger per-row validation.
    // More reliably: call handleSubmit directly by using a workaround.
    // The cleanest test is to fill unitNumber first, then clear it on a second row.
    // Add second row with only floor plan filled — submit with first row complete:
    fireEvent.change(screen.getByPlaceholderText('e.g. 101'), { target: { value: '101' } })
    fireEvent.click(screen.getByText('+ Add Another Unit'))

    // Second row: fill floor plan but not unit number
    const allSelects = screen.getAllByRole('combobox')
    fireEvent.change(allSelects[1], { target: { value: '2br 1ba' } })

    // Now validUnitCount = 1 (only first row is complete), so button is enabled
    // Click submit — second row has empty unit number, should show error
    const submitButton = screen.getByRole('button', { name: 'Add 1 Vacant Unit' })
    fireEvent.click(submitButton)

    // Validation error on the second row
    await waitFor(() => {
      expect(screen.getByText('Unit number is required')).toBeInTheDocument()
    })
  })

  /* UNIT-02: Submit button shows 'Add 1 Vacant Unit' when one unit is fully filled */
  it("shows 'Add 1 Vacant Unit' when one unit row is fully filled", () => {
    render(<AddVacantForm properties={testProperties} />)

    // Initially disabled with "Add Vacant Units"
    const submitButton = screen.getByRole('button', { name: /Add Vacant Units/i })
    expect(submitButton).toBeDisabled()

    // Fill in unit number
    fireEvent.change(screen.getByPlaceholderText('e.g. 101'), { target: { value: '101' } })

    // Select floor plan
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '1br 1ba' } })

    // Button label should update
    expect(screen.getByRole('button', { name: 'Add 1 Vacant Unit' })).toBeEnabled()
  })

  /* Dynamic label: shows 'Add 2 Vacant Units' when two rows are fully filled */
  it("shows 'Add 2 Vacant Units' when two unit rows are fully filled", () => {
    render(<AddVacantForm properties={testProperties} />)

    // Fill in first row
    const firstInput = screen.getByPlaceholderText('e.g. 101')
    fireEvent.change(firstInput, { target: { value: '101' } })
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '1br 1ba' } })

    // Add second row
    fireEvent.click(screen.getByText('+ Add Another Unit'))

    // Fill in second row
    const allInputs = screen.getAllByPlaceholderText('e.g. 101')
    fireEvent.change(allInputs[1], { target: { value: '102' } })
    const allSelects = screen.getAllByRole('combobox')
    fireEvent.change(allSelects[1], { target: { value: '2br 1ba' } })

    // Button label should update to 2 units
    expect(screen.getByRole('button', { name: 'Add 2 Vacant Units' })).toBeEnabled()
  })

  /* UNIT-08: Shows street address below property selector when a property is selected */
  it('shows street address below property selector when a property is selected', async () => {
    render(<AddVacantForm properties={testProperties} />)

    // Open the dropdown and select Maple Apartments
    fireEvent.click(screen.getByText('Select a property...'))
    await waitFor(() => {
      expect(screen.getByLabelText('Maple Apartments')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText('Maple Apartments'))

    // Street address should appear
    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
    })
  })

  /* Shows "No properties" message when properties list is empty */
  it('shows empty state message when no properties are provided', () => {
    render(<AddVacantForm properties={[]} />)
    expect(
      screen.getByText(
        'No properties assigned to your account. Contact an admin to update your property access.'
      )
    ).toBeInTheDocument()
  })

  /* Single row cannot be removed */
  it('does not remove the last remaining unit card', () => {
    render(<AddVacantForm properties={testProperties} />)

    // Only one row — remove button should be disabled
    const removeButton = screen.getByRole('button', { name: /Remove unit/i })
    expect(removeButton).toBeDisabled()
  })
})
