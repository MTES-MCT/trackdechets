import { ALL_WASTES_TREE } from "@td/constants";
import React from "react";
import type { CodeTreeSelectorProps } from "./CodeTreeSelector";
import { CodeTreeSelector } from "./CodeTreeSelector";

type Props = Omit<CodeTreeSelectorProps, "tree" | "searchPlaceholder">;

export function WasteCodeSelector({ label = "Code déchet", ...props }: Props) {
  return (
    <CodeTreeSelector
      {...props}
      label={label}
      searchPlaceholder="Recherche d'un code déchet..."
      tree={ALL_WASTES_TREE}
    />
  );
}
