import React from "react";
import Select from "react-select";
import countries, { Country } from "world-countries";
import "./CountrySelector.scss";

interface CountrySelectorProps {
  onChange: (code: string) => void;
  value: string;
  cca2sToExclude?: string[]; // country code to exlude from select
}

export default function CountrySelector(props: CountrySelectorProps) {
  const { cca2sToExclude = [] } = props;

  const currentCountry =
    countries.find(country => country.cca2 === props.value) ?? null;

  const options = countries.filter(
    country => !cca2sToExclude.includes(country.cca2)
  );
  return (
    <Select
      {...props}
      options={options}
      onChange={option =>
        props.onChange(
          // option can be null, an option or an array of options
          // except in this case it cannot be an array of options
          // so we have to workaround that, see:
          // https://github.com/JedWatson/react-select/issues/3900
          option ? (option as Country).cca2 : ""
        )
      }
      value={currentCountry}
      getOptionLabel={country => country.translations.fra.common}
      getOptionValue={country => country.cca2}
      classNamePrefix="react-select"
    />
  );
}
