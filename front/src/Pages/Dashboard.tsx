import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useMatch } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import {
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge,
  PageInfo,
  Query,
  QueryBsdaRevisionRequestsArgs,
  QueryBsdsArgs,
  QueryCompanyPrivateInfosArgs,
  QueryFormRevisionRequestsArgs
} from "codegen-ui";
import BsdCardList from "../Apps/Dashboard/Components/BsdCardList/BsdCardList";
import {
  Blankslate,
  BlankslateTitle,
  BlankslateDescription,
  Loader
} from "../Apps/common/Components";
import {
  dropdown_create_btn,
  filter_reset_btn,
  filter_show_btn,
  load_more_bsds
} from "../Apps/common/wordings/dashboard/wordingsDashboard";
import Filters from "../Apps/common/Components/Filters/Filters";
import {
  dropdownCreateLinks,
  getBsdCurrentTab
} from "../Apps/Dashboard/dashboardUtils";
import BsdCreateDropdown from "../Apps/common/Components/DropdownMenu/DropdownMenu";
import { usePermissions } from "../common/contexts/PermissionsContext";
import { UserPermission } from "codegen-ui";
import { GET_BSDA_REVISION_REQUESTS } from "../Apps/common/queries/reviews/BsdaReviewQuery";
import { GET_FORM_REVISION_REQUESTS } from "../Apps/common/queries/reviews/BsddReviewsQuery";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../Apps/common/queries/company/query";

import "./dashboard.scss";
import {
  filtersToQueryBsdsArgs,
  getBlankslateDescription,
  getBlankslateTitle,
  getRoutePredicate,
  Tabs
} from "./Dashboard.utils";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";

