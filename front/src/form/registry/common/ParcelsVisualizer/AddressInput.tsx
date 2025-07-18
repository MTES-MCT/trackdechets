import React, { useMemo, useRef, useState } from "react";
import styles from "./AddressInput.module.scss";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ComboBox } from "../../../../Apps/common/Components/Combobox/Combobox";
import { debounce } from "../../../../common/helper";
import { searchAddress, AddressSuggestion } from "./utils";

type Props = {
  disabled?: boolean;
  onAddressSelected: (address: AddressSuggestion) => void;
};

export function AddressInput({ disabled, onAddressSelected }: Props) {
  const [searchString, setSearchString] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [addressesSuggestions, setAddressesSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce(async text => {
        if (text.length < 3) {
          setAddressesSuggestions([]);
          return;
        }
        try {
          const res = await searchAddress(text);
          if (res.status === "OK") {
            setAddressesSuggestions(
              res.results.map(({ fulltext, lat, lng }) => ({
                fulltext,
                lat,
                lng
              }))
            );
            setShowSearch(true);
            return;
          }
          setAddressesSuggestions([]);
        } catch (error) {
          console.error(error);
          setAddressesSuggestions([]);
        }
      }, 500),
    [setAddressesSuggestions, setShowSearch]
  );

  return (
    <>
      <div className={styles.searchBar}>
        <Input
          id="parcels-search"
          label="Adresse complète"
          className="fr-mt-1w fr-mb-1w"
          ref={addressInputRef}
          disabled={disabled}
          nativeInputProps={{
            value: searchString,
            type: "search",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchString(e.currentTarget.value);
              debouncedSearch(e.currentTarget.value);
            },
            onFocus: () => {
              if (addressesSuggestions.length > 0) {
                setShowSearch(true);
              }
            }
          }}
        />
        {searchString && (
          <button
            type="button"
            className={styles.customCancelButton}
            onClick={() => {
              setSearchString("");
              setAddressesSuggestions([]);
              setShowSearch(false);
              if (addressInputRef.current) {
                addressInputRef.current.focus();
              }
            }}
            aria-label="Effacer la recherche"
          >
            <span
              aria-hidden="true"
              className="fr-icon-close-circle-fill fr-icon--sm"
            ></span>
          </button>
        )}
      </div>

      <ComboBox
        parentRef={addressInputRef}
        isOpen={showSearch}
        onOpenChange={setShowSearch}
      >
        {() => (
          <div>
            {addressesSuggestions.map((address, index) => (
              <div
                className="tw-px-2 tw-py-2 hover:tw-bg-gray-100 tw-cursor-pointer"
                key={`${address.fulltext}-${index}`}
                onClick={() => {
                  onAddressSelected({
                    fulltext: address.fulltext,
                    lat: address.lat,
                    lng: address.lng
                  });
                  setAddressesSuggestions(
                    addressesSuggestions.filter((a, idx) => idx === index)
                  );
                  setSearchString(address.fulltext);
                  setShowSearch(false);
                }}
              >
                {address.fulltext}
              </div>
            ))}
          </div>
        )}
      </ComboBox>
    </>
  );
}
