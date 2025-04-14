import React, { useRef, useState } from "react";
import { ALL_WASTES_TREE } from "@td/constants";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
// import useOnClickOutsideRefTarget from "../../../Apps/common/hooks/useOnClickOutsideRefTarget";
import { formatError } from "../builder/error";
import { ComboBox } from "../../../Apps/common/Components/Combobox/Combobox";
import clsx from "clsx";

type WasteCode = {
  code: string;
  description: string;
  children: readonly WasteCode[];
};

type Props = {
  name: string;
  required?: boolean;
  label?: string;
  methods: UseFormReturn<any>;
  containerRef?: React.RefObject<HTMLDivElement>;
};

export function WasteCodeSelector({
  name,
  required,
  methods,
  label,
  containerRef
}: Props) {
  if (!name) {
    console.error('WasteCodeSelector: "name" prop is required');
  }

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { errors } = methods.formState;

  // const { targetRef } = useOnClickOutsideRefTarget({
  //   onClickOutside: () => {
  //     if (showSearch) {
  //       setShowSearch(false);
  //     }
  //   }
  // });

  const setComboboxOpen = (open: boolean) => {
    setShowSearch(open);
    if (!open) {
      setSearch("");
    }
  };

  function onSelect(code: string) {
    if (name) {
      methods.setValue(name, code);
      setShowSearch(false);
    }
  }

  function handleToggle(code: string) {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      return newSet;
    });
  }

  function renderTree(nodes: readonly WasteCode[], level = 0) {
    return (
      <ul>
        {nodes.map(node => (
          <li key={node.code} className={`fr-ml-${level}w`}>
            <div>
              {node.children.length > 0 ? (
                <div
                  className={`fr-my-${1 - level}w tw-flex tw-cursor-pointer ${
                    level === 0 && "tw-font-bold"
                  }`}
                  onClick={() => handleToggle(node.code)}
                >
                  <span className="tw-flex-1">
                    {node.code} - {node.description}
                  </span>
                  <span
                    className={
                      expanded.has(node.code)
                        ? "fr-icon-arrow-down-s-line"
                        : "fr-icon-arrow-up-s-line"
                    }
                  ></span>
                </div>
              ) : (
                <button onClick={() => onSelect(node.code)} type="button">
                  {node.code} - {node.description}
                </button>
              )}
            </div>
            {node.children.length > 0 &&
              expanded.has(node.code) &&
              renderTree(node.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  }

  const searchFields = (
    <>
      <div className="fr-col-4 fr-col-md-4">
        <Input
          label={label ?? "Code déchet"}
          nativeInputProps={{
            type: "text",
            ...methods.register(name!, { required })
          }}
          state={errors?.[name] && "error"}
          stateRelatedMessage={formatError(errors?.[name])}
        />
      </div>
      <div className="fr-col-2">
        <div className={clsx({ "fr-mb-9v": !!errors?.[name] })}>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            priority="secondary"
            type="button"
            ref={triggerRef}
          >
            Recherche
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {containerRef ? (
        searchFields
      ) : (
        <div
          className="fr-col-12 fr-grid-row fr-grid-row--gutters fr-grid-row--bottom tw-relative"
          ref={comboboxRef}
        >
          {searchFields}
        </div>
      )}
      <ComboBox
        parentRef={containerRef ?? comboboxRef}
        triggerRef={triggerRef}
        isOpen={showSearch}
        onOpenChange={setComboboxOpen}
      >
        {() => (
          <div className="tw-bg-white tw-inset-x-0 tw-z-10 tw-px-2 tw-h-full tw-flex tw-flex-col">
            <div className="tw-sticky tw-top-0 tw-bg-white tw-z-10 tw-py-2">
              <Input
                iconId="fr-icon-search-line"
                nativeInputProps={{
                  type: "text",
                  placeholder: "Recherche d'un code déchet...",
                  onChange: e => setSearch(e.target.value)
                }}
                label=""
              />
            </div>
            <div className="tw-flex-1 tw-overflow-y-auto">
              <div>
                {renderTree(recursiveFilterTree(ALL_WASTES_TREE, search))}
              </div>
            </div>
          </div>
        )}
      </ComboBox>
      {/* <div
        className={`${
          showSearch ? "tw-block" : "tw-hidden"
        } tw-absolute tw-bg-white tw-inset-x-0 tw-z-10 tw-p-2 tw-shadow-md tw-overflow-scroll fr-mt-1w`}
        style={{ maxHeight: "500px", top: "100%" }}
        ref={targetRef as React.RefObject<HTMLDivElement>}
      >
        <div className="tw-sticky tw-top-0 tw-z-20">
          <Input
            label=""
            iconId="fr-icon-search-line"
            className="tw-sticky tw-top-0 tw-z-20"
            nativeInputProps={{
              type: "text",
              placeholder: "Recherche d'un code déchet...",
              onChange: e => setSearch(e.target.value)
            }}
          />
        </div>
        <div>{renderTree(recursiveFilterTree(ALL_WASTES_TREE, search))}</div>
      </div> */}
    </>
  );
}

function recursiveFilterTree(
  nodes: readonly WasteCode[],
  search: string
): WasteCode[] {
  return nodes
    .map(node => {
      if (node.description.toLowerCase().includes(search.toLowerCase())) {
        return node;
      }
      if (node.children.length > 0) {
        const filteredChildren = recursiveFilterTree(node.children, search);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter(Boolean) as WasteCode[];
}
