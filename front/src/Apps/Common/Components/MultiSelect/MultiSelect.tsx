import React from "react";
import { MultiSelect } from "react-multi-select-component";
import {
  filter_type_select_option_placeholder,
  multi_select_select_all_label,
} from "../../wordings/dashboard/wordingsDashboard";

import "./multiSelect.scss";

const MultiSelectWrapper = ({ options, onChange, selected, disableSearch }) => {
  const valueRenderer = (selected: typeof options) => {
    if (!selected.length) {
      return filter_type_select_option_placeholder;
    }
    return selected.length === 1
      ? `${selected[0].label}`
      : selected.map(({ label }, i) =>
          i !== selected.length - 1 ? `${label}, ` : label
        );
  };

  return (
    <MultiSelect
      className="multi-select fr-select"
      options={options}
      value={selected}
      onChange={onChange}
      valueRenderer={valueRenderer}
      labelledBy={filter_type_select_option_placeholder}
      disableSearch={disableSearch}
      overrideStrings={{
        allItemsAreSelected: "",
        selectAll: multi_select_select_all_label,
      }}
    />
  );
};

export default MultiSelectWrapper;
