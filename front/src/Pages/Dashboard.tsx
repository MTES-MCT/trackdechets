import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouteMatch } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import {
  BsdWhere,
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge,
  OrderType,
  PageInfo,
  Query,
  QueryBsdaRevisionRequestsArgs,
  QueryBsdsArgs,
  QueryCompanyPrivateInfosArgs,
  QueryFormRevisionRequestsArgs
} from "codegen-ui";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";
import BsdCardList from "../Apps/Dashboard/Components/BsdCardList/BsdCardList";
import {
  Blankslate,
  BlankslateTitle,
  BlankslateDescription,
  Loader
} from "../Apps/common/Components";
import {
  blankstate_action_desc,
  blankstate_action_title,
  blankstate_default_desc,
  blankstate_default_title,
  blankstate_draft_desc,
  blankstate_draft_title,
  blankstate_follow_desc,
  blankstate_follow_title,
  blankstate_history_desc,
  blankstate_history_title,
  blankstate_reviews_desc,
  blankstate_reviews_title,
  dropdown_create_btn,
  filter_reset_btn,
  filter_show_btn,
  load_more_bsds
} from "../Apps/common/wordings/dashboard/wordingsDashboard";
import { IconDuplicateFile } from "../Apps/common/Components/Icons/Icons";
import Filters from "../Apps/common/Components/Filters/Filters";
import {
  dropdownCreateLinks,
  filterList,
  filterPredicates,
  getBsdCurrentTab
} from "../Apps/Dashboard/dashboardUtils";
import BsdCreateDropdown from "../Apps/common/Components/DropdownMenu/DropdownMenu";
import { usePermissions } from "../common/contexts/PermissionsContext";
import { UserPermission } from "codegen-ui";
import { GET_BSDA_REVISION_REQUESTS } from "../Apps/common/queries/reviews/BsdaReviewQuery";
import { GET_FORM_REVISION_REQUESTS } from "../Apps/common/queries/reviews/BsddReviewsQuery";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../Apps/common/queries/company/query";

import "./dashboard.scss";

