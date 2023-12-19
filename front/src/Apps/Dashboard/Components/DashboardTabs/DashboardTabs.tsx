import React, { useCallback, useState } from "react";
import { NavLink, generatePath, useNavigate } from "react-router-dom";
import { CompanyPrivate, UserPermission, UserRole } from "@td/codegen-ui";
import DashboardCompanySelector from "../../../../dashboard/DashboardCompanySelector";
import routes from "../../../routes";

import { useShowTransportTabs } from "../../hooks/useShowTransportTabs";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import {
  ACTS,
  ALL_BSDS,
  ALL_REVIEWS,
  ARCHIVES,
  COLLECTED,
  DRAFTS,
  FOLLOWS,
  REGISTER,
  // REVIEWED,
  REVIEWS,
  TO_COLLECT,
  // TO_REVIEWED,
  TRANSPORT
} from "../../../common/wordings/dashboard/wordingsDashboard";

import "./DashboardTabs.scss";

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
        generatePath(routes.dashboardv2.bsds.index, {
          siret: orgId
        })
      );
    },
    [navigate]
  );

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="dashboard-tabs">
      {companies.length > 1 ? (
        <div className="company-select">
          <DashboardCompanySelector
            orgId={currentCompany.orgId}
            companies={companies}
            handleCompanyChange={handleCompanyChange}
          />
        </div>
      ) : (
        <div className="company-title">{currentCompany.name}</div>
      )}

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
                  to={generatePath(routes.dashboardv2.bsds.index, {
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
                  to={generatePath(routes.dashboardv2.bsds.drafts, {
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
                  to={generatePath(routes.dashboardv2.bsds.act, {
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
                  to={generatePath(routes.dashboardv2.bsds.follow, {
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
                  to={generatePath(routes.dashboardv2.bsds.history, {
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
                  to={generatePath(routes.dashboardv2.bsds.reviews, {
                    siret: currentCompany.orgId
                  })}
                  className={({ isActive }) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {ALL_REVIEWS}
                </NavLink>
              </li>
              {/* A remettre quand on pourra afficher les révisions avec la query bsds */}
              {/* <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.toReviewed, {
                    siret: currentCompany.orgId,
                  })}
                  className={({isActive}) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {TO_REVIEWED}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.reviewed, {
                    siret: currentCompany.orgId,
                  })}
                  className={({isActive}) =>
                    isActive
                      ? "sidebarv2__item sidebarv2__item--indented sidebarv2__item--active"
                      : "sidebarv2__item sidebarv2__item--indented"
                  }
                >
                  {REVIEWED}
                </NavLink>
              </li> */}
            </ul>
          </Accordion>
        </>
      )}

      {showTransportTabs && (
        <Accordion label={TRANSPORT} onExpandedChange={handleToggle} expanded>
          <ul>
            <li>
              <NavLink
                to={generatePath(routes.dashboardv2.transport.toCollect, {
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
                to={generatePath(routes.dashboardv2.transport.collected, {
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
          to={generatePath(routes.dashboardv2.exports, {
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
