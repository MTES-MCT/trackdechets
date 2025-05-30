import React, { useCallback, useState } from "react";
import { NavLink, generatePath, useNavigate } from "react-router-dom";
import { CompanyPrivate, UserPermission, UserRole } from "@td/codegen-ui";
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
  TRANSPORT,
  RETURN
} from "../../../common/wordings/dashboard/wordingsDashboard";

import "./DashboardTabs.scss";
import CompanySwitcher from "../../../common/Components/CompanySwitcher/CompanySwitcher";
import { useNotifier } from "../../../../dashboard/components/BSDList/useNotifier";
import { useNotificationQueries } from "./useNotificationQueries";

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

  const { data, refetchAll } = useNotificationQueries(currentCompany.orgId);

  useNotifier(currentCompany.orgId, () => {
    refetchAll();
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
      <div id="company-dashboard-select" className="company-select">
        <CompanySwitcher
          currentOrgId={currentCompany.orgId}
          companies={companies}
          handleCompanyChange={handleCompanyChange}
        />
      </div>

      {showMyBsds && (
        <>
          <Accordion
            titleAs="h2"
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
                {displayNotification(data.actionCount, isReaderRole)}
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

          <Accordion
            titleAs="h2"
            label={REVIEWS}
            onExpandedChange={handleToggle}
            expanded
          >
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
                {displayNotification(data.revisionCount, isReaderRole)}
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
        <Accordion
          titleAs="h2"
          label={TRANSPORT}
          onExpandedChange={handleToggle}
          expanded
        >
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
              {displayNotification(data.transportCount, isReaderRole)}
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
            <li>
              <NavLink
                to={generatePath(routes.dashboard.transport.return, {
                  siret: currentCompany.orgId
                })}
                className={({ isActive }) =>
                  isActive
                    ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                    : "sidebarv2__item sidebarv2__item--indented"
                }
              >
                {RETURN}
              </NavLink>
            </li>
          </ul>
        </Accordion>
      )}
    </div>
  );
};

export default React.memo(DashboardTabs);
