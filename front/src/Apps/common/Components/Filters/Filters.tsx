import React, { useState, useRef, useCallback, useEffect } from "react";
import { Filter, FiltersProps, FilterType } from "./filtersTypes";
import { filter_type_apply_btn } from "../../wordings/dashboard/wordingsDashboard";
import FilterLine from "./FilterLine";
import { MAX_FILTER } from "../../../Dashboard/dashboardUtils";
import Input from "../Input/Input";
import { inputType } from "../../types/commonTypes";
import Select from "../Select/Select";

import "./filters.scss";

const Filters = ({ filters, onApplyFilters }: FiltersProps) => {
  const placeholderFilterRef = useRef<HTMLDivElement>(null);
  const [filterSelectedList, setFilterSelectedList] = useState<Filter[]>([]);
  const [isApplyDisabled, setIsApplyDisabled] = useState<boolean>(true);
  const [filterValues, setFilterValues] = useState({});
  const [hasReachMaxFilter, setHasReachMaxFilter] = useState(false);
  const [hasRemovedFilterLine, setHasRemovedFilterLine] =
    useState<boolean>(false);
  const [selectMultipleValueArray, setSelectMultipleValueArray] = useState([]);

  const newInputElementRef = useRef<HTMLInputElement>(null);
  const newSelectElementRef = useRef<HTMLSelectElement>(null);

  // we can't select a filter twice
  const filterSelectedIds = filterSelectedList?.map(item => {
    return item.name;
  });
  const derivedFilters =
    filterSelectedIds.length > 0
      ? filters.map(filter => {
          if (filterSelectedIds.includes(filter.name)) {
            return { ...filter, isActive: false };
          }
          return filter;
        })
      : filters;

  const onSelectFilterType = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const filter = derivedFilters.find(filter => filter.name === value);

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
          filterList.filter(f => f.name !== value)
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

  const onFilterValueChange = (e, filterName) => {
    const { value } = e.target;
    const newFilterValues = { ...filterValues };
    if (!newFilterValues[filterName] || newFilterValues[filterName] !== value) {
      newFilterValues[filterName] = value;
      setFilterValues(newFilterValues);
      setIsApplyDisabled(false);
    } else {
      setIsApplyDisabled(true);
    }
  };
  const onFilterSelectMultipleValueChange = (selectList, filterName) => {
    setSelectMultipleValueArray(selectList);
    const newFilterValues = { ...filterValues };
    newFilterValues[filterName] = selectList.map(selected => selected.value);
    setFilterValues(newFilterValues);
    if (selectList.length) {
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
        <Input
          ref={newInputElementRef}
          type={inputType.text}
          id={`${filter.name}_filter`}
          label={filter.label}
          name={filter.name}
          onChange={e => onFilterValueChange(e, filter.name)}
        />
      );
    }

    if (filter?.type === FilterType.select) {
      return (
        <Select
          ref={newSelectElementRef}
          id={`${filter.name}_filter`}
          onChange={e =>
            !filter.isMultiple
              ? onFilterValueChange(e, filter.name)
              : onFilterSelectMultipleValueChange(e, filter.name)
          }
          defaultValue=""
          label={filter.label}
          isMultiple={filter.isMultiple}
          options={filter.options!}
          selected={selectMultipleValueArray}
          disableSearch={filter.isMultiple}
        />
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
          <React.Fragment key={`${filter.name}_filter`}>
            <FilterLine
              filters={derivedFilters}
              onAddFilterType={onAddFilterType}
              onRemoveFilterType={onRemoveFilterType}
              value={filter.name}
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
