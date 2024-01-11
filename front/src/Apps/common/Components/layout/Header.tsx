import React, { useEffect, useState, useCallback } from "react";
import {
  NavLink,
  Link,
  matchPath,
  useLocation,
  generatePath,
  useMatch
} from "react-router-dom";

import { localAuthService } from "../../../../login/auth.service";
import { IconProfile, IconLeftArrow, IconClose } from "../Icons/Icons";
import { AccountMenuContent } from "../../../../account/AccountMenu";
import { useQuery, gql } from "@apollo/client";
import Loader from "../Loader/Loaders";
import { InlineError } from "../Error/Error";
import { Query } from "@td/codegen-ui";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";

import routes from "../../../routes";
import {
  DEVELOPERS_DOCUMENTATION_URL,
  MEDIA_QUERIES
} from "../../../../common/config";
import styles from "./Header.module.scss";
import { useMedia } from "../../../../common/use-media";
import { DashboardTabs } from "../../../../dashboard/DashboardTabs";
import { default as DashboardTabsV2 } from "../../../Dashboard/Components/DashboardTabs/DashboardTabs";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        userRole
        orgId
        companyTypes
        userPermissions
      }
    }
  }
`;

/**
 *
 * Navigation subset to be included in the moble slidning panel nav
 * Contains main navigation items from the desktop top level nav (Dashboard, Account etc.)
 */
function MobileSubNav({ currentSiret }) {
  const { updatePermissions } = usePermissions();
  const { error, data } = useQuery<Pick<Query, "me">>(GET_ME, {});
  const isV2Routes = !!useMatch("/v2/dashboard/*");

  useEffect(() => {
    if (data) {
      const companies = data.me.companies;
      const currentCompany = companies.find(
        company => company.orgId === currentSiret
      );
      if (currentCompany) {
        updatePermissions(
          currentCompany.userPermissions,
          currentCompany.userRole!
        );
      }
    }
  }, [updatePermissions, data, currentSiret]);

  if (error) return <InlineError apolloError={error} />;

  if (data?.me == null) return <Loader />;

  const companies = data.me.companies;

  const currentCompany = companies.find(
    company => company.orgId === currentSiret
  );

  if (currentCompany == null) {
    return null;
  }

  return !isV2Routes ? (
    <DashboardTabs currentCompany={currentCompany} companies={companies} />
  ) : (
    <DashboardTabsV2 currentCompany={currentCompany} companies={companies} />
  );
}

const getMenuEntries = (isAuthenticated, isAdmin, currentSiret) => {
  const common = [
    {
      caption: "Ressources",
      href: "https://trackdechets.beta.gouv.fr/resources",
      navlink: null,
      target: "_blank"
    },
    {
      caption: "Développeurs",
      href: DEVELOPERS_DOCUMENTATION_URL,
      navlink: false,
      target: "_blank"
    },
    {
      caption: "Site de test",
      href: "https://sandbox.trackdechets.beta.gouv.fr/",
      navlink: false,
      target: "_blank"
    }
  ];

  const admin = [
    {
      caption: "Panneau d'administration",
      href: routes.admin.verification,
      navlink: true
    }
  ];

  const connected = [
    {
      caption: "Mon espace",
      href: currentSiret
        ? generatePath(routes.dashboard.index, {
            siret: currentSiret
          })
        : "/",

      navlink: true
    },
    {
      caption: "Mes bordereaux 🆕",
      href: currentSiret
        ? generatePath(routes.dashboardv2.index, {
            siret: currentSiret
          })
        : "/",

      navlink: true
    },
    {
      caption: "Mon compte",
      href: routes.account.info,

      navlink: true
    }
  ];

  return [
    ...common,
    ...(isAuthenticated ? connected : []),
    ...(isAdmin ? admin : [])
  ];
};

const MenuLink = ({ entry, mobileCallback }) => {
  const content = (
    <>
      <IconLeftArrow color="blue" size="16px" />
      <span> {entry.caption}</span>
    </>
  );

  return (
    <>
      {entry.navlink ? (
        <NavLink
          className={({ isActive }) =>
            isActive
              ? `${styles.headerNavLink} ${styles.headerNavLinkActive}`
              : styles.headerNavLink
          }
          to={entry.href}
          onClick={() => {
            mobileCallback && mobileCallback();
          }}
        >
          {content}
        </NavLink>
      ) : (
        <a
          className={styles.headerNavLink}
          href={entry.href}
          target={entry.target ?? "_self"}
        >
          {content}
        </a>
      )}

      <div className={styles.headerNavActive}></div>
    </>
  );
};

type HeaderProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  defaultOrgId?: string;
};

/**
 * Main nav
 * Contains External and internal links
 * On mobile appear as a sliding panel and includes other items
 */
export default function Header({
  isAuthenticated,
  isAdmin,
  defaultOrgId
}: HeaderProps) {
  const { VITE_API_ENDPOINT } = import.meta.env;

  const location = useLocation();

  const [menuHidden, toggleMenu] = useState(true);

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const closeMobileMenu = useCallback(
    () => isMobile && toggleMenu(true),
    [isMobile, toggleMenu]
  );

  useEffect(() => {
    closeMobileMenu();
  }, [location, closeMobileMenu]);

  const matchAccount = matchPath(
    {
      path: routes.account.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchDashboard = matchPath(
    {
      path: routes.dashboard.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchDashboardV2 = matchPath(
    {
      path: routes.dashboardv2.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const menuClass = menuHidden && isMobile ? styles.headerNavHidden : "";

  // Catching siret from url when not available from props (just after login)
  let currentSiret = matchDashboard?.params["siret"] || defaultOrgId;

  if (matchDashboardV2) {
    currentSiret =
      matchDashboard?.params["siret"] ||
      matchDashboardV2?.params["siret"] ||
      defaultOrgId;
  }

  const menuEntries = getMenuEntries(isAuthenticated, isAdmin, currentSiret);

  const mobileNav = () => {
    if (!isAuthenticated || !isMobile) {
      return null;
    }
    return !!matchAccount ? (
      <AccountMenuContent />
    ) : (
      <MobileSubNav currentSiret={currentSiret} />
    );
  };

  return (
    <nav id="header" className={styles.header}>
      <div className={styles.headerToggle}>
        <button onClick={() => toggleMenu(!menuHidden)}>
          <svg
            className="fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />{" "}
            {/* Hamburger icon */}
          </svg>
          <span className={styles.headerToggleText}>Menu</span>
        </button>
      </div>
      <div className={styles.headerContent}>
        <div className={styles.headerBranding}>
          <img
            src="/marianne_mte.svg"
            alt=""
            style={{ height: "80px", width: "80px" }}
          />
          <Link to="/">
            <img
              src="/trackdechets.png"
              alt="trackdechets.data.gouv.fr"
              style={{ height: "80px", width: "80px" }}
            />
          </Link>
        </div>

        <div className={`${styles.headerNav} ${menuClass}`}>
          <div className={styles.headerClose}>
            <button
              className="btn btn--no-style"
              onClick={() => closeMobileMenu()}
            >
              <span className="tw-mr-2">Fermer</span>
              <IconClose size="16px" />
            </button>
          </div>

          {mobileNav()}

          <ul className={styles.headerNavItems}>
            {menuEntries.map((e, idx) => (
              <li className={styles.headerNavItem} key={idx}>
                <MenuLink entry={e} mobileCallback={() => closeMobileMenu()} />
              </li>
            ))}

            {isAuthenticated ? (
              <li
                className={`${styles.headerNavItem} ${styles.headerNavItemNoBorder}`}
              >
                <form
                  className={styles.headerConnexion}
                  name="logout"
                  action={`${VITE_API_ENDPOINT}/logout`}
                  method="post"
                >
                  <button
                    className={`${styles.headerConnexion} btn btn--sqr`}
                    onClick={() => {
                      localAuthService.locallySignOut();
                      document.forms["logout"].submit();
                      closeMobileMenu();
                      return false;
                    }}
                  >
                    <span>Se déconnecter</span>
                    <IconProfile />
                  </button>
                </form>
              </li>
            ) : (
              <>
                <li
                  className={`${styles.headerNavItem} ${styles.headerNavItemNoBorder}`}
                >
                  <NavLink
                    to={routes.signup.index}
                    className={`${styles.headerSignup} btn btn--sqr-outline`}
                    onClick={() => {
                      closeMobileMenu();
                    }}
                  >
                    <span>Créer un compte</span>
                  </NavLink>
                </li>
                <li
                  className={`${styles.headerNavItem} ${styles.headerNavItemNoBorder}`}
                >
                  <NavLink
                    to={routes.login}
                    className={`${styles.headerConnexion} btn btn--sqr`}
                    onClick={() => {
                      closeMobileMenu();
                    }}
                  >
                    <span>Se connecter</span>
                    <IconProfile />
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
