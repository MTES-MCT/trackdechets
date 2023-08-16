import { useLazyQuery, useQuery } from "@apollo/client";
import classNames from "classnames";
import {
  IconLayout2,
  IconLayoutModule1,
  IconRefresh,
} from "Apps/common/Components/Icons/Icons";
import Loader from "Apps/common/Components/Loader/Loaders";
import { MEDIA_QUERIES } from "common/config";
import { usePersistedState } from "Apps/common/hooks/usePersistedState";
import { GET_BSDS } from "Apps/common/queries";
import { BsdWhere, Query, QueryBsdsArgs } from "generated/graphql/types";
import * as React from "react";
import { useMedia } from "use-media";
import { BSDCards } from "./BSDCards";
import styles from "./BSDList.module.scss";
import { BSDTable } from "./BSDTable";
import { Column, COLUMNS } from "./columns";
import { BSDDropdown } from "./BSDDropdown";
import { useNotifier } from "./useNotifier";

const DEFAULT_COLUMNS = [
  COLUMNS.type,
  COLUMNS.readableId,
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.status,
];

const LAYOUT_LOCAL_STORAGE_KEY = "td-display-type";

const LAYOUTS = [
  {
    label: (
      <>
        <IconLayout2 style={{ marginRight: "0.25rem" }} />
        Tableau
      </>
    ),
    type: "table" as const,
    Component: BSDTable,
  },
  {
    label: (
      <>
        <IconLayoutModule1 style={{ marginRight: "0.25rem" }} />
        Cartes
      </>
    ),
    type: "cards" as const,
    Component: BSDCards,
  },
];

type LayoutType = "table" | "cards";

interface BSDListProps {
  siret: string;
  columns?: Column[];
  blankslate: React.ReactNode;
  defaultWhere: BsdWhere;
}

// Number of bsds per page
const FIRST = 25;

export function BSDList({
  siret,
  columns = DEFAULT_COLUMNS,
  blankslate,
  defaultWhere,
}: BSDListProps) {
  // As variables are modified by the UI filters,
  // we need to persist them so that subsequent call use the same variables
  const [bsdsVariables, setBsdsVariables] = React.useState<QueryBsdsArgs>({
    first: FIRST,
    where: defaultWhere,
  });

  const [lazyFetchBsds, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(GET_BSDS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const refetchBsds = React.useCallback(() => {
    lazyFetchBsds({
      variables: bsdsVariables,
    });
  }, [lazyFetchBsds, bsdsVariables]);

  useNotifier(siret, refetchBsds);

  // show the blankslate if the query returns no results without any filters
  // because if it returns no results with filters applied, it doesn't mean there are no results at all
  // it means that the criteria don't match any documents
  const { data: cachedData } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    GET_BSDS,
    {
      variables: {
        first: FIRST,
        where: defaultWhere,
      },
      // read from the cache only to avoid duplicate requests
      fetchPolicy: "cache-only",
    }
  );
  const showBlankslate = cachedData?.bsds.totalCount === 0;

  const refetchWithDefaultWhere = React.useCallback(
    ({ where, ...args }: { where?; args? }) => {
      const newVariables = {
        ...args,
        where: { ...where, ...defaultWhere },
        first: FIRST,
      };
      setBsdsVariables(newVariables);
      lazyFetchBsds({
        variables: newVariables,
      });
    },
    [lazyFetchBsds, defaultWhere]
  );

  const [layoutType, setLayoutType] = usePersistedState<LayoutType>(
    LAYOUT_LOCAL_STORAGE_KEY,
    value => LAYOUTS.find(layout => layout.type === value)?.type ?? "table"
  );
  const isMobile = useMedia({ maxWidth: MEDIA_QUERIES.handHeld });
  const currentLayout = LAYOUTS.find(layout => layout.type === layoutType)!;

  React.useEffect(() => {
    if (isMobile) {
      setLayoutType("cards");
    }
  }, [isMobile, setLayoutType]);

  return (
    <>
      <div className={styles.BSDListActions}>
        <BSDDropdown siret={siret} />
        <button
          className="btn btn--primary"
          onClick={() => refetchBsds()}
          disabled={loading}
        >
          Rafraîchir <IconRefresh style={{ marginLeft: "0.5rem" }} />
        </button>
      </div>
      {loading && <Loader />}
      {showBlankslate ? (
        blankslate
      ) : (
        <>
          <div className={styles.ButtonGroup} style={{ margin: "1rem" }}>
            {LAYOUTS.map(layout => (
              <button
                key={layout.type}
                type="button"
                className={classNames(
                  "btn btn--small",
                  layout.type === currentLayout.type
                    ? "btn--primary"
                    : "btn--outline-primary"
                )}
                onClick={() => setLayoutType(layout.type)}
              >
                {layout.label}
              </button>
            ))}
          </div>
          <currentLayout.Component
            bsds={data?.bsds.edges.map(edge => edge.node) ?? []}
            columns={columns}
            refetch={refetchWithDefaultWhere}
          />
          {data?.bsds.pageInfo.hasNextPage && (
            <div style={{ textAlign: "center" }}>
              <button
                className="center btn btn--primary small"
                onClick={() =>
                  fetchMore({
                    variables: {
                      after: data?.bsds.pageInfo.endCursor,
                    },
                    updateQuery: (prev, { fetchMoreResult }) => {
                      if (fetchMoreResult == null) {
                        return prev;
                      }

                      return {
                        ...prev,
                        bsds: {
                          ...prev.bsds,
                          ...fetchMoreResult.bsds,
                          edges: prev.bsds.edges.concat(
                            fetchMoreResult.bsds.edges
                          ),
                        },
                      };
                    },
                  })
                }
              >
                Charger plus de bordereaux
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
