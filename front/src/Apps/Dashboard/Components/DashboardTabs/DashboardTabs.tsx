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
  REGISTER,
  REVIEWED,
  REVIEWS,
  TO_COLLECT,
  TO_REVIEW,
  TRANSPORT
} from "../../../common/wordings/dashboard/wordingsDashboard";

import "./DashboardTabs.scss";
import CompanySwitcher from "../../../common/Components/CompanySwitcher/CompanySwitcher";

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

const DashboardTabs = ({ currentCompany, companies }: DashboardTabsProps) => {
  const [expanded, setExpanded] = useState(false);

  const { permissions, role } = usePermissions();
  const navigate = useNavigate();

  const { showTransportTabs } = useShowTransportTabs(
    currentCompany.companyTypes,
    currentCompany.siret
  );
  const showRegisterTab =
    permissions.includes(UserPermission.RegistryCanRead) &&
    [UserRole.Admin, UserRole.Member].includes(role!);
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
      {showRegisterTab && (
        <NavLink
          to={generatePath(routes.dashboard.exports, {
            siret: currentCompany.orgId
          })}
          className={({ isActive }) =>
            isActive
              ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
              : "sidebarv2__item sidebarv2__item--indented"
          }
        >
          {REGISTER}
        </NavLink>
      )}
    </div>
  );
};

export default React.memo(DashboardTabs);
