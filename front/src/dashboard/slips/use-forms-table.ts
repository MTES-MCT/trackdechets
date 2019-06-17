import { Form } from "../../form/model";
import { useState, useEffect } from "react";

function getKey(object: any, key: string) {
  const splittedKey = key.split(".");
  return splittedKey.reduce((prev, curr) => prev && prev[curr], object);
}

function compareBy(key: string) {
  return function(a: any, b: any) {
    if (getKey(a, key) < getKey(b, key)) return -1;
    if (getKey(a, key) > getKey(b, key)) return 1;
    return 0;
  };
}

export function useFormsTable(
  inputForms: Form[]
): [Form[], (k: string) => void, (k: string, v: string) => void] {
  const [forms, setForms] = useState(inputForms);
  useEffect(() => setForms(inputForms));

  const [sortKey, setSortKey] = useState("");
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);

  function sortBy(key: string) {
    const sortedForms = [...forms];
    if (sortKey === key) sortedForms.reverse();
    else sortedForms.sort(compareBy(key));

    setSortKey(key);
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

  return [forms, sortBy, filter];
}
