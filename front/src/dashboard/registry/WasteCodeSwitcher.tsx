import React, { useState, useMemo, useId } from "react";
import { debounce } from "../../common/helper";
import { WasteNode, ALL_WASTES } from "@td/constants";
import useOnClickOutsideRefTarget from "../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { Input } from "@codegouvfr/react-dsfr/Input";
import styles from "./WasteCodeSwitcher.module.scss";
import classNames from "classnames";

type Props = {
  id?: string;
  onSelectChange: (wasteCodes: { code: string; description: string }[]) => void;
};

export function WasteCodeSwitcher({ id, onSelectChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<WasteNode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<WasteNode[]>(ALL_WASTES);
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false)
  });
  const fieldId = useId();
  const debouncedSearch = useMemo(
    () =>
      debounce(clue => {
        const filtered = ALL_WASTES.filter(wasteInfo => {
          return (
            wasteInfo.code.startsWith(clue) ||
            wasteInfo.description.includes(clue)
          );
        });
        setFilteredCodes(filtered);
      }, 300),
    []
  );

  const onSelect = (wasteCode: string, selected: boolean) => {
    let newSelected = selectedItems;
    if (selected) {
      newSelected = [
        ...ALL_WASTES.filter(
          ({ code }) =>
            code === wasteCode ||
            selectedItems.some(selectedItem => code === selectedItem.code)
        )
      ];
    } else {
      newSelected = [...selectedItems.filter(({ code }) => code !== wasteCode)];
    }
    setSelectedItems(newSelected);
    onSelectChange(newSelected);
  };

  return (
    <div
      className="tw-relative tw-w-1/2"
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      <label className={"fr-label"} htmlFor={id ?? fieldId}>
        {"Codes déchets"}
      </label>
      <div
        id={id ?? fieldId}
        className="fr-input tw-cursor-pointer tw-flex tw-justify-between"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="tw-truncate">
          {selectedItems.map(({ code }) => code).join(", ")}
        </span>
        <span
          className={`${
            isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
          } fr-mx-1w`}
        />
      </div>
      <div
        className={`${
          isOpen ? "tw-block" : "tw-hidden"
        } tw-absolute tw-bg-white tw-inset-x-0 tw-z-10 tw-p-2 tw-shadow-md`}
      >
        <Input
          iconId="fr-icon-search-line"
          nativeInputProps={{
            placeholder: "Rechercher",
            onChange: e => {
              const clue = e.currentTarget.value;
              if (clue.length >= 2) {
                debouncedSearch(e.currentTarget.value);
              }
            }
          }}
          label=""
        />
        <div className={classNames([styles.codesList])}>
          {filteredCodes.map(({ code, description }) => {
            const selected = selectedItems.some(
              selectedItem => selectedItem.code === code
            );
            return (
              <div
                className={classNames([
                  "tw-px-2",
                  "tw-py-4",
                  selected ? "hover:tw-bg-gray-300" : "hover:tw-bg-gray-100",
                  "tw-cursor-pointer",
                  selected ? "tw-bg-gray-200" : null
                ])}
                onClick={() => {
                  onSelect(code, !selected);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    onSelect(code, !selected);
                  }
                }}
                key={code}
              >
                {code} : {description}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
