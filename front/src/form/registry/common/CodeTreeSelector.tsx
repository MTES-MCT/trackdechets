import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import clsx from "clsx";
import React, { useMemo, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ComboBox } from "../../../Apps/common/Components/Combobox/Combobox";
import SingleCheckbox from "../../../Apps/common/Components/SingleCheckbox/SingleCheckbox";
import { MEDIA_QUERIES } from "../../../common/config";
import { capitalize } from "../../../common/helper";
import { useMedia } from "../../../common/use-media";
import { formatError } from "../builder/error";
import "./WasteCodeSelector.scss";

export type TreeSelectorNode = Readonly<{
  code: string;
  description?: string;
  children: readonly TreeSelectorNode[];
}>;

export type CodeTreeSelectorProps = {
  name: string;
  tree: readonly TreeSelectorNode[];
  label?: string;
  required?: boolean;
  methods: UseFormReturn<any>;
  containerRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  whiteList?: string[];
  blackList?: string[];
  displayDescription?: boolean;
  multiple?: boolean;
  searchPlaceholder?: string;
  infoLabel?: string;
  emptyMessage?: string;
};

export function CodeTreeSelector({
  name,
  tree,
  methods,
  label,
  required = true,
  containerRef,
  disabled,
  whiteList,
  blackList,
  displayDescription = true,
  multiple = false,
  searchPlaceholder = "Recherche d'un code...",
  infoLabel,
  emptyMessage = "Aucun code trouvé"
}: CodeTreeSelectorProps) {
  if (!name) {
    console.error('CodeTreeSelector: "name" prop is required');
  }

  const splitName = useMemo(() => name.split("."), [name]);
  const isArrayField = splitName.length > 1;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { errors } = methods.formState;

  const filteredTree = useMemo(() => {
    return filterTreeByLists(tree, whiteList, blackList);
  }, [tree, whiteList, blackList]);

  const setComboboxOpen = (open: boolean) => {
    setShowSearch(open);
    if (!open) {
      setSearch("");
    }
  };

  const currentValue = methods.watch(name);
  const currentValues = Array.isArray(currentValue) ? currentValue : [];

  const fieldError = isArrayField
    ? errors?.[splitName[0]]?.[splitName[1]]?.value
    : errors?.[name];

  function onSelect(code: string) {
    if (multiple) {
      const newValues = currentValues.includes(code)
        ? currentValues.filter((currentCode: string) => currentCode !== code)
        : [...currentValues, code];
      methods.setValue(name, newValues);
    } else {
      methods.setValue(name, code);
      setComboboxOpen(false);
    }
  }

  function handleToggle(code: string) {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  }

  function renderTree(nodes: readonly TreeSelectorNode[], level = 0) {
    return (
      <ul>
        {nodes.map(node => (
          <li key={node.code} className={`fr-ml-${level}w`}>
            <div>
              {node.children.length > 0 ? (
                <button
                  className={clsx(
                    "tw-flex tw-w-full tw-cursor-pointer tw-border-none tw-bg-transparent tw-px-0 tw-text-left",
                    level === 0 ? "fr-my-1w tw-font-bold" : "tw-my-0"
                  )}
                  onClick={() => handleToggle(node.code)}
                  type="button"
                >
                  <span className="tw-flex-1">{formatNodeLabel(node)}</span>
                  <span
                    className={
                      expanded.has(node.code)
                        ? "fr-icon-arrow-up-s-line"
                        : "fr-icon-arrow-down-s-line"
                    }
                  ></span>
                </button>
              ) : (
                <div className="tw-flex tw-items-center tw-gap-2">
                  {multiple ? (
                    <SingleCheckbox
                      options={[
                        {
                          label: formatNodeLabel(node),
                          nativeInputProps: {
                            checked: currentValues.includes(node.code),
                            onChange: () => onSelect(node.code)
                          }
                        }
                      ]}
                    />
                  ) : (
                    <button
                      onClick={() => onSelect(node.code)}
                      type="button"
                      className="tw-text-left"
                    >
                      {formatNodeLabel(node)}
                    </button>
                  )}
                </div>
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

  const selectedNode = multiple
    ? null
    : findNodeByCode(filteredTree, currentValue);
  const description = selectedNode?.description;

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const visibleTree = recursiveFilterTree(filteredTree, search);

  const searchFields = (
    <>
      <div
        className={
          multiple
            ? "fr-col-md-12"
            : `fr-col-7 ${
                label ? "fr-col-md-8 label-opt fr-mt-1w" : "fr-col-md-4"
              }`
        }
      >
        <Input
          label={`${label ?? "Code"}${!required ? " (optionnel)" : ""}`}
          iconId={
            multiple
              ? showSearch
                ? "fr-icon-arrow-up-s-line"
                : "fr-icon-arrow-down-s-line"
              : undefined
          }
          nativeInputProps={{
            onClick: () => multiple && setComboboxOpen(!showSearch),
            type: "text",
            ...(!multiple && { ...methods.register(name) }),
            value: multiple ? currentValues.join(", ") : currentValue || "",
            readOnly: multiple
          }}
          disabled={disabled}
          state={fieldError ? "error" : infoLabel ? "info" : undefined}
          stateRelatedMessage={fieldError ? formatError(fieldError) : infoLabel}
        />
      </div>
      {!multiple && (
        <div
          className={`fr-col-md-2 ${label ? "search-btn-lbl" : "search-btn"} ${
            infoLabel ? "tw-mb-12" : ""
          }`}
          style={
            isMobile
              ? {
                  display: "block",
                  position: "absolute",
                  left: "60%",
                  bottom: "0px"
                }
              : { paddingTop: label ? "50px" : "44px" }
          }
        >
          <div
            className={clsx({
              "fr-mb-9v": !!fieldError
            })}
          >
            <Button
              onClick={() => setComboboxOpen(!showSearch)}
              priority="secondary"
              type="button"
              ref={triggerRef}
              disabled={disabled}
            >
              Recherche
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {containerRef ? (
        searchFields
      ) : (
        <div
          ref={comboboxRef}
          className="fr-col-md-12"
          style={{
            width: "100%"
          }}
        >
          <div
            className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom"
            style={{
              position: "relative"
            }}
          >
            {searchFields}
          </div>
        </div>
      )}
      <ComboBox
        parentRef={containerRef ?? comboboxRef}
        triggerRef={multiple ? comboboxRef : triggerRef}
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
                  placeholder: searchPlaceholder,
                  onChange: event => setSearch(event.target.value)
                }}
                label=""
              />
            </div>
            <div className="tw-flex-1 tw-overflow-y-auto">
              {visibleTree.length > 0 ? (
                <div>{renderTree(visibleTree)}</div>
              ) : (
                <div className="tw-py-2 tw-text-sm">{emptyMessage}</div>
              )}
            </div>
          </div>
        )}
      </ComboBox>
      {displayDescription && !multiple && description && (
        <div className="fr-col-12">
          <Alert
            description={capitalize(description) as string}
            severity="info"
            small
          />
        </div>
      )}
    </>
  );
}

function formatNodeLabel(node: TreeSelectorNode): string {
  return node.description ? `${node.code} - ${node.description}` : node.code;
}

function recursiveFilterTree(
  nodes: readonly TreeSelectorNode[],
  search: string
): TreeSelectorNode[] {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return [...nodes];
  }

  return nodes
    .map(node => {
      if (
        node.code.toLowerCase().includes(normalizedSearch) ||
        node.description?.toLowerCase().includes(normalizedSearch)
      ) {
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
    .filter((node): node is TreeSelectorNode => node !== null);
}

function filterTreeByLists(
  nodes: readonly TreeSelectorNode[],
  whiteList?: string[],
  blackList?: string[]
): TreeSelectorNode[] {
  if (!nodes) {
    return [];
  }

  const hasWhiteList = !!whiteList?.length;
  const hasBlackList = !!blackList?.length;

  if (!hasWhiteList && !hasBlackList) {
    return [...nodes];
  }

  const shouldIncludeCode = (code: string): boolean => {
    if (hasBlackList && blackList!.includes(code)) {
      return false;
    }

    return hasWhiteList ? whiteList!.includes(code) : true;
  };

  return nodes
    .map(node => {
      if (node.children.length === 0) {
        return shouldIncludeCode(node.code) ? node : null;
      }

      const filteredChildren = filterTreeByLists(
        node.children,
        whiteList,
        blackList
      );

      return filteredChildren.length > 0
        ? { ...node, children: filteredChildren }
        : null;
    })
    .filter((node): node is TreeSelectorNode => node !== null);
}

function findNodeByCode(
  nodes: readonly TreeSelectorNode[],
  code?: string | null
): TreeSelectorNode | null {
  if (!code) {
    return null;
  }

  for (const node of nodes) {
    if (node.code === code) {
      return node;
    }

    if (node.children.length > 0) {
      const child = findNodeByCode(node.children, code);
      if (child) {
        return child;
      }
    }
  }

  return null;
}
