import React from "react";
import { MultiSelect, Option } from "react-multi-select-component";
import { multi_select_select_all_label } from "../../wordings/dashboard/wordingsDashboard";

import "./multiSelect.scss";

interface MultiSelectWrapperProps {
  options: Option[];
  onChange: Function;
  selected: Option[];
  placeholder: string;
  showRendererText?: boolean;
  disableSearch?: boolean;
}
const MultiSelectWrapper = ({
  options,
  onChange,
  selected,
  placeholder,
  disableSearch,
  showRendererText = true
}: MultiSelectWrapperProps) => {
  const valueRenderer = (selected: typeof options) => {
    if (!selected.length || !showRendererText) {
      return placeholder;
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
      labelledBy={placeholder}
      disableSearch={disableSearch}
      overrideStrings={{
        allItemsAreSelected: "",
        selectAll: multi_select_select_all_label
      }}
    />
  );
};

export default MultiSelectWrapper;
