import React, { useState, useRef, useCallback, useEffect } from "react";
import { Filter, FiltersProps, FilterType } from "./filtersTypes";
import { filter_type_apply_btn } from "assets/wordings/dashboard/wordingsDashboard";
import FilterLine from "./FilterLine";

import "./filters.scss";
import { MAX_FILTER } from "Apps/Dashboard/dashboardUtils";

const Filters = ({ filters }: FiltersProps) => {
  const placeholderFilterRef = useRef<HTMLDivElement>(null);
  const [filterSelectedList, setFilterSelectedList] = useState<Filter[]>([]);

  // we can't select a filter twice
  const filterSelectedIds = filterSelectedList?.map(item => {
    return item.value;
  });
  const derivedFilters =
    filterSelectedIds.length > 0
      ? filters.filter(f => {
          return !filterSelectedIds.includes(f.value);
        })
      : filters;

  const onSelectFilterType = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const filter = derivedFilters.find(filter => filter.value === value);

      if (filter) {
        setFilterSelectedList(filterList => [...filterList, filter]);
        hidePlaceHolderFilter();
      }
    },
    [derivedFilters]
  );

  const onAddFilterType = useCallback(() => {
    // 5 filters max displayed
    if (filterSelectedList.length < MAX_FILTER) {
      showPlaceHolderFilter();
    }
  }, [filterSelectedList]);

  const onRemoveFilterType = useCallback(
    (e, value) => {
      if (!value && filterSelectedList.length) {
        hidePlaceHolderFilter();
      } else {
        setFilterSelectedList(filterList =>
          filterList.filter(f => f.value !== value)
        );
      }
    },
    [filterSelectedList]
  );

  const showPlaceHolderFilter = () => {
    if (placeholderFilterRef.current) {
      placeholderFilterRef.current.style.display = "block";
    }
  };

  const hidePlaceHolderFilter = () => {
    if (placeholderFilterRef.current) {
      placeholderFilterRef.current.style.display = "none";
    }
  };

  const displayFilterItem = (filter: Filter) => {
    if (filter?.type === FilterType.input) {
      return (
        <>
          <label className="fr-label" htmlFor={`${filter.value}_filter`}>
            {filter.label}
          </label>
          <input
            className="fr-input"
            type="text"
            id={`${filter.value}_filter`}
            name={`${filter.value}`}
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
            id={`${filter.value}_filter`}
            className="fr-select"
            value={filter.value} // array if multiple
            multiple={filter.isMultiple}
            //onChange={onChange}
          >
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
      showPlaceHolderFilter();
    }
  }, [filterSelectedList]);

  return (
    <div className="filters">
      {filterSelectedList.map(filter => {
        return (
          <React.Fragment key={`${filter.value}_filter`}>
            <FilterLine
              filters={filters}
              onAddFilterType={onAddFilterType}
              onRemoveFilterType={onRemoveFilterType}
              value={filter.value}
              disabledSelect={true}
            >
              {displayFilterItem(filter)}
            </FilterLine>
          </React.Fragment>
        );
      })}
      <div ref={placeholderFilterRef}>
        <FilterLine
          filters={derivedFilters}
          onChange={onSelectFilterType}
          onAddFilterType={onAddFilterType}
          onRemoveFilterType={onRemoveFilterType}
        />
      </div>
      <div className="filters__primary-cta">
        <button type="button" className="fr-btn">
          {filter_type_apply_btn}
        </button>
      </div>
    </div>
  );
};

export default React.memo(Filters);
