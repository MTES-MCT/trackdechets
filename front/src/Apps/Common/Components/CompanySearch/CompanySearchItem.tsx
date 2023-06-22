import React from "react";
import { AutocompleteComponents } from "@algolia/autocomplete-js";
import { CompanySearchPrivate } from "generated/graphql/types";

export function CompanySearchItem({
  hit,
  components,
}: {
  hit: CompanySearchPrivate;
  components: AutocompleteComponents;
}) {
  return (
    <a href={`/company/${hit.orgId}`} className="aa-ItemLink">
      <div className="aa-ItemContent">
        <div className="aa-ItemTitle">
          <components.Highlight hit={hit} attribute="name" />
        </div>
        <div className="aa-ItemContentBody">
          <components.Highlight hit={hit} attribute="address" />
        </div>
      </div>
    </a>
  );
}
