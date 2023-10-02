import React, { useCallback, useState } from "react";
import { NavLink, generatePath, useHistory } from "react-router-dom";
import { CompanyPrivate } from "generated/graphql/types";
import DashboardCompanySelector from "../../../../dashboard/DashboardCompanySelector";
import routes from "Apps/routes";

import { useShowTransportTabs } from "Apps/Dashboard/hooks/useShowTransportTabs";
import { usePermissions } from "common/contexts/PermissionsContext";
import { UserPermission } from "generated/graphql/types";
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
  TRANSPORT,
} from "Apps/common/wordings/dashboard/wordingsDashboard";

import "./DashboardTabs.scss";

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

const DashboardTabs = ({ currentCompany, companies }: DashboardTabsProps) => {
  const [expanded, setExpanded] = useState(false);

  const { permissions } = usePermissions();
  const history = useHistory();

  const { showTransportTabs } = useShowTransportTabs(
    currentCompany.companyTypes,
    currentCompany.siret
  );
  const showRegisterTab = permissions.includes(UserPermission.RegistryCanRead);
  const showMyBsds = permissions.includes(UserPermission.BsdCanList);

  const handleCompanyChange = useCallback(
    orgId => {
      history.push(
        generatePath(routes.dashboardv2.bsds.index, {
          siret: orgId,
        })
      );
    },
    [history]
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
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
                >
                  {ALL_BSDS}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.drafts, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
                >
                  {DRAFTS}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.act, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
                >
                  {ACTS}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.follow, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
                >
                  {FOLLOWS}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.history, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
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
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
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
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
                >
                  {TO_REVIEWED}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.bsds.reviewed, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebarv2__item sidebarv2__item--indented"
                  activeClassName="sidebarv2__item--active"
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
                  siret: currentCompany.orgId,
                })}
                className="sidebarv2__item sidebarv2__item--indented"
                activeClassName="sidebarv2__item--active"
              >
                {TO_COLLECT}
              </NavLink>
            </li>
            <li>
              <NavLink
                to={generatePath(routes.dashboardv2.transport.collected, {
                  siret: currentCompany.orgId,
                })}
                className="sidebarv2__item sidebarv2__item--indented"
                activeClassName="sidebarv2__item--active"
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
            siret: currentCompany.orgId,
          })}
          className="sidebarv2__item sidebarv2__item--chapter"
          activeClassName="sidebarv2__item--active"
        >
          {REGISTER}
        </NavLink>
      )}
    </div>
  );
};

export default React.memo(DashboardTabs);
