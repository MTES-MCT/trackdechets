import * as React from "react";
import { useEffect, useState } from "react";
import { autocomplete } from "@algolia/autocomplete-js";
import * as Sentry from "@sentry/browser";
import { type } from "os";

export default function AutocompleteComponent({
  orgId,
  type,
  allowForeignCompanies,
}) {
  const [favoriteCompanies, setFavoriteCompanies] = useState([]);

  useEffect(() => {
    const favorites = async () =>
      await fetch(`http://localhost:3000/favorites?orgId=${orgId}&type=${type}`)
        .then(res => res.json())
        .then(favorites => setFavoriteCompanies(favorites))
        .catch(error => {
          // it just doesn't display the map if there is an error.
          Sentry.captureException(error);
        });
    favorites();
  }, [Sentry, orgId, type]);

  useEffect(() => {
    autocomplete({
      container: "#autocomplete",
      placeholder: "Search here...",
      openOnFocus: true,
      getSources({ query }) {
        return [
          {
            sourceId: "favorites",
            getItems() {
              return favoriteCompanies;
            },
          },
          {
            sourceId: "companies",
            getItems({ query }) {
              return fetch(
                `http://localhost:3000/search?clue=${query}&department=${department}&allowForeignCompanies=${
                  allowForeignCompanies ? "true" : "false"
                }`
              )
                .then(res => res.json())
                .catch(error => {
                  // it just doesn't display the map if there is an error.
                  Sentry.captureException(error);
                });
            },
          },
        ];
      },
      getTemplates() {
        return {
          item({ item, components }) {
            return (
              <>
                {item.orgId}: {item.name}
              </>
            );
          },
        };
      },
    });
  }, [favoriteCompanies]);

  return <div id="autocomplete"></div>;
}
