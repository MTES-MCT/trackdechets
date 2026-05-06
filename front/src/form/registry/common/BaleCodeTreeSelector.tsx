import { BALE_CODES_TREE } from "@td/constants";
import React from "react";
import type { CodeTreeSelectorProps } from "./CodeTreeSelector";
import { CodeTreeSelector } from "./CodeTreeSelector";

type Props = Omit<CodeTreeSelectorProps, "tree" | "searchPlaceholder">;

export function BaleCodeTreeSelector({
  displayDescription = false,
  label = "Code déchet Bâle",
  ...props
}: Props) {
  return (
    <CodeTreeSelector
      {...props}
      displayDescription={displayDescription}
      label={label}
      searchPlaceholder="Recherche d'un code Bâle..."
      tree={BALE_CODES_TREE}
    />
  );
}
