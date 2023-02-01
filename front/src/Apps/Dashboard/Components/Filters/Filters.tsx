import React, { useState, useRef, useCallback, useEffect } from "react";
import { Filter, FiltersProps, FilterType } from "./filtersTypes";
import {
  filter_type_apply_btn,
  filter_type_select_option_placeholder,
} from "../../../../assets/wordings/dashboard/wordingsDashboard";
import FilterLine from "./FilterLine";
import { MAX_FILTER } from "../../dashboardUtils";

import "./filters.scss";

const Filters = ({ filters, onApplyFilters }: FiltersProps) => {
  const placeholderFilterRef = useRef<HTMLDivElement>(null);
  const [filterSelectedList, setFilterSelectedList] = useState<Filter[]>([]);
  const [isApplyDisabled, setIsApplyDisabled] = useState<boolean>(true);
  const [filterValues, setFilterValues] = useState({});
  const [hasReachMaxFilter, setHasReachMaxFilter] = useState(false);
  const [hasRemovedFilterLine, setHasRemovedFilterLine] =
    useState<boolean>(false);

  const newInputElementRef = useRef<HTMLInputElement>(null);
  const newSelectElementRef = useRef<HTMLSelectElement>(null);

  // we can't select a filter twice
  const filterSelectedIds = filterSelectedList?.map(item => {
    return item.value;
  });
  const derivedFilters =
    filterSelectedIds.length > 0
      ? filters.map(filter => {
          if (filterSelectedIds.includes(filter.value)) {
            return { ...filter, isActive: false };
          }
          return filter;
        })
      : filters;

  const onSelectFilterType = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const filter = derivedFilters.find(filter => filter.value === value);

      if (filter) {
        setFilterSelectedList(filterList => [...filterList, filter]);
        hideFilterSelector();
      }
    },
    [derivedFilters]
  );

  const onAddFilterType = useCallback(() => {
    // 5 filters max displayed
    if (filterSelectedList.length < MAX_FILTER) {
      showFilterSelector();
    }
    setHasRemovedFilterLine(false);
  }, [filterSelectedList]);

  const onRemoveFilterType = useCallback(
    (e, value) => {
      if (!filterSelectedList.length) {
        // keep filter selector visible
        return;
      }
      if (filterSelectedList.length && !value) {
        hideFilterSelector();
      } else {
        // remove from filter selected list
        setFilterSelectedList(filterList =>
          filterList.filter(f => f.value !== value)
        );

        // remove from filter values
        const newFilterValues = { ...filterValues };
        delete newFilterValues[value];
        setFilterValues(newFilterValues);
        setHasRemovedFilterLine(true);
      }
    },
    [filterSelectedList, filterValues]
  );

  const showFilterSelector = () => {
    if (placeholderFilterRef.current) {
      placeholderFilterRef.current.style.display = "block";
    }
  };

  const hideFilterSelector = () => {
    if (placeholderFilterRef.current) {
      placeholderFilterRef.current.style.display = "none";
    }
  };

  const onFilterValueChange = (e, filterType) => {
    const { value } = e.target;
    const newFilterValues = { ...filterValues };
    if (!newFilterValues[filterType] || newFilterValues[filterType] !== value) {
      newFilterValues[filterType] = value;
      setFilterValues(newFilterValues);
      setIsApplyDisabled(false);
    } else {
      setIsApplyDisabled(true);
    }
  };

  const onApply = () => {
    onApplyFilters(filterValues);
    setIsApplyDisabled(true);
  };

  const displayFilterItem = (filter: Filter) => {
    if (filter?.type === FilterType.input) {
      return (
        <>
          <label className="fr-label" htmlFor={`${filter.value}_filter`}>
            {filter.label}
          </label>
          <input
            ref={newInputElementRef}
            className="fr-input"
            type="text"
            id={`${filter.value}_filter`}
            name={`${filter.value}`}
            onChange={e => onFilterValueChange(e, filter.value)}
          ></input>
        </>
      );
    }

    if (filter?.type === FilterType.select) {
      return (
        <div className="fr-select-group">
          <label className="fr-label" htmlFor={`${filter.value}_filter`}>
            {filter.label}
          </label>
          <select
            ref={newSelectElementRef}
            id={`${filter.value}_filter`}
            className="fr-select"
            onChange={e => onFilterValueChange(e, filter.value)}
            defaultValue=""
          >
            <option value="" disabled hidden>
              {filter_type_select_option_placeholder}
            </option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
  };

  useEffect(() => {
    if (!filterSelectedList.length) {
      showFilterSelector();
    }

    if (filterSelectedList.length < MAX_FILTER) {
      setHasReachMaxFilter(false);
    } else {
      setHasReachMaxFilter(true);
    }

    if (newInputElementRef.current) {
      newInputElementRef.current.focus();
    }

    if (newSelectElementRef.current) {
      newSelectElementRef.current.focus();
    }
  }, [filterSelectedList]);

  useEffect(() => {
    if (hasRemovedFilterLine && Object.keys(filterValues).length > 0) {
      setIsApplyDisabled(false);
    }
  }, [filterValues, hasRemovedFilterLine]);

  return (
    <div className="filters">
      {filterSelectedList.map((filter, i) => {
        return (
          <React.Fragment key={`${filter.value}_filter`}>
            <FilterLine
              filters={derivedFilters}
              onAddFilterType={onAddFilterType}
              onRemoveFilterType={onRemoveFilterType}
              value={filter.value}
              disabledSelect={true}
              isMaxLine={hasReachMaxFilter}
              isCurrentLine={i === filterSelectedList.length - 1}
            >
              {displayFilterItem(filter)}
            </FilterLine>
          </React.Fragment>
        );
      })}
      {/* filter selector */}
      <div ref={placeholderFilterRef}>
        <FilterLine
          filters={derivedFilters}
          onChange={onSelectFilterType}
          onAddFilterType={onAddFilterType}
          onRemoveFilterType={onRemoveFilterType}
          isMaxLine={hasReachMaxFilter}
          isCurrentLine
        />
      </div>
      <div className="filters__primary-cta">
        <button
          type="button"
          className="fr-btn"
          onClick={onApply}
          disabled={isApplyDisabled}
        >
          {filter_type_apply_btn}
        </button>
      </div>
    </div>
  );
};

export default React.memo(Filters);
