import React, { useState, useEffect } from "react";
import {
  NavLink,
  Link,
  withRouter,
  matchPath,
  RouteComponentProps,
} from "react-router-dom";
import useWindowSize from "src/common/hooks/use-window-size";
import { trackEvent } from "src/tracker";

import { localAuthService } from "src/login/auth.service";
import { currentSiretService } from "src/dashboard/CompanySelector";
import {
  LogoutIcon,
  LoginIcon,
  LeftArrowIcon,
  Close,
} from "src/common/components/Icons";
import { AccountMenuContent } from "src/account/AccountMenu";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import Loader from "src/common/components/Loaders";
import { InlineError } from "src/common/components/Error";
import { Query } from "src/generated/graphql/types";
import { DashboardNav } from "src/dashboard/DashboardNavigation";

import { MEDIA_QUERIES } from "src/common/config";
import styles from "./Header.module.scss";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        companyTypes
      }
    }
  }
`;

/**
 *
 * Navigation subset to be included in the moble slidning panel nav
 * Contains main navigation items from the desktop top level nav (Dashboard, Account etc.)
 */
function MobileSubNav({ currentSiret, onClick }) {
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME, {});

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  return (
    <DashboardNav
      currentSiret={currentSiret}
      onClick={onClick}
      loading={loading}
      error={error}
      data={data}
    />
  );
}

const getMenuEntries = (isAuthenticated, devEndpoint, currentSiret) => {
  const common = [
    {
      caption: "Foire aux questions",
      href: "https://faq.trackdechets.fr/",
      onClick: () => trackEvent("navbar", "faq"),

      navlink: null,
    },
    {
      caption: "Développeurs",
      href: devEndpoint,
      onClick: () => trackEvent("navbar", "faq"),

      navlink: false,
    },
    {
      caption: "Partenaires",
      href: "https://trackdechets.beta.gouv.fr/partners",
      onClick: () => trackEvent("navbar", "partners"),

      navlink: false,
    },
  ];
  const notConnected = [
    {
      caption: "S'inscrire",
      href: "/signup",

      navlink: true,
    },
  ];
  const connected = [
    {
      caption: "Mon espace",
      href: `/dashboard/${currentSiret}`,
      onClick: () => trackEvent("navbar", "mon-espace"),

      navlink: true,
    },
    {
      caption: "Mon compte",
      href: "/account/info",
      onClick: () => trackEvent("navbar", "mon-compte"),

      navlink: true,
    },
  ];
  return [...common, ...(isAuthenticated ? connected : notConnected)];
};

const MenuLink = ({ entry }) => {
  const content = (
    <>
      <LeftArrowIcon color="#0053b3" size={16} />
      <span> {entry.caption}</span>
    </>
  );

  return (
    <>
      {entry.navlink ? (
        <NavLink
          className={styles.headerNavLink}
          to={entry.href}
          onClick={entry.onClick}
          activeClassName={styles.headerNavLinkActive}
        >
          {content}
        </NavLink>
      ) : (
        <a
          className={styles.headerNavLink}
          href={entry.href}
          onClick={entry.onClick}
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
};

/**
 * Main nav
 * Contains External and internal links
 * On mobile appear as a sliding panel and includes other items
 */
export default withRouter(function Header({
  isAuthenticated,
  location,
}: RouteComponentProps & HeaderProps) {
  const { REACT_APP_API_ENDPOINT, REACT_APP_DEVELOPERS_ENDPOINT } = process.env;
  const [menuHidden, toggleMenu] = useState(true);
  const windowSize = useWindowSize();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const matchAccount = matchPath(location.pathname, {
    path: "/account/",
    exact: false,
    strict: false,
  });

  const matchDashboard= matchPath(location.pathname, {
    path: "/dashboard/",
    exact: false,
    strict: false,
  });

  const menuClass = menuHidden && isMobileDevice ? styles.headerNavHidden : "";
  useEffect(() => {
    setIsMobileDevice(windowSize.width < MEDIA_QUERIES.handHeld);
  }, [windowSize]);
  const currentSiret = currentSiretService.getSiret();

  const entries = getMenuEntries(
    isAuthenticated,
    REACT_APP_DEVELOPERS_ENDPOINT,
    currentSiret
  );

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
            src="/marianne.svg"
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
              onClick={() => toggleMenu(true)}
            >
              <span className="tw-mr-2">Fermer</span>
              <Close color="#000" size={16} />
            </button>
          </div>

          {!!isMobileDevice && !! matchDashboard &&(
            <MobileSubNav
              currentSiret={currentSiret}
              onClick={() => toggleMenu(true)}
            />
          )}
          {!!matchAccount && !!isMobileDevice && (
            <AccountMenuContent   />
          )}

          <ul className={styles.headerNavItems}>
            {entries.map((e, idx) => (
              <li className={styles.headerNavItem} key={idx}>
                <MenuLink entry={e} />
              </li>
            ))}

            {isAuthenticated ? (
              <li className={styles.headerNavItem}>
                <form
                  className={styles.headerConnexion}
                  name="logout"
                  action={`${REACT_APP_API_ENDPOINT}/logout`}
                  method="post"
                >
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      localAuthService.locallySignOut();
                      document.forms["logout"].submit();
                      return false;
                    }}
                  >
                    <span>Se déconnecter</span>
                    <LogoutIcon />
                  </button>
                </form>
              </li>
            ) : (
              <li className={styles.headerNavItem}>
                <NavLink
                  to="/login"
                  className={`${styles.headerConnexion} btn btn--primary`}
                  onClick={() => trackEvent("navbar", "login")}
                >
                  <span>Se connecter</span>

                  <LoginIcon />
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
});
