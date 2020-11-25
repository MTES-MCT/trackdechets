import React from "react";
import {
  TriangleUpIconAndDown,
  TriangleDownIcon,
  TriangleUpIcon,
} from "common/components/Icons";

export default function SortControl({
  sortFunc,
  fieldName,
  sortParams,
  caption,
}) {
  const getIcon = sortParams => {
    if (sortParams.key === fieldName) {
      if (sortParams.order === "ASC") {
        return TriangleUpIcon;
      }
      if (sortParams.order === "DSC") {
        return TriangleDownIcon;
      }
    }
    return TriangleUpIconAndDown;
  };
  const Icon = getIcon(sortParams);
  return (
    <th className="sortable" onClick={() => sortFunc(fieldName)}>
      <div className="sortControl">
        <span>{caption}</span>
        <Icon size={16} color="#000" />
      </div>
    </th>
  );
}
