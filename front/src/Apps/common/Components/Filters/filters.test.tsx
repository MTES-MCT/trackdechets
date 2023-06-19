import React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import Filters from "./Filters";
import {
  filter_type_apply_btn,
  filter_type_select_placeholder,
} from "Apps/common/wordings/dashboard/wordingsDashboard";
import { FilterType } from "./filtersTypes";

describe("Filters component", () => {
  const filters = [
    {
      name: "filter1",
      label: "Filter 1",
      type: FilterType.input,
      isActive: true,
    },
    {
      name: "filter2",
      label: "Filter 2",
      type: FilterType.select,
      options: [{ value: "option1", label: "option 1" }],
      isActive: true,
    },
  ];

  afterEach(cleanup);

  it("renders the component", () => {
    const onApplyFilters = jest.fn();
    const { container } = render(
      <Filters filters={filters} onApplyFilters={onApplyFilters} />
    );
    expect(container).toBeTruthy();
  });

  it("displays the filter selector", () => {
    const onApplyFilters = jest.fn();
    const { getByText } = render(
      <Filters filters={filters} onApplyFilters={onApplyFilters} />
    );
    expect(getByText(filter_type_select_placeholder)).toBeTruthy();
  });

  it("can select a filter", () => {
    const onApplyFilters = jest.fn();
    const { getByText } = render(
      <Filters filters={filters} onApplyFilters={onApplyFilters} />
    );
    const addFilterButton = getByText("+");
    fireEvent.click(addFilterButton);
    const selectFilterOption = getByText(filters[0].label);
    fireEvent.click(selectFilterOption);
    expect(getByText(filters[0].label)).toBeTruthy();
  });

  it("disables the apply button if no filter value is entered", () => {
    const onApplyFilters = jest.fn();
    const { getByText } = render(
      <Filters filters={filters} onApplyFilters={onApplyFilters} />
    );
    const addFilterButton = getByText("+");
    fireEvent.click(addFilterButton);
    const selectFilterOption = getByText(filters[0].label);
    fireEvent.click(selectFilterOption);
    const applyButton = getByText(filter_type_apply_btn);
    expect(applyButton).toBeDisabled();
  });
});
