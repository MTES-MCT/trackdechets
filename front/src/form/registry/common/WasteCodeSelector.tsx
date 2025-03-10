import React, { useState } from "react";
import { ALL_WASTES_TREE } from "@td/constants";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

type WasteCode = {
  code: string;
  description: string;
  children: readonly WasteCode[];
};

type Props = {
  name?: string;
  methods: UseFormReturn<any>;
};

export function WasteCodeSelector({ name, methods }: Props) {
  if (!name) {
    console.error("WasteCodeSelector: name is required");
  }

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function onSelect(code: string) {
    if (name) {
      methods.setValue(name, code);
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

  function renderTree(nodes: readonly WasteCode[]) {
    return (
      <ul>
        {nodes.map(node => (
          <li key={node.code}>
            <div>
              {node.children.length > 0 && (
                <button onClick={() => handleToggle(node.code)}>
                  {expanded.has(node.code) ? "-" : "+"}
                </button>
              )}
              {node.children.length > 0 ? (
                <span>
                  {node.code} - {node.description}
                </span>
              ) : (
                <button onClick={() => onSelect(node.code)}>
                  {node.code} - {node.description}
                </button>
              )}
            </div>
            {node.children.length > 0 &&
              expanded.has(node.code) &&
              renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-4 fr-col-md-4">
          <Input
            label="Code déchet"
            nativeInputProps={{
              type: "text",
              ...methods.register(name!)
            }}
          />
        </div>
        <div className="fr-col-1 fr-col-md-2">
          <Tooltip kind="hover" title="lorem ipsum" />
        </div>
        <div className="fr-col-4 fr-col-md-3">
          <Button onClick={function noRefCheck() {}} priority="secondary">
            Liste des codes déchets
          </Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Recherche d'un code déchet..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {renderTree(recursiveFilterTree(ALL_WASTES_TREE, search))}
    </div>
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
