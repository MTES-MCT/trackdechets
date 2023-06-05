import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouteMatch } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import {
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge,
  OrderType,
  PageInfo,
  Query,
  QueryBsdaRevisionRequestsArgs,
  QueryBsdsArgs,
  QueryFormRevisionRequestsArgs,
} from "generated/graphql/types";
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
  blankstate_reviews_desc,
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
import { GET_BSDA_REVISION_REQUESTS } from "Apps/common/queries/reviews/BsdaReviewQuery";
import { GET_FORM_REVISION_REQUESTS } from "Apps/common/queries/reviews/BsddReviewsQuery";

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

  const [bsdsReview, setBsdsReview] = useState<
    FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[]
  >([]);

  const [lazyFetchBsds, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(GET_BSDS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const { data: cachedData } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    GET_BSDS,
    {
      variables: bsdsVariables,
      // read from the cache only to avoid duplicate requests
      fetchPolicy: "cache-only",
    }
  );

  const fetchBsds = React.useCallback(() => {
    if (!isReviewsTab) {
      lazyFetchBsds({
        variables: bsdsVariables,
      });
    }
  }, [lazyFetchBsds, bsdsVariables, isReviewsTab]);

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

  const [
    fetchBsdaRevisions,
    {
      data: dataBsdaReviews,
      loading: loadingBsdaReviews,
      fetchMore: fetchMoreBsdaReviews,
    },
  ] = useLazyQuery<
    Pick<Query, "bsdaRevisionRequests"> & { pageInfo: PageInfo },
    QueryBsdaRevisionRequestsArgs
  >(GET_BSDA_REVISION_REQUESTS, {
    variables: {
      siret,
    },
    fetchPolicy: "cache-and-network",
  });

  const [
    fetchBsddRevisions,
    {
      data: dataBsddReviews,
      loading: loadingBsddReviews,
      fetchMore: fetchMoreBsddReviews,
    },
  ] = useLazyQuery<
    Pick<Query, "formRevisionRequests"> & { pageInfo: PageInfo },
    QueryFormRevisionRequestsArgs
  >(GET_FORM_REVISION_REQUESTS, {
    variables: {
      siret,
    },
    fetchPolicy: "cache-and-network",
  });

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

  const loadMoreBsddReviews = React.useCallback(() => {
    setIsFetchingMore(true);

    const reqBsddName = "formRevisionRequests";
    fetchMoreBsddReviews({
      variables: {
        after: dataBsddReviews?.formRevisionRequests.pageInfo.endCursor,
      },

      updateQuery: (prev, { fetchMoreResult }) => {
        if (fetchMoreResult == null) {
          return prev;
        }

        return {
          ...prev,
          [reqBsddName]: {
            ...prev[reqBsddName],
            ...fetchMoreResult[reqBsddName],
            edges: prev[reqBsddName].edges.concat(
              fetchMoreResult[reqBsddName].edges
            ),
          },
        };
      },
    })
      .then(() => {
        setIsFetchingMore(false);
      })
      .catch(error => {
        Sentry.captureException(error);
      });
  }, [
    dataBsddReviews?.formRevisionRequests.pageInfo.endCursor,
    fetchMoreBsddReviews,
  ]);
  const loadMoreBsdaReviews = React.useCallback(() => {
    setIsFetchingMore(true);

    fetchMoreBsdaReviews({
      variables: {
        after: dataBsdaReviews?.bsdaRevisionRequests.pageInfo.endCursor,
      },

      updateQuery: (prev, { fetchMoreResult }) => {
        if (fetchMoreResult == null) {
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
            ),
          },
        };
      },
    })
      .then(() => {
        setIsFetchingMore(false);
      })
      .catch(error => {
        Sentry.captureException(error);
      });
  }, [
    dataBsdaReviews?.bsdaRevisionRequests.pageInfo.endCursor,
    fetchMoreBsdaReviews,
  ]);

  const loadMore = () => {
    if (isReviewsTab) {
      loadMoreBsddReviews();
      loadMoreBsdaReviews();
    } else {
      loadMoreBsds();
    }
  };

  useEffect(() => {
    if (!isReviewsTab) {
      setIsFiltersOpen(false);
      fetchWithDefaultWhere({ where: defaultWhere });
    }
  }, [
    isActTab,
    isDraftTab,
    isFollowTab,
    isArchivesTab,
    isReviewsTab,
    defaultWhere,
    fetchWithDefaultWhere,
  ]);

  useEffect(() => {
    if (!isReviewsTab) {
      fetchBsds();
    }
  }, [isReviewsTab, bsdsVariables, fetchBsds]);

  useEffect(() => {
    if (isReviewsTab) {
      Promise.all([fetchBsddRevisions(), fetchBsdaRevisions()])
        .then(res => {
          const dataBsdd = res[0].data;
          const dataBsda = res[1].data;
          if (!!dataBsdd && dataBsdd["formRevisionRequests"]?.edges?.length) {
            setBsdsReview(
              (
                prevState
              ): FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[] => {
                return [
                  ...new Set([
                    ...prevState,
                    ...dataBsdd["formRevisionRequests"].edges,
                  ]),
                ] as FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[];
              }
            );
          }

          if (!!dataBsda && dataBsda["bsdaRevisionRequests"]?.edges?.length) {
            setBsdsReview(
              (
                prevState
              ): FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[] => {
                return [
                  ...new Set([
                    ...prevState,
                    ...dataBsda["bsdaRevisionRequests"].edges,
                  ]),
                ] as FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[];
              }
            );
          }
        })
        .catch(error => {
          Sentry.captureException(error);
        });
    }
  }, [isReviewsTab, fetchBsddRevisions, fetchBsdaRevisions]);

  useEffect(() => {
    if (!isReviewsTab && !isFiltersOpen) {
      fetchWithDefaultWhere({ where: defaultWhere });
    }
  }, [isFiltersOpen, defaultWhere, isReviewsTab, fetchWithDefaultWhere]);

  const getBlankstateTitle = (): string | undefined => {
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
    if (isReviewsTab) {
      return blankstate_reviews_desc;
    }
  };

  const toggleFiltersBlock = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const bsds = !isReviewsTab ? data?.bsds.edges : bsdsReview;

  const bsdsTotalCount = isReviewsTab
    ? bsdsReview?.length
    : cachedData?.bsds.totalCount;

  const hasNextPage = isReviewsTab
    ? dataBsdaReviews?.pageInfo?.hasNextPage! ||
      dataBsddReviews?.pageInfo?.hasNextPage!
    : data?.bsds.pageInfo.hasNextPage;

  const isLoadingBsds = isReviewsTab
    ? loadingBsdaReviews || loadingBsddReviews
    : loading;

  return (
    <div className="dashboard-page">
      {!isReviewsTab && (
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
      )}
      {isFiltersOpen && (
        <Filters filters={filterList} onApplyFilters={handleFiltersSubmit} />
      )}
      {isFetchingMore && <Loader />}
      {isLoadingBsds && !isFetchingMore ? (
        <Loader />
      ) : (
        <>
          {!Boolean(bsdsTotalCount) && (
            <Blankslate>
              {getBlankstateTitle() && (
                <BlankslateTitle>{getBlankstateTitle()}</BlankslateTitle>
              )}
              <BlankslateDescription>
                {getBlankstateDescription()}
              </BlankslateDescription>
            </Blankslate>
          )}

          {Boolean(bsdsTotalCount) && (
            <BsdCardList
              siret={siret}
              bsds={bsds!}
              bsdCurrentTab={bsdCurrentTab}
            />
          )}

          {hasNextPage && (
            <div className="dashboard-page__loadmore">
              <button
                className="fr-btn"
                onClick={loadMore}
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