const DashboardPage = () => {
  const { permissions } = usePermissions();
  const isActTab = !!useRouteMatch(routes.dashboardv2.bsds.act);
  const isDraftTab = !!useRouteMatch(routes.dashboardv2.bsds.drafts);
  const isFollowTab = !!useRouteMatch(routes.dashboardv2.bsds.follow);
  const isArchivesTab = !!useRouteMatch(routes.dashboardv2.bsds.history);
  const isReviewsTab = !!useRouteMatch(routes.dashboardv2.bsds.reviews);
  // const isToReviewedTab = !!useRouteMatch(routes.dashboardv2.bsds.toReviewed);
  // const isReviewedTab = !!useRouteMatch(routes.dashboardv2.bsds.reviewed);
  const isToCollectTab = !!useRouteMatch(
    routes.dashboardv2.transport.toCollect
  );
  const isCollectedTab = !!useRouteMatch(
    routes.dashboardv2.transport.collected
  );
  const isAllBsdsTab = !!useRouteMatch(routes.dashboardv2.bsds.index);

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

  const withRoutePredicate = useCallback(() => {
    if (isActTab) {
      return {
        isForActionFor: [siret]
      };
    }
    if (isDraftTab) {
      return {
        isDraftFor: [siret]
      };
    }
    if (isFollowTab) {
      return {
        isFollowFor: [siret]
      };
    }
    if (isArchivesTab) {
      return {
        isArchivedFor: [siret]
      };
    }
    if (isToCollectTab) {
      return {
        isToCollectFor: [siret]
      };
    }
    if (isCollectedTab) {
      return {
        isCollectedFor: [siret]
      };
    }
    if (isAllBsdsTab) {
      return {
        isDraftFor: [siret],
        isForActionFor: [siret],
        isFollowFor: [siret],
        isArchivedFor: [siret]
      };
    }
    // if (isReviewsTab) {
    //   return {
    //     isRevisedFor: [siret],
    //     isInRevisionFor: [siret],
    //   };
    // }
    // if (isToReviewedTab) {
    //   return {
    //     isInRevisionFor: [siret],
    //   };
    // }
    // if (isReviewedTab) {
    //   return {
    //     isRevisedFor: [siret],
    //   };
    // }
  }, [
    isActTab,
    isDraftTab,
    isFollowTab,
    isArchivesTab,
    isToCollectTab,
    isCollectedTab,
    isAllBsdsTab,
    // isReviewsTab,
    // isToReviewedTab,
    // isReviewedTab,
    siret
  ]);

  const defaultWhere = useMemo(
    () => withRoutePredicate(),
    [withRoutePredicate]
  );

  const [bsdsVariables, setBsdsVariables] = useState<QueryBsdsArgs>({
    first: BSD_PER_PAGE,
    where: defaultWhere
  });

  const [bsdsReview, setBsdsReview] = useState<
    FormRevisionRequestEdge[] | BsdaRevisionRequestEdge[]
  >([]);

  const [lazyFetchBsds, { data, loading, fetchMore }] = useLazyQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(GET_BSDS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true
  });
  const { data: cachedData } = useQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
    GET_BSDS,
    {
      variables: bsdsVariables,
      // read from the cache only to avoid duplicate requests
      fetchPolicy: "cache-only"
    }
  );

  const fetchBsds = React.useCallback(() => {
    if (!isReviewsTab) {
      lazyFetchBsds({
        variables: bsdsVariables
      });
    }
  }, [lazyFetchBsds, bsdsVariables, isReviewsTab]);

  useNotifier(siret, fetchBsds);

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
      siret
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
      siret
    },
    fetchPolicy: "cache-and-network"
  });

  const { data: companyData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: siret }
  });

  const siretsWithAutomaticSignature = companyData
    ? companyData.companyPrivateInfos.receivedSignatureAutomations.map(
        automation => automation.from.siret
      )
    : [];

  const handleFiltersSubmit = React.useCallback(
    filterValues => {
      const variables = {
        where: {} as BsdWhere,
        order: {}
      };
      const routePredicate = withRoutePredicate();
      if (routePredicate) {
        variables.where = routePredicate;
      }
      const filterKeys = Object.keys(filterValues);
      const filters = filterList.filter(filter =>
        filterKeys.includes(filter.name)
      );

      // Careful. Multiple filters might use '_and', let's not override
      // it each iteration because of key uniqueness
      let _ands: BsdWhere[] = [];

      filters.forEach(f => {
        const predicate = filterPredicates.find(
          filterPredicate => filterPredicate.filterName === f.name
        );
        if (predicate) {
          const filterValue = filterValues[f.name];
          const { _and, ...wheres } = predicate.where(filterValue);

          // Store the '_and' filters separately
          if (_and) _ands = [..._ands, ..._and];

          variables.where = {
            ...variables.where,
            ...wheres
          };
          variables.order[predicate.order] = OrderType.Asc;
        }
      });

      // Add all the compiled '_and', if any
      if (_ands.length) variables.where._and = _ands;

      setBsdsVariables(variables);
    },
    [withRoutePredicate]
  );

  const loadMoreBsds = React.useCallback(() => {
    setIsFetchingMore(true);
    fetchMore({
      variables: {
        after: data?.bsds.pageInfo.endCursor
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
            edges: prev.bsds.edges.concat(fetchMoreResult.bsds.edges)
          }
        };
      }
    }).then(() => {
      setIsFetchingMore(false);
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

  const loadMore = () => {
    if (isReviewsTab) {
      // A supprimer quand on pourra afficher une révision avec la requete bsds
      loadMoreBsddReviews();
      loadMoreBsdaReviews();
    } else {
      loadMoreBsds();
    }
  };

  useEffect(() => {
    // If revisions tab, close the filters
    if (isReviewsTab) {
      setAreAdvancedFiltersOpen(false);
    }
  }, [isReviewsTab]);

  useEffect(() => {
    // A supprimer la condition !isReviewsTab quand on pourra afficher une révision avec la requete bsds
    if (!isReviewsTab) {
      fetchBsds();
    }
  }, [isReviewsTab, bsdsVariables, fetchBsds]);

  // A supprimer quand on pourra afficher une révision avec la requete bsds
  useEffect(() => {
    if (isReviewsTab) {
      setBsdsReview([]);
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
                    ...dataBsdd["formRevisionRequests"].edges
                  ])
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
                    ...dataBsda["bsdaRevisionRequests"].edges
                  ])
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
    if (isReviewsTab) {
      return blankstate_reviews_title;
    }
    return blankstate_default_title;
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
    return blankstate_default_desc;
  };

  const toggleFiltersBlock = () => {
    setAreAdvancedFiltersOpen(!areAdvancedFiltersOpen);
  };

  // A supprimer la condition isReviewsTab quand on pourra afficher une révision avec la requete bsds
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
      {(isFetchingMore || isLoadingBsds) && <Loader />}
      {!Boolean(bsdsTotalCount) && !isLoadingBsds && (
        <div className="dashboard-page__blankstate">
          <Blankslate>
            {getBlankstateTitle() && (
              <BlankslateTitle>{getBlankstateTitle()}</BlankslateTitle>
            )}
            <BlankslateDescription>
              {getBlankstateDescription()}
            </BlankslateDescription>
          </Blankslate>
        </div>
      )}

      {Boolean(bsdsTotalCount) && (
        <BsdCardList
          siret={siret}
          bsds={bsds!}
          bsdCurrentTab={bsdCurrentTab}
          siretsWithAutomaticSignature={siretsWithAutomaticSignature}
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
    </div>
  );
};

export default React.memo(DashboardPage);
