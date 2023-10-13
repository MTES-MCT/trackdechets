import Input from "@codegouvfr/react-dsfr/Input";
import React from "react";

interface QuickFilterProps {
  label: string;
}

const QuickFilter = ({ label }: QuickFilterProps) => {
  return <Input label={label} />;
};

export default QuickFilter;
