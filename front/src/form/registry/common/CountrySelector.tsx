import React, { useRef, useState } from "react";
import { ComboBox } from "../../../Apps/common/Components/Combobox/Combobox";
import countries from "world-countries";
import { type UseFormReturn } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";
import { formatError } from "../builder/error";

const sortedCountries = countries
  .sort((a, b) =>
    a.translations.fra.common.localeCompare(b.translations.fra.common)
  )
  .map(country => ({
    label: country.translations.fra.common,
    code: country.cca2
  }));

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
};

export function CountrySelector({ methods, prefix }: Props) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { errors } = methods.formState;
  // handle errors when this component is used in an array of fields, and the errors are nested
  // ex: errors.transporter.0.CompanyName
  let deepErrors = errors;
  const prefixSplit = prefix.split(".");
  const finalPrefix = prefixSplit[prefixSplit.length - 1];
  if (prefixSplit.length > 1) {
    deepErrors = errors?.[prefixSplit[0]]?.[prefixSplit[1]];
  }
  function onSelect(code: string) {
    methods.setValue(`${prefix}CountryCode`, code);
    setSearch("");
    setShowSearch(false);
  }

  function setComboboxOpen(open: boolean) {
    setShowSearch(open);
    if (!open) {
      setSearch("");
    }
  }

  return (
    <div>
      <Input
        label="Code pays"
        iconId={
          showSearch
            ? "fr-icon-arrow-up-s-line"
            : "fr-icon-arrow-down-s-line"
        }
        nativeInputProps={{
          type: "text",
          ...methods.register(`${prefix}CountryCode`),
          onClick: () => {
            setShowSearch(true);
          }
        }}
        ref={triggerRef}
        state={deepErrors?.[`${finalPrefix}CountryCode`] && "error"}
        stateRelatedMessage={formatError(
          deepErrors?.[`${finalPrefix}CountryCode`]
        )}
      />

      <ComboBox
        parentRef={triggerRef}
        isOpen={showSearch}
        onOpenChange={setComboboxOpen}
      >
        {() => (
          <div>
            <div className="tw-sticky tw-top-0 tw-bg-white tw-z-10 tw-py-2">
              <Input
                iconId="fr-icon-search-line"
                label=""
                nativeInputProps={{
                  placeholder: "Rechercher",
                  type: "text",
                  onChange: e => {
                    setSearch(e.target.value);
                  }
                }}
              />
            </div>
            {filterCountries(sortedCountries, search).map(country => (
              <option
                className="tw-px-2 tw-py-2 hover:tw-bg-gray-100 tw-cursor-pointer"
                value={country.code}
                key={country.code}
                onClick={() => onSelect(country.code)}
              >
                {country.label}
              </option>
            ))}
          </div>
        )}
      </ComboBox>
    </div>
  );
}

function filterCountries(
  countries: { label: string; code: string }[],
  search: string
) {
  if (!search || search.length < 2) return countries;

  return countries.filter(
    country =>
      country.label.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase())
  );
}
