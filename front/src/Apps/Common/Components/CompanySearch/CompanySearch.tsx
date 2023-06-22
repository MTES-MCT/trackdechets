import { autocomplete, AutocompleteApi } from "@algolia/autocomplete-js";
import React, { createElement, Fragment, useEffect, useRef } from "react";
import { CompanySearchItem } from "./CompanySearchItem";
import {
  CompanySearchPrivate,
  FavoriteType,
  FormCompany,
} from "generated/graphql/types";
import { constantCase } from "constant-case";
import { useField } from "formik";
import { createRoot } from "react-dom/client";

type AutocompleteItem = CompanySearchPrivate;

/**
 * CompanySearch's exposed parameters
 */
interface CompanySearchProps {
  orgId: string;
  name: string;
  // Callback for the host component
  // Called with empty parameter to un-select a company
  onCompanySelected?: (company?: CompanySearchPrivate) => void;
  allowForeignCompanies?: boolean;
  registeredOnlyCompanies?: boolean;
  disabled?: boolean;
  skipFavorite?: boolean;
  // whether the seledction is optional
  optional?: boolean;
  initialAutoSelectFirstCompany?: boolean;
}

export function CompanySearch({ orgId, name }: CompanySearchProps) {
  const containerRef = useRef<HTMLElement>(null);
  const panelRootRef = useRef<any>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const [field] = useField<FormCompany>({ name });

  const favoriteType = constantCase(field.name.split(".")[0]) as FavoriteType;

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const search: AutocompleteApi<AutocompleteItem> = autocomplete({
      container: containerRef.current,
      renderer: { createElement, Fragment, render: () => {} },
      render({ children }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        panelRootRef.current.render(children);
      },
      getSources({ query }) {
        return [
          {
            sourceId: "favorites",
            getItemInputValue: ({ item }) => item.name || "",
            getItems: () =>
              fetch(`YOUR_BACKEND_URL/favorites`, {
                method: "POST",
                body: JSON.stringify({
                  orgId,
                  type: Object.values(FavoriteType).includes(favoriteType)
                    ? favoriteType
                    : FavoriteType.Emitter,
                  userId: "CURRENT_USER_ID", // replace with the current user id
                  companyType: "CURRENT_COMPANY_TYPE", // replace with the current company type
                }),
              })
                .then(response => response.json())
                .then(data => data.items),
            templates: {
              item({ item, components }) {
                return <CompanySearchItem hit={item} components={components} />;
              },
            },
          },
          {
            sourceId: "search",
            getItemInputValue: ({ item }) => item.name || "",
            getItems: () =>
              fetch(`YOUR_BACKEND_URL/search?query=${query}`)
                .then(response => response.json())
                .then(data => data.items),
            templates: {
              item({ item, components }) {
                return <CompanySearchItem hit={item} components={components} />;
              },
            },
          },
        ];
      },
    });

    return () => {
      search.destroy();
    };
  }, [orgId, favoriteType]);

  return <div ref={containerRef}></div>;
}