const DashboardPage = () => {
  const { permissions } = usePermissions();
  const isActTab = !!useMatch(routes.dashboardv2.bsds.act);
  const isDraftTab = !!useMatch(routes.dashboardv2.bsds.drafts);
  const isFollowTab = !!useMatch(routes.dashboardv2.bsds.follow);
  const isArchivesTab = !!useMatch(routes.dashboardv2.bsds.history);
  const isReviewsTab = !!useMatch(routes.dashboardv2.bsds.reviews);
  // const isToReviewedTab = !!useMatch(routes.dashboardv2.bsds.toReviewed);
  // const isReviewedTab = !!useMatch(routes.dashboardv2.bsds.reviewed);
  const isToCollectTab = !!useMatch(routes.dashboardv2.transport.toCollect);
  const isCollectedTab = !!useMatch(routes.dashboardv2.transport.collected);
  const isAllBsdsTab = !!useMatch(routes.dashboardv2.bsds.index);

  const BSD_PER_PAGE = 25;
  const bsdCurrentTab = getBsdCurrentTab({
    isDraftTab,
    isActTab,
    isFollowTab,
    isArchivesTab,
    isReviewsTab,
    isToCollectTab,
    isCollectedTab
    // isReviewedTab,
    // isToReviewedTab,
  });
  const { siret } = useParams<{ siret: string }>();
  const [areAdvancedFiltersOpen, setAreAdvancedFiltersOpen] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [bsdsVariables, setBsdsVariables] = useState<QueryBsdsArgs>({
    first: BSD_PER_PAGE
  });

  const [lazyFetchBsds, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(GET_BSDS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true
  });

  const tabs: Tabs = useMemo(
    () => ({
      isActTab,
      isDraftTab,
      isFollowTab,
      isArchivesTab,
      isToCollectTab,
      isCollectedTab,
      isAllBsdsTab,
      isReviewsTab
    }),
    [
      isActTab,
      isAllBsdsTab,
      isArchivesTab,
      isCollectedTab,
      isDraftTab,
      isFollowTab,
      isReviewsTab,
      isToCollectTab
    ]
  );

  // Fetches the BSDs, building up the query. Query includes:
  // - Current company SIRET
  // - Current active tab
  // - Current filters
  const fetchBsds = useCallback(
    (newSiret, newVariables, newTabs) => {
      const variables = { ...newVariables };

      const routePredicate = getRoutePredicate({ ...newTabs, siret: newSiret });

      if (routePredicate) {
        variables.where = { ...newVariables.where, ...routePredicate };
      }

      lazyFetchBsds({ variables });
    },
    [lazyFetchBsds]
  );

  const handleFiltersSubmit = filterValues => {
    // Transform the filters into a GQL query
    const variables = filtersToQueryBsdsArgs(filterValues, bsdsVariables);

    // Store the new filters
    setBsdsVariables(variables);
  };

  // Be notified if someone else modifies bsds
  useNotifier(siret!, () => {
    if (!tabs.isReviewsTab) {
      fetchBsds(siret, bsdsVariables, tabs);
    }
  });

  const [
    fetchBsdaRevisions,
    {
      data: dataBsdaReviews,
      loading: loadingBsdaReviews,
      fetchMore: fetchMoreBsdaReviews
    }
  ] = useLazyQuery<
    Pick<Query, "bsdaRevisionRequests"> & { pageInfo: PageInfo },
    QueryBsdaRevisionRequestsArgs
  >(GET_BSDA_REVISION_REQUESTS, {
    variables: {
      siret: siret!
    },
    fetchPolicy: "cache-and-network"
  });

  // A supprimer quand on pourra afficher une révision avec la requete bsds
  const [
    fetchBsddRevisions,
    {
      data: dataBsddReviews,
      loading: loadingBsddReviews,
      fetchMore: fetchMoreBsddReviews
    }
  ] = useLazyQuery<
    Pick<Query, "formRevisionRequests"> & { pageInfo: PageInfo },
    QueryFormRevisionRequestsArgs
  >(GET_FORM_REVISION_REQUESTS, {
    variables: {
      siret: siret!
    },
    fetchPolicy: "cache-and-network"
  });

  useEffect(() => {
    // Reviews are special: no filter, reset everything and fetch the fresh data. Fix incoming
    if (tabs.isReviewsTab) {
      setAreAdvancedFiltersOpen(false);
      fetchBsddRevisions();
      fetchBsdaRevisions();
    } else {
      fetchBsds(siret, bsdsVariables, tabs);
    }
  }, [
    bsdsVariables,
    siret,
    tabs,
    fetchBsds,
    fetchBsddRevisions,
    fetchBsdaRevisions
  ]);

  const { data: companyData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: siret! }
  });

  const siretsWithAutomaticSignature = companyData
    ? companyData.companyPrivateInfos.receivedSignatureAutomations.map(
        automation => automation.from.siret
      )
    : [];

  const loadMoreBsds = React.useCallback(() => {
    fetchMore({
      variables: {
        after: data?.bsds.pageInfo.endCursor
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (fetchMoreResult === null) {
          return prev;
        }

        return {
          ...prev,
          bsds: {
            ...prev.bsds,
            ...fetchMoreResult.bsds,
            edges: prev.bsds.edges.concat(fetchMoreResult.bsds.edges)
          }
        };
      }
    });
  }, [data?.bsds.pageInfo.endCursor, fetchMore]);

  // A supprimer quand on pourra afficher une révision avec la requete bsds
  const loadMoreBsddReviews = React.useCallback(() => {
    setIsFetchingMore(true);

    const reqBsddName = "formRevisionRequests";
    fetchMoreBsddReviews({
      variables: {
        after: dataBsddReviews?.formRevisionRequests.pageInfo.endCursor
      },

      updateQuery: (prev, { fetchMoreResult }) => {
        if (fetchMoreResult === null) {
          return prev;
        }

        return {
          ...prev,
          [reqBsddName]: {
            ...prev[reqBsddName],
            ...fetchMoreResult[reqBsddName],
            edges: prev[reqBsddName].edges.concat(
              fetchMoreResult[reqBsddName].edges
            )
          }
        };
      }
    })
      .then(() => {
        setIsFetchingMore(false);
      })
      .catch(error => {
        Sentry.captureException(error);
      });
  }, [
    dataBsddReviews?.formRevisionRequests.pageInfo.endCursor,
    fetchMoreBsddReviews
  ]);

  // A supprimer quand on pourra afficher une révision avec la requete bsds
  const loadMoreBsdaReviews = React.useCallback(() => {
    setIsFetchingMore(true);

    fetchMoreBsdaReviews({
      variables: {
        after: dataBsdaReviews?.bsdaRevisionRequests.pageInfo.endCursor
      },

      updateQuery: (prev, { fetchMoreResult }) => {
        if (fetchMoreResult === null) {
          return prev;
        }
        const reqBsdaName = "bsdaRevisionRequests";
        return {
          ...prev,
          bsdaRevisionRequests: {
            ...prev[reqBsdaName],
            ...fetchMoreResult[reqBsdaName],
            edges: prev[reqBsdaName].edges.concat(
              fetchMoreResult[reqBsdaName].edges
            )
          }
        };
      }
    })
      .then(() => {
        setIsFetchingMore(false);
      })
      .catch(error => {
        Sentry.captureException(error);
      });
  }, [
    dataBsdaReviews?.bsdaRevisionRequests.pageInfo.endCursor,
    fetchMoreBsdaReviews
  ]);

  const loadMoreReviews = () => {
    // A supprimer quand on pourra afficher une révision avec la requete bsds
    loadMoreBsddReviews();
    loadMoreBsdaReviews();
  };

  const toggleFiltersBlock = () => {
    setAreAdvancedFiltersOpen(!areAdvancedFiltersOpen);
  };

  // A supprimer la condition isReviewsTab quand on pourra afficher une révision avec la requete bsds
  const bsdsReview = [
    ...(dataBsddReviews?.formRevisionRequests.edges || []),
    ...(dataBsdaReviews?.bsdaRevisionRequests.edges || [])
  ] as FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[];
  const bsds = !isReviewsTab ? data?.bsds.edges : bsdsReview;
  const bsdsTotalCount = isReviewsTab
    ? bsdsReview?.length
    : data?.bsds.totalCount;
  const hasNextPage = isReviewsTab
    ? dataBsdaReviews?.bsdaRevisionRequests?.pageInfo?.hasNextPage ||
      dataBsddReviews?.formRevisionRequests.pageInfo?.hasNextPage
    : data?.bsds.pageInfo.hasNextPage;
  const isLoadingBsds = isReviewsTab
    ? loadingBsdaReviews || loadingBsddReviews || isFetchingMore
    : loading;

  return (
    <div className="dashboard-page">
      {/* A supprimer la condition isReviewsTab 
          quand on pourra afficher une révision avec la requete bsds
       */}
      {!isReviewsTab && (
        <>
          <div className="dashboard-page__actions">
            {permissions.includes(UserPermission.BsdCanCreate) && (
              <div className="create-btn">
                <BsdCreateDropdown
                  links={dropdownCreateLinks(siret)}
                  isDisabled={loading}
                  menuTitle={dropdown_create_btn}
                  primary
                />
              </div>
            )}
            <div className="filter-btn">
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                aria-expanded={areAdvancedFiltersOpen}
                onClick={toggleFiltersBlock}
                disabled={loading}
              >
                {!areAdvancedFiltersOpen ? filter_show_btn : filter_reset_btn}
              </button>
            </div>
          </div>
          <Filters
            onApplyFilters={handleFiltersSubmit}
            areAdvancedFiltersOpen={areAdvancedFiltersOpen}
          />
        </>
      )}
      {isLoadingBsds && <Loader />}
      {!Boolean(bsdsTotalCount) && !isLoadingBsds && (
        <div className="dashboard-page__blankstate">
          <Blankslate>
            {getBlankslateTitle(tabs) && (
              <BlankslateTitle>{getBlankslateTitle(tabs)}</BlankslateTitle>
            )}
            <BlankslateDescription>
              {getBlankslateDescription(tabs)}
            </BlankslateDescription>
          </Blankslate>
        </div>
      )}

      {Boolean(bsdsTotalCount) && (
        <BsdCardList
          siret={siret!}
          bsds={bsds!}
          bsdCurrentTab={bsdCurrentTab}
          siretsWithAutomaticSignature={siretsWithAutomaticSignature}
        />
      )}

      {hasNextPage && (
        <div className="dashboard-page__loadmore">
          <button
            className="fr-btn"
            onClick={tabs.isReviewsTab ? loadMoreReviews : loadMoreBsds}
            disabled={isLoadingBsds}
          >
            {load_more_bsds}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardPage);
