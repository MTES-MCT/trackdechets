import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { useParams, useMatch, useLocation } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import * as Sentry from "@sentry/browser";
import routes from "../Apps/routes";
import { GET_BSDS } from "../Apps/common/queries";
import { Query, QueryBsdsArgs } from "@td/codegen-ui";
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
import {
  filtersToQueryBsdsArgs,
  getBlankslateDescription,
  getBlankslateTitle,
  getRoutePredicate,
  Tabs
} from "./Dashboard.utils";
import { useNotifier } from "../dashboard/components/BSDList/useNotifier";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import throttle from "lodash/throttle";

import "./dashboard.scss";
import { useMyCompany } from "../Apps/common/hooks/useMyCompany";

const DashboardPage = () => {
  const { siret } = useParams<{ siret: string | undefined }>();
  const {
    orgPermissions: { permissions }
  } = usePermissions(siret);
  const { company } = useMyCompany(siret);
  const isActTab = !!useMatch(routes.dashboard.bsds.act);
  const isDraftTab = !!useMatch(routes.dashboard.bsds.drafts);
  const isFollowTab = !!useMatch(routes.dashboard.bsds.follow);
  const isArchivesTab = !!useMatch(routes.dashboard.bsds.history);
  const isPendingRevisionForTab = !!useMatch(
    routes.dashboard.revisions.pending
  );
  const isEmittedRevisionForTab = !!useMatch(
    routes.dashboard.revisions.emitted
  );
  const isReceivedRevisionForTab = !!useMatch(
    routes.dashboard.revisions.received
  );
  const isReviewedRevisionForTab = !!useMatch(
    routes.dashboard.revisions.reviewed
  );
  const isToCollectTab = !!useMatch(routes.dashboard.transport.toCollect);
  const isCollectedTab = !!useMatch(routes.dashboard.transport.collected);
  const isReturnTab = !!useMatch(routes.dashboard.transport.return);
  const isAllBsdsTab = !!useMatch(routes.dashboard.bsds.index);
  const location = useLocation();
  const prevPathname = useRef(location.pathname);

  const BSD_PER_PAGE = 25;
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
      isPendingRevisionForTab,
      isEmittedRevisionForTab,
      isReceivedRevisionForTab,
      isReviewedRevisionForTab,
      isReturnTab
    }),
    [
      isActTab,
      isAllBsdsTab,
      isArchivesTab,
      isCollectedTab,
      isDraftTab,
      isFollowTab,
      isToCollectTab,
      isPendingRevisionForTab,
      isEmittedRevisionForTab,
      isReceivedRevisionForTab,
      isReviewedRevisionForTab,
      isReturnTab
    ]
  );

  // Fetches the BSDs, building up the query. Query includes:
  // - Current company SIRET
  // - Current active tab
  // - Current filters
  const fetchBsds = useCallback(
    (newSiret, newVariables, newTabs) => {
      if (!newSiret) return;
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

  const throttledFetchBsds = useMemo(
    () => throttle(fetchBsds, 500),
    [fetchBsds]
  );

  const handleFiltersSubmit = filterValues => {
    // Transform the filters into a GQL query
    const variables = filtersToQueryBsdsArgs(filterValues, bsdsVariables);

    // Store the new filters
    setBsdsVariables(variables);
  };

  // Be notified if someone else modifies bsds
  useNotifier(siret!, () => {
    throttledFetchBsds(siret, bsdsVariables, tabs);
  });

  useEffect(() => {
    // Flush throttle dès que la route change
    if (prevPathname.current !== location.pathname) {
      throttledFetchBsds.flush();
      prevPathname.current = location.pathname;
    }
  }, [location.pathname, throttledFetchBsds]);

  useEffect(() => {
    if (!siret) return;
    throttledFetchBsds(siret, bsdsVariables, tabs);
  }, [bsdsVariables, siret, tabs, throttledFetchBsds]);

  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  const siretsWithAutomaticSignature = useMemo(() => {
    return company
      ? company.receivedSignatureAutomations.map(
          automation => automation.from.siret
        )
      : [];
  }, [company]);

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

  const bsds = useMemo(() => data?.bsds.edges ?? [], [data?.bsds.edges]);

  const bsdsTotalCount = data?.bsds.totalCount;
  const hasNextPage = data?.bsds.pageInfo.hasNextPage;
  const isLoadingBsds = loading;
  const bsdCurrentTab = useMemo(() => getBsdCurrentTab(tabs), [tabs]);

  return (
    <div role="feed" aria-busy={isLoadingBsds}>
      <div className="dashboard-page__actions">
        {permissions.includes(UserPermission.BsdCanCreate) && (
          <div className="create-btn">
            <BsdCreateDropdown
              links={dropdownCreateLinks(siret, location)}
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
