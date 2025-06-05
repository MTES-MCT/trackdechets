import React, { useMemo, useRef, useState } from "react";
import { ALL_WASTES_TREE } from "@td/constants";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
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
  label?: string;
  methods: UseFormReturn<any>;
  containerRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  whiteList?: string[];
  blackList?: string[];
};

export function WasteCodeSelector({
  name,
  methods,
  label,
  containerRef,
  disabled,
  whiteList,
  blackList
}: Props) {
  if (!name) {
    console.error('WasteCodeSelector: "name" prop is required');
  }
  const splitName = useMemo(() => name.split("."), [name]);
  const isArrayField = splitName.length > 1;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { errors } = methods.formState;

  const filteredWastesTree = useMemo(() => {
    return filterWasteTreeByLists(ALL_WASTES_TREE, whiteList, blackList);
  }, [whiteList, blackList]);

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
                <button
                  onClick={() => onSelect(node.code)}
                  type="button"
                  className="tw-text-left"
                >
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
            ...methods.register(name!)
          }}
          disabled={disabled}
          state={
            (isArrayField
              ? errors?.[splitName[0]]?.[splitName[1]]?.value
              : errors?.[name]) && "error"
          }
          stateRelatedMessage={formatError(
            isArrayField
              ? errors?.[splitName[0]]?.[splitName[1]]?.value
              : errors?.[name]
          )}
        />
      </div>
      <div className="fr-col-2" style={{ paddingTop: "44px" }}>
        <div
          className={clsx({
            "fr-mb-9v": !!(isArrayField
              ? errors?.[splitName[0]]?.[splitName[1]]?.value
              : errors?.[name])
          })}
        >
          <Button
            onClick={() => setShowSearch(!showSearch)}
            priority="secondary"
            type="button"
            ref={triggerRef}
            disabled={disabled}
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
          style={{
            alignItems: "flex-start"
          }}
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
                {renderTree(recursiveFilterTree(filteredWastesTree, search))}
              </div>
            </div>
          </div>
        )}
      </ComboBox>
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

function filterWasteTreeByLists(
  nodes: readonly WasteCode[],
  whiteList?: string[],
  blackList?: string[]
): WasteCode[] {
  if (!nodes) return [];

  const hasWhiteList = whiteList && whiteList.length > 0;
  const hasBlackList = blackList && blackList.length > 0;

  if (!hasWhiteList && !hasBlackList) {
    return [...nodes];
  }

  const shouldIncludeCode = (code: string): boolean => {
    const isBlacklisted = hasBlackList && blackList!.includes(code);
    if (isBlacklisted) {
      return false;
    }

    const isWhitelisted = hasWhiteList ? whiteList!.includes(code) : true;
    return isWhitelisted;
  };
  return nodes
    .map(node => {
      // Only leaf nodes are actual waste codes
      if (node.children.length === 0) {
        return shouldIncludeCode(node.code) ? node : null;
      }

      const filteredChildren = filterWasteTreeByLists(
        node.children,
        whiteList,
        blackList
      );

      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      } else {
        return null;
      }
    })
    .filter((node): node is WasteCode => node !== null);
}
