import React from "react";
import {
  IconTriangleUpAndDown,
  IconTriangleDown,
  IconTriangleUp,
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
        return IconTriangleUp;
      }
      if (sortParams.order === "DSC") {
        return IconTriangleDown;
      }
    }
    return IconTriangleUpAndDown;
  };
  const Icon = getIcon(sortParams);
  return (
    <th onClick={() => sortFunc(fieldName)}>
      <div>
        <span>{caption}</span>
        <Icon size="16px" />
      </div>
    </th>
  );
}
