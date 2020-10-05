import { Form } from "src/generated/graphql/types";
import { useState, useEffect } from "react";

function getKey(object: any, key: string) {
  const splittedKey = key.split(".");
  return splittedKey.reduce((prev, curr) => prev && prev[curr], object) || "";
}

function compareBy(key: string) {
  return function(a: any, b: any) {
    if (getKey(a, key) < getKey(b, key)) return -1;
    if (getKey(a, key) > getKey(b, key)) return 1;
    return 0;
  };
}

const ASC = "ASC";
const DSC = "DSC";
const nextOrder = { ASC: DSC, DSC: ASC };

export function useFormsTable(
  inputForms: Form[]
): [
  Form[],
  { key: string; order: string },
  (k: string) => void,
  (k: string, v: string) => void
] {
  const [forms, setForms] = useState(inputForms);
  const [sortParams, setSortParams] = useState({ key: "", order: DSC }); // handle sort key and order in an object

  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => setForms(inputForms), [inputForms]);

  function sortBy(key: string) {
    const sortedForms = [...forms];

    const order = sortParams.key === key ? nextOrder[sortParams.order] : ASC;

    sortedForms.sort(compareBy(key));
    if (order === DSC) {
      sortedForms.reverse();
    }

    setSortParams({ key: key, order: order });

    setForms(sortedForms);
  }

  function filter(key: string, value: string) {
    const newFilters = filters.filter(f => f.key !== key && f.value);
    newFilters.push({ key, value });

    const newForms = inputForms.filter(f =>
      newFilters.every(
        filter =>
          getKey(f, filter.key)
            .toLowerCase()
            .indexOf(filter.value.toLowerCase()) > -1
      )
    );
    setFilters(newFilters);
    setForms(newForms);
  }

  return [forms, sortParams, sortBy, filter];
}
