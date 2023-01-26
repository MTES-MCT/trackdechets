import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { generatePath, useParams, useRouteMatch } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Breadcrumb, BreadcrumbItem } from "@dataesr/react-dsfr";
import routes from "../common/routes";
import { GET_BSDS } from "../common/queries";
import { Query, QueryBsdsArgs } from "generated/graphql/types";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";
import BsdCardList from "Apps/Dashboard/Components/BsdCardList/BsdCardList";
import {
  Blankslate,
  BlankslateTitle,
  BlankslateDescription,
  Loader,
} from "common/components";
import { BSDDropdown } from "dashboard/components/BSDList/BSDDropdown";
import {
  blankstate_action_desc,
  blankstate_action_title,
  blankstate_draft_desc,
  blankstate_draft_title,
  blankstate_follow_desc,
  blankstate_follow_title,
  blankstate_history_desc,
  blankstate_history_title,
  breadcrumb_archive,
  breadcrumb_brouillon,
  breadcrumb_pour_action,
  breadcrumb_suivi,
  breadcrumb_title,
  filter_reset_btn,
  filter_show_btn,
  load_more_bsds,
} from "assets/wordings/dashboard/wordingsDashboard";
import { IconDuplicateFile } from "common/components/Icons";
import Filters from "Apps/Dashboard/Components/Filters/Filters";
import { filterList } from "Apps/Dashboard/dashboardUtils";

import "./dashboard.scss";

const DashboardPage = () => {
  const isActTab = !!useRouteMatch(routes.dashboardv2.bsds.act);
  const isDraftTab = !!useRouteMatch(routes.dashboardv2.bsds.drafts);
  const isFollowTab = !!useRouteMatch(routes.dashboardv2.bsds.follow);
  const isArchivesTab = !!useRouteMatch(routes.dashboardv2.bsds.history);
  const BSD_PER_PAGE = 10;

  const { siret } = useParams<{ siret: string }>();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const resetFiltersBlockVisibility = () => {
    if (filterRef.current) {
      filterRef.current.style.display = "";
    }
  };

  const getPredicate = useCallback(() => {
    setIsFiltersOpen(false);
    resetFiltersBlockVisibility();
    if (isActTab) {
      return {
        isForActionFor: [siret],
      };
    }
    if (isDraftTab) {
      return {
        isDraftFor: [siret],
      };
    }
    if (isFollowTab) {
      return {
        isFollowFor: [siret],
      };
    }
    if (isArchivesTab) {
      return {
        isArchivedFor: [siret],
      };
    }
  }, [isActTab, isDraftTab, isFollowTab, isArchivesTab, siret]);
  const defaultWhere = useMemo(() => getPredicate(), [getPredicate]);

  const [bsdsVariables, setBsdsVariables] = useState<QueryBsdsArgs>({
    first: BSD_PER_PAGE,
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

  const refetchWithDefaultWhere = React.useCallback(
    ({ where, ...args }) => {
      const newVariables = {
        ...args,
        where: { ...where, ...defaultWhere },
        first: BSD_PER_PAGE,
      };
      setBsdsVariables(newVariables);
      lazyFetchBsds({
        variables: newVariables,
      });
    },
    [lazyFetchBsds, defaultWhere]
  );

  const { data: cachedData } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    GET_BSDS,
    {
      variables: {
        first: BSD_PER_PAGE,
        where: defaultWhere,
      },
      // read from the cache only to avoid duplicate requests
      fetchPolicy: "cache-only",
    }
  );

  useEffect(() => {
    refetchWithDefaultWhere({ where: defaultWhere });
  }, [isActTab, isDraftTab, defaultWhere, refetchWithDefaultWhere]);

  const getBreadcrumbItem = () => {
    if (isActTab) {
      return breadcrumb_pour_action;
    }
    if (isDraftTab) {
      return breadcrumb_brouillon;
    }
    if (isFollowTab) {
      return breadcrumb_suivi;
    }
    if (isArchivesTab) {
      return breadcrumb_archive;
    }
  };
  const getBlankstateTitle = () => {
    if (isActTab) {
      return blankstate_action_title;
    }
    if (isDraftTab) {
      return blankstate_draft_title;
    }
    if (isFollowTab) {
      return blankstate_follow_title;
    }
    if (isArchivesTab) {
      return blankstate_history_title;
    }
  };

  const getBlankstateDescription = () => {
    if (isActTab) {
      return blankstate_action_desc;
    }
    if (isDraftTab) {
      return (
        <>
          <span>{blankstate_draft_desc}</span>{" "}
          <span className="tw-inline-flex tw-ml-1">
            <IconDuplicateFile color="blueLight" />
          </span>
        </>
      );
    }
    if (isFollowTab) {
      return blankstate_follow_desc;
    }
    if (isArchivesTab) {
      return blankstate_history_desc;
    }
  };

  const toggleFiltersBlock = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const bsds = data?.bsds.edges;

  return (
    <div className="dashboard-page">
      <Breadcrumb>
        <BreadcrumbItem
          href={generatePath(routes.dashboardv2.index, {
            siret,
          })}
        >
          {breadcrumb_title}
        </BreadcrumbItem>
        <BreadcrumbItem>{getBreadcrumbItem()}</BreadcrumbItem>
      </Breadcrumb>
      {loading && <Loader />}
      <div className="dashboard-page__bsd-dropdown">
        <BSDDropdown siret={siret} />
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={toggleFiltersBlock}
        >
          {!isFiltersOpen ? filter_show_btn : filter_reset_btn}
        </button>
      </div>

      {cachedData?.bsds.totalCount === 0 && (
        <Blankslate>
          <BlankslateTitle>{getBlankstateTitle()}</BlankslateTitle>
          <BlankslateDescription>
            {getBlankstateDescription()}
          </BlankslateDescription>
        </Blankslate>
      )}
      <div>
        {!!data?.bsds.edges.length && (
          <>
            <div ref={filterRef}>
              {isFiltersOpen && <Filters filters={filterList} />}
            </div>
            <>
              <BsdCardList siret={siret} bsds={bsds!} />
            </>
          </>
        )}
      </div>

      {data?.bsds.pageInfo.hasNextPage && (
        <div className="dashboard-page__loadmore">
          <button
            className="fr-btn"
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
                      edges: prev.bsds.edges.concat(fetchMoreResult.bsds.edges),
                    },
                  };
                },
              })
            }
          >
            {load_more_bsds}
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
