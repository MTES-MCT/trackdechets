import React, { useEffect, useState } from "react";
import { FiltersProps } from "./filtersTypes";
import QuickFilters from "./QuickFilters";
import AdvancedFilters from "./AdvancedFilters";

import "./filters.scss";
import {
  advancedFilterList,
  quickFilterList
} from "../../../Dashboard/dashboardUtils";

const purgeEmptyValues = (obj: { [key: string]: string | string[] }) => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      return value === null || value === "" ? undefined : value;
    })
  );
};

const Filters = ({
  areAdvancedFiltersOpen = false,
  onApplyFilters
}: FiltersProps) => {
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [quickFilters, setQuickFilters] = useState({});

  const onApplyAdvancedFilters = filters => {
    setAdvancedFilters(filters);
  };

  const onApplyQuickFilters = filters => {
    setQuickFilters(filters);
  };

  useEffect(() => {
    const filters = purgeEmptyValues({
      ...advancedFilters,
      ...quickFilters
    });

    onApplyFilters(filters);
  }, [advancedFilters, onApplyFilters, quickFilters]);

  return (
    <div className="filters">
      <AdvancedFilters
        open={areAdvancedFiltersOpen}
        filters={advancedFilterList}
        onApplyFilters={onApplyAdvancedFilters}
      />

      <QuickFilters
        filters={quickFilterList}
        onApplyFilters={onApplyQuickFilters}
      />
    </div>
  );
};

export default React.memo(Filters);
