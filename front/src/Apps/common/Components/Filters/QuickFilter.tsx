import Input from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { QuickFilterProps } from "./filtersTypes";
import "./quickFilter.scss";

const QuickFilter = ({
  label,
  placeholder,
  value,
  onChange
}: QuickFilterProps) => {
  return (
    <Input
      label={label}
      nativeInputProps={{ onChange, placeholder, value }}
      className="quickFilter"
    />
  );
};

export default QuickFilter;
