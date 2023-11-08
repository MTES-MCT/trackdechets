import React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { filter_type_select_placeholder } from "../../wordings/dashboard/wordingsDashboard";
import { FilterType } from "./filtersTypes";
import AdvancedFilters from "./AdvancedFilters";

describe("AdvancedFilters component", () => {
  const filters = [
    [
      {
        name: "filter1",
        label: "Filter 1",
        type: FilterType.input,
        isActive: true
      },
      {
        name: "filter2",
        label: "Filter 2",
        type: FilterType.select,
        options: [{ value: "option1", label: "option 1" }],
        isActive: true
      }
    ]
  ];

  afterEach(cleanup);

  it("renders the component", () => {
    const onApplyFilters = jest.fn();
    const { container } = render(
      <AdvancedFilters open filters={filters} onApplyFilters={onApplyFilters} />
    );
    expect(container).toBeTruthy();
  });

  it("displays the filter selector", () => {
    const onApplyFilters = jest.fn();
    const { getByText } = render(
      <AdvancedFilters open filters={filters} onApplyFilters={onApplyFilters} />
    );
    expect(getByText(filter_type_select_placeholder)).toBeTruthy();
  });

  it("can select a filter", () => {
    const onApplyFilters = jest.fn();
    const { getByText } = render(
      <AdvancedFilters open filters={filters} onApplyFilters={onApplyFilters} />
    );
    const addFilterButton = getByText("+");
    fireEvent.click(addFilterButton);
    const selectFilterOption = getByText(filters.flat()[0].label);
    fireEvent.click(selectFilterOption);
    expect(getByText(filters.flat()[0].label)).toBeTruthy();
  });
});
