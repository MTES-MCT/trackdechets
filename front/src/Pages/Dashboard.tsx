import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useMatch, useLocation } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import {
  Query,
  QueryBsdsArgs,
  QueryCompanyPrivateInfosArgs
} from "@td/codegen-ui";
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
import { UserPermission } from "@td/codegen-ui";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../Apps/common/queries/company/query";
import {
  filtersToQueryBsdsArgs,
  getBlankslateDescription,
  getBlankslateTitle,
  getRoutePredicate,
  Tabs
} from "./Dashboard.utils";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";
import { NotificationError } from "../Apps/common/Components/Error/Error";

import "./dashboard.scss";

const DashboardPage = () => {
  const { permissions } = usePermissions();
  const isActTab = !!useMatch(routes.dashboard.bsds.act);
  const isDraftTab = !!useMatch(routes.dashboard.bsds.drafts);
  const isFollowTab = !!useMatch(routes.dashboard.bsds.follow);
  const isArchivesTab = !!useMatch(routes.dashboard.bsds.history);
  const isToReviewTab = !!useMatch(routes.dashboard.bsds.toReview);
  const isReviewedTab = !!useMatch(routes.dashboard.bsds.reviewed);
  const isToCollectTab = !!useMatch(routes.dashboard.transport.toCollect);
  const isCollectedTab = !!useMatch(routes.dashboard.transport.collected);
  const isReturnTab = !!useMatch(routes.dashboard.transport.returns);
  const isAllBsdsTab = !!useMatch(routes.dashboard.bsds.index);
  const location = useLocation();

  const BSD_PER_PAGE = 25;
  const bsdCurrentTab = getBsdCurrentTab({
    isDraftTab,
    isActTab,
    isFollowTab,
    isArchivesTab,
    isToCollectTab,
    isCollectedTab,
    isReviewedTab,
    isToReviewTab,
    isReturnTab
  });
  const { siret } = useParams<{ siret: string }>();
  const [areAdvancedFiltersOpen, setAreAdvancedFiltersOpen] = useState(false);

  const [bsdsVariables, setBsdsVariables] = useState<QueryBsdsArgs>({
    first: BSD_PER_PAGE
  });

  const [lazyFetchBsds, { data, loading, error, fetchMore }] = useLazyQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(GET_BSDS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    // permet d'afficher les bordereaux (en plus de l'erreur)
    // en cas de réponse partielle
    errorPolicy: "all"
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
      isReviewedTab,
      isToReviewTab,
      isReturnTab
    }),
    [
      isActTab,
      isAllBsdsTab,
      isArchivesTab,
      isCollectedTab,
      isDraftTab,
      isFollowTab,
      isReviewedTab,
      isToCollectTab,
      isToReviewTab,
      isReturnTab
    ]
  );

  // Fetches the BSDs, building up the query. Query includes:
  // - Current company SIRET
  // - Current active tab
  // - Current filters
  const fetchBsds = useCallback(
    (newSiret, newVariables, newTabs) => {
      const variables = { ...newVariables };

      const routePredicate = getRoutePredicate({
        ...newTabs,
        siret: newSiret
      });

      if (routePredicate) {
        if (newVariables?.where?._and?.length) {
          variables.where = {
            ...routePredicate,
            _and: [...newVariables.where._and]
          };
        } else {
          variables.where = { ...routePredicate };
        }
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
    fetchBsds(siret, bsdsVariables, tabs);
  });

  useEffect(() => {
    fetchBsds(siret, bsdsVariables, tabs);
  }, [bsdsVariables, siret, tabs, fetchBsds]);

  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

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

  const toggleFiltersBlock = () => {
    setAreAdvancedFiltersOpen(!areAdvancedFiltersOpen);
  };

  const bsds = data?.bsds.edges;
  const bsdsTotalCount = data?.bsds.totalCount;
  const hasNextPage = data?.bsds.pageInfo.hasNextPage;
  const isLoadingBsds = loading;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__actions">
        {permissions.includes(UserPermission.BsdCanCreate) && (
          <div className="create-btn">
            <BsdCreateDropdown
              links={dropdownCreateLinks(siret, location)}
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

      {isLoadingBsds && <Loader />}
      {error && <NotificationError apolloError={error} />}

      {!error && !Boolean(bsdsTotalCount) && !isLoadingBsds && (
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
            onClick={loadMoreBsds}
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
