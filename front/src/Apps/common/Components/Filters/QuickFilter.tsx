import Input from "@codegouvfr/react-dsfr/Input";
import { debounce } from "common/helper";
import React, { useMemo } from "react";
import { QuickFilterProps } from "./filtersTypes";

const DEBOUNCE_DELAY = 500;

const QuickFilter = ({ label, onChange }: QuickFilterProps) => {
  const debouncedOnChange = useMemo(
    () => debounce(onChange, DEBOUNCE_DELAY),
    [onChange]
  );

  return (
    <Input label={label} nativeInputProps={{ onChange: debouncedOnChange }} />
  );
};

export default QuickFilter;
