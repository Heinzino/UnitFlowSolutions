import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyMultiSelect, PropertyOption, FLOOR_PLANS } from "../property-multi-select";

const testProperties: PropertyOption[] = [
  { name: "The Reserve", streetAddress: "123 Main St" },
  { name: "Oakwood Apartments", streetAddress: "456 Oak Ave" },
];

/* ─── Rendering ─────────────────────────────────────────────────── */
describe("PropertyMultiSelect - rendering", () => {
  it("renders all property options when dropdown is open", async () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    // Open the dropdown
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    expect(screen.getByText("The Reserve")).toBeInTheDocument();
    expect(screen.getByText("Oakwood Apartments")).toBeInTheDocument();
  });

  it("shows placeholder text when nothing is selected", () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
        placeholder="Select properties"
      />
    );
    expect(screen.getByText("Select properties")).toBeInTheDocument();
  });
});

/* ─── Search / Filter ───────────────────────────────────────────── */
describe("PropertyMultiSelect - search", () => {
  it("filters options when typing in search input (case insensitive)", async () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    // Open dropdown
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    // Type in search
    const searchInput = screen.getByPlaceholderText("Search properties...");
    await userEvent.type(searchInput, "reserve");

    expect(screen.getByText("The Reserve")).toBeInTheDocument();
    expect(screen.queryByText("Oakwood Apartments")).not.toBeInTheDocument();
  });

  it("shows all options when search is cleared", async () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Search properties...");
    await userEvent.type(searchInput, "oak");
    expect(screen.queryByText("The Reserve")).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    expect(screen.getByText("The Reserve")).toBeInTheDocument();
    expect(screen.getByText("Oakwood Apartments")).toBeInTheDocument();
  });
});

/* ─── Multi-select ──────────────────────────────────────────────── */
describe("PropertyMultiSelect - multi-select mode", () => {
  it("clicking a property checkbox calls onChange with that property added", async () => {
    const onChange = vi.fn();
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={onChange}
      />
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    const checkbox = screen.getByRole("checkbox", { name: "The Reserve" });
    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith([testProperties[0]]);
  });

  it("clicking an already-selected checkbox calls onChange with that property removed", async () => {
    const onChange = vi.fn();
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[testProperties[0]]}
        onChange={onChange}
      />
    );
    // The trigger has aria-expanded, so use that to distinguish it from chip buttons
    const trigger = screen.getAllByRole("button", { name: /The Reserve/i })[0];
    await userEvent.click(trigger);

    const checkbox = screen.getByRole("checkbox", { name: "The Reserve" });
    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});

/* ─── Chips ─────────────────────────────────────────────────────── */
describe("PropertyMultiSelect - chips", () => {
  it("displays selected properties as chips", () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[testProperties[0]]}
        onChange={vi.fn()}
      />
    );
    // The chip's remove button has aria-label "Remove The Reserve"
    expect(screen.getByRole("button", { name: /remove the reserve/i })).toBeInTheDocument();
  });

  it("clicking remove (x) on a chip calls onChange with that property removed", async () => {
    const onChange = vi.fn();
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[testProperties[0], testProperties[1]]}
        onChange={onChange}
      />
    );
    const removeBtn = screen.getByRole("button", { name: /remove the reserve/i });
    await userEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith([testProperties[1]]);
  });
});

/* ─── Single-select mode ────────────────────────────────────────── */
describe("PropertyMultiSelect - single mode", () => {
  it("in single mode, selecting a new property replaces the previous selection", async () => {
    const onChange = vi.fn();
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[testProperties[0]]}
        onChange={onChange}
        mode="single"
      />
    );
    // The trigger has aria-expanded, so use that to distinguish it from chip buttons
    const trigger = screen.getAllByRole("button", { name: /The Reserve/i })[0];
    await userEvent.click(trigger);

    const checkbox = screen.getByRole("checkbox", { name: "Oakwood Apartments" });
    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith([testProperties[1]]);
  });
});

/* ─── Inline create panel ───────────────────────────────────────── */
describe("PropertyMultiSelect - inline create", () => {
  it("Create new property button is visible at bottom of dropdown", async () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    expect(screen.getByRole("button", { name: /create new property/i })).toBeInTheDocument();
  });

  it("clicking Create new property shows name, street address, unit number, and floor plan fields", async () => {
    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={vi.fn()}
      />
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    await userEvent.click(screen.getByRole("button", { name: /create new property/i }));

    expect(screen.getByPlaceholderText("Property name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Street address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Vacant unit number")).toBeInTheDocument();
    expect(screen.getByText("Select floor plan...")).toBeInTheDocument();
  });

  it("calls onCreateProperty with full object and adds result to selected on Add click", async () => {
    const newProperty: PropertyOption = { name: "New Place", streetAddress: "789 New St" };
    const onCreateProperty = vi.fn().mockResolvedValue(newProperty);
    const onChange = vi.fn();

    render(
      <PropertyMultiSelect
        properties={testProperties}
        selected={[]}
        onChange={onChange}
        onCreateProperty={onCreateProperty}
      />
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    await userEvent.click(screen.getByRole("button", { name: /create new property/i }));
    await userEvent.type(screen.getByPlaceholderText("Property name"), "New Place");
    await userEvent.type(screen.getByPlaceholderText("Street address"), "789 New St");
    await userEvent.type(screen.getByPlaceholderText("Vacant unit number"), "101");

    // Select a floor plan from the dropdown
    const floorPlanSelect = screen.getByDisplayValue("Select floor plan...");
    await userEvent.selectOptions(floorPlanSelect, FLOOR_PLANS[1]); // '1br 1ba'

    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(onCreateProperty).toHaveBeenCalledWith({
        name: "New Place",
        streetAddress: "789 New St",
        unitNumber: "101",
        floorPlan: FLOOR_PLANS[1],
      });
      expect(onChange).toHaveBeenCalledWith([newProperty]);
    });
  });
});

/* ─── Click outside ─────────────────────────────────────────────── */
describe("PropertyMultiSelect - click outside", () => {
  it("clicking outside the dropdown closes it", async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <PropertyMultiSelect
          properties={testProperties}
          selected={[]}
          onChange={vi.fn()}
        />
      </div>
    );
    const trigger = screen.getByRole("button", { name: /select properties/i });
    await userEvent.click(trigger);

    // Dropdown should be visible
    expect(screen.getByPlaceholderText("Search properties...")).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(screen.queryByPlaceholderText("Search properties...")).not.toBeInTheDocument();
  });
});
