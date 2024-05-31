import React, { useCallback, useState } from "react";
import { NavLink, generatePath, useNavigate } from "react-router-dom";
import {
  CompanyPrivate,
  Query,
  QueryBsdsArgs,
  UserPermission,
  UserRole
} from "@td/codegen-ui";
import routes from "../../../routes";

import { useShowTransportTabs } from "../../hooks/useShowTransportTabs";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import {
  ACTS,
  ALL_BSDS,
  ARCHIVES,
  COLLECTED,
  DRAFTS,
  FOLLOWS,
  REVIEWED,
  REVIEWS,
  TO_COLLECT,
  TO_REVIEW,
  TRANSPORT
} from "../../../common/wordings/dashboard/wordingsDashboard";

import "./DashboardTabs.scss";
import CompanySwitcher from "../../../common/Components/CompanySwitcher/CompanySwitcher";
import { gql, useQuery } from "@apollo/client";
import { useNotifier } from "../../../../dashboard/components/BSDList/useNotifier";

const NOTIFICATION_QUERY = gql`
  query GetBsds($where: BsdWhere) {
    bsds(first: 1, where: $where) {
      totalCount
    }
  }
`;

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

const displayNotification = (count, isReaderRole) => {
  return !isReaderRole && count && count > 0 ? (
    <p className="dashboard-tabs-notifications">{count}</p>
  ) : null;
};

const DashboardTabs = ({ currentCompany, companies }: DashboardTabsProps) => {
  const [expanded, setExpanded] = useState(false);

  const { permissions, role } = usePermissions();
  const navigate = useNavigate();

  const { data: dataAction, refetch: refetchAction } = useQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(NOTIFICATION_QUERY, {
    variables: { where: { isForActionFor: [currentCompany.orgId] } }
  });

  const { data: dataRevision, refetch: refetchRevision } = useQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(NOTIFICATION_QUERY, {
    variables: { where: { isInRevisionFor: [currentCompany.orgId] } }
  });

  const { data: dataTransport, refetch: refetchTransport } = useQuery<
    Pick<Query, "bsds">,
    QueryBsdsArgs
  >(NOTIFICATION_QUERY, {
    variables: { where: { isToCollectFor: [currentCompany.orgId] } }
  });

  useNotifier(currentCompany.orgId, () => {
    refetchAction();
    refetchRevision();
    refetchTransport();
  });

  const { showTransportTabs } = useShowTransportTabs(
    currentCompany.companyTypes,
    currentCompany.siret
  );

  const showMyBsds =
    permissions.includes(UserPermission.BsdCanList) && role !== UserRole.Driver;

  const handleCompanyChange = useCallback(
    orgId => {
      navigate(
        generatePath(
          role?.includes(UserRole.Driver)
            ? routes.dashboard.transport.toCollect
            : routes.dashboard.bsds.index,
          {
            siret: orgId
          }
        )
      );
    },
    [navigate, role]
  );

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const isReaderRole = role === UserRole.Reader;

  return (
    <div className="dashboard-tabs">
      <div className="company-select">
        <CompanySwitcher
          currentOrgId={currentCompany.orgId}
          companies={companies}
          handleCompanyChange={handleCompanyChange}
        />
      </div>

      {showMyBsds && (
        <>
          <Accordion
            label="Mes bordereaux"
            onExpandedChange={handleToggle}
            expanded
          >
            <ul>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.index, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {ALL_BSDS}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.drafts, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {DRAFTS}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.act, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {ACTS}
                </NavLink>
                {displayNotification(dataAction?.bsds.totalCount, isReaderRole)}
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.follow, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {FOLLOWS}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.history, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {ARCHIVES}
                </NavLink>
              </li>
            </ul>
          </Accordion>

          <Accordion label={REVIEWS} onExpandedChange={handleToggle} expanded>
            <ul>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.toReview, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {TO_REVIEW}
                </NavLink>
                {displayNotification(
                  dataRevision?.bsds.totalCount,
                  isReaderRole
                )}
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.bsds.reviewed, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {REVIEWED}
                </NavLink>
              </li>
            </ul>
          </Accordion>
        </>
      )}

      {showTransportTabs && (
        <Accordion label={TRANSPORT} onExpandedChange={handleToggle} expanded>
          <ul>
            <li>
              <NavLink
                to={generatePath(routes.dashboard.transport.toCollect, {
                  siret: currentCompany.orgId
                })}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                {TO_COLLECT}
              </NavLink>
              {displayNotification(
                dataTransport?.bsds.totalCount,
                isReaderRole
              )}
            </li>
            <li>
              <NavLink
                to={generatePath(routes.dashboard.transport.collected, {
                  siret: currentCompany.orgId
                })}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                {COLLECTED}
              </NavLink>
            </li>
          </ul>
        </Accordion>
      )}
    </div>
  );
};

export default React.memo(DashboardTabs);
