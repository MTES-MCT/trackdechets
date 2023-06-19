import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouteMatch } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import { OrderType, Query, QueryBsdsArgs } from "generated/graphql/types";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";
import BsdCardList from "Apps/Dashboard/Components/BsdCardList/BsdCardList";
import {
  Blankslate,
  BlankslateTitle,
  BlankslateDescription,
  Loader,
} from "Apps/common/Components";
import {
  blankstate_action_desc,
  blankstate_action_title,
  blankstate_draft_desc,
  blankstate_draft_title,
  blankstate_follow_desc,
  blankstate_follow_title,
  blankstate_history_desc,
  blankstate_history_title,
  dropdown_create_btn,
  filter_reset_btn,
  filter_show_btn,
  load_more_bsds,
} from "Apps/common/wordings/dashboard/wordingsDashboard";
import { IconDuplicateFile } from "common/components/Icons";
import Filters from "Apps/common/Components/Filters/Filters";
import {
  filterList,
  dropdownCreateLinks,
  filterPredicates,
} from "../Apps/Dashboard/dashboardUtils";
import BsdCreateDropdown from "../Apps/common/Components/DropdownMenu/DropdownMenu";
import { BsdCurrentTab } from "Apps/common/types/commonTypes";

import "./dashboard.scss";

const DashboardPage = () => {
  const isActTab = !!useRouteMatch(routes.dashboardv2.bsds.act);
  const isDraftTab = !!useRouteMatch(routes.dashboardv2.bsds.drafts);
  const isFollowTab = !!useRouteMatch(routes.dashboardv2.bsds.follow);
  const isArchivesTab = !!useRouteMatch(routes.dashboardv2.bsds.history);
  const isReviewsTab = !!useRouteMatch(routes.dashboardv2.bsds.reviews);
  const isToCollectTab = !!useRouteMatch(
    routes.dashboardv2.transport.toCollect
  );
  const BSD_PER_PAGE = 25;

  const getBsdCurrentTab = (): BsdCurrentTab => {
    if (isDraftTab) {
      return "draftTab";
    }
    if (isActTab) {
      return "actTab";
    }
    if (isFollowTab) {
      return "followTab";
    }
    if (isArchivesTab) {
      return "archivesTab";
    }
    if (isReviewsTab) {
      return "reviewsTab";
    }
    if (isToCollectTab) {
      return "toCollectTab";
    }
    // default tab
    return "draftTab";
  };

  const bsdCurrentTab = getBsdCurrentTab();

  const { siret } = useParams<{ siret: string }>();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const withRoutePredicate = useCallback(() => {
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

  const defaultWhere = useMemo(
    () => withRoutePredicate(),
    [withRoutePredicate]
  );

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

  const fetchBsds = React.useCallback(() => {
    lazyFetchBsds({
      variables: bsdsVariables,
    });
  }, [lazyFetchBsds, bsdsVariables]);

  useNotifier(siret, fetchBsds);

  const fetchWithDefaultWhere = React.useCallback(
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
      variables: bsdsVariables,
      // read from the cache only to avoid duplicate requests
      fetchPolicy: "cache-only",
    }
  );

  const handleFiltersSubmit = React.useCallback(
    filterValues => {
      const variables = {
        where: {},
        order: {},
      };
      const routePredicate = withRoutePredicate();
      if (routePredicate) {
        variables.where = routePredicate;
      }
      const filterKeys = Object.keys(filterValues);
      const filters = filterList.filter(filter =>
        filterKeys.includes(filter.name)
      );
      filters.forEach(f => {
        const predicate = filterPredicates.find(
          filterPredicate => filterPredicate.filterName === f.name
        );
        if (predicate) {
          const filterValue = filterValues[f.name];
          variables.where = {
            ...variables.where,
            ...predicate.where(filterValue),
          };
          variables.order[predicate.order] = OrderType.Asc;
        }
      });
      setBsdsVariables(variables);
    },
    [withRoutePredicate]
  );

  const loadMoreBsds = React.useCallback(() => {
    setIsFetchingMore(true);
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
    }).then(() => {
      setIsFetchingMore(false);
    });
  }, [data?.bsds.pageInfo.endCursor, fetchMore]);

  useEffect(() => {
    setIsFiltersOpen(false);
    fetchWithDefaultWhere({ where: defaultWhere });
  }, [
    isActTab,
    isDraftTab,
    isFollowTab,
    isArchivesTab,
    defaultWhere,
    fetchWithDefaultWhere,
  ]);

  useEffect(() => {
    fetchBsds();
  }, [bsdsVariables, fetchBsds]);

  useEffect(() => {
    if (!isFiltersOpen) {
      fetchWithDefaultWhere({ where: defaultWhere });
    }
  }, [isFiltersOpen, defaultWhere, fetchWithDefaultWhere]);

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

  const bsds = !isReviewsTab ? data?.bsds.edges : null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__actions">
        <div className="create-btn">
          <BsdCreateDropdown
            links={dropdownCreateLinks(siret)}
            isDisabled={loading}
            menuTitle={dropdown_create_btn}
          />
        </div>
        <div className="filter-btn">
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            aria-expanded={isFiltersOpen}
            onClick={toggleFiltersBlock}
            disabled={loading}
          >
            {!isFiltersOpen ? filter_show_btn : filter_reset_btn}
          </button>
        </div>
      </div>
      {isFiltersOpen && (
        <Filters filters={filterList} onApplyFilters={handleFiltersSubmit} />
      )}
      {isFetchingMore && <Loader />}
      {loading && !isFetchingMore ? (
        <Loader />
      ) : (
        <>
          {cachedData?.bsds.totalCount === 0 && (
            <Blankslate>
              <BlankslateTitle>{getBlankstateTitle()}</BlankslateTitle>
              <BlankslateDescription>
                {getBlankstateDescription()}
              </BlankslateDescription>
            </Blankslate>
          )}

          {!!data?.bsds.edges.length && (
            <BsdCardList
              siret={siret}
              bsds={bsds!}
              bsdCurrentTab={bsdCurrentTab}
            />
          )}

          {!isReviewsTab && data?.bsds.pageInfo.hasNextPage && (
            <div className="dashboard-page__loadmore">
              <button
                className="fr-btn"
                onClick={loadMoreBsds}
                disabled={isFetchingMore}
              >
                {load_more_bsds}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(DashboardPage);
