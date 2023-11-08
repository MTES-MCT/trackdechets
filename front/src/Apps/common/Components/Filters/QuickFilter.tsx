import Input from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { QuickFilterProps } from "./filtersTypes";

const QuickFilter = ({
  label,
  placeholder,
  value,
  onChange
}: QuickFilterProps) => {
  return (
    <Input label={label} nativeInputProps={{ onChange, placeholder, value }} />
  );
};

export default QuickFilter;
