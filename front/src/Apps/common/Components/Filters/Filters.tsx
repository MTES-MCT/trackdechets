import React, { useEffect, useState } from "react";
import { FiltersProps } from "./filtersTypes";
import QuickFilters from "./QuickFilters";
import AdvancedFilters from "./AdvancedFilters";

import "./filters.scss";
import {
  advancedFilterList,
  quickFilterList,
} from "Apps/Dashboard/dashboardUtils";

const purgeEmptyValues = (obj: { [key: string]: string | string[] }) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== "" && v.length)
  );
};

const Filters = ({
  areAdvancedFiltersOpen = false,
  onApplyFilters,
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
      ...quickFilters,
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
