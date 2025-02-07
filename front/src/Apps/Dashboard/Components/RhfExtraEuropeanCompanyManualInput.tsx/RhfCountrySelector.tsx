import React from "react";
import Select from "@codegouvfr/react-dsfr/Select";
import countries from "world-countries";
import { useFormContext } from "react-hook-form";

interface RhfCountrySelectorProps {
  label: string;
  fieldName: string;
  errorObject: any;
  cca2sToExclude?: string[]; // country code to exlude from select
}

export default function RhfCountrySelector(props: RhfCountrySelectorProps) {
  const { register } = useFormContext();

  const { label, fieldName, errorObject, cca2sToExclude = [] } = props;

  const options = countries.filter(
    country => !cca2sToExclude.includes(country.cca2)
  );

  return (
    <Select
      label={label}
      nativeSelectProps={register(fieldName)}
      state={errorObject ? "error" : "default"}
      stateRelatedMessage={errorObject?.message}
    >
      {options.map(country => (
        <option value={country.cca2} key={country.cca2}>
          {country.translations.fra.common}
        </option>
      ))}
    </Select>
  );
}
