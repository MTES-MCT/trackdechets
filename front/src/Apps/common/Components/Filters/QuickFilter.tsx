import Input from "@codegouvfr/react-dsfr/Input";
import { debounce } from "common/helper";
import React, { ChangeEvent, useMemo } from "react";

const DEBOUNCE_DELAY = 500;

interface QuickFilterProps {
  label: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

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
