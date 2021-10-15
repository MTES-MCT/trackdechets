import React, { useState } from "react";
import {
  NavLink,
  Link,
  withRouter,
  matchPath,
  RouteComponentProps,
  generatePath,
} from "react-router-dom";

import { trackEvent } from "tracker";

import { localAuthService } from "login/auth.service";
import { IconProfile, IconLeftArrow, IconClose } from "common/components/Icons";
import { AccountMenuContent } from "account/AccountMenu";
import { useQuery, gql } from "@apollo/client";
import Loader from "common/components/Loaders";
import { InlineError } from "common/components/Error";
import { Query } from "generated/graphql/types";
import { DashboardNav } from "dashboard/DashboardNavigation";

import routes from "common/routes";
import { MEDIA_QUERIES } from "common/config";
import styles from "./Header.module.scss";
import { useMedia } from "use-media";

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

const getMenuEntries = (isAuthenticated, isAdmin, currentSiret) => {
  const common = [
    {
      caption: "Foire aux questions",
      href: "https://faq.trackdechets.fr/",
      onClick: () => trackEvent("navbar", "faq"),

      navlink: null,
    },
    {
      caption: "Développeurs",
      href: "https://developers.trackdechets.beta.gouv.fr",
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

  const admin = [
    {
      caption: "Panneau d'administration",
      href: routes.admin.verification,
      onClick: () => trackEvent("navbar", "panneau-administration"),
      navlink: true,
    },
  ];

  const connected = [
    {
      caption: "Mon espace",
      href: currentSiret
        ? generatePath(routes.dashboard.index, {
            siret: currentSiret,
          })
        : "/",
      onClick: () => trackEvent("navbar", "mon-espace"),

      navlink: true,
    },
    {
      caption: "Mon compte",
      href: routes.account.info,
      onClick: () => trackEvent("navbar", "mon-compte"),

      navlink: true,
    },
  ];
  return [
    ...common,
    ...(isAuthenticated ? connected : []),
    ...(isAdmin ? admin : []),
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
          className={styles.headerNavLink}
          to={entry.href}
          exact={entry.href === "/"}
          onClick={() => {
            entry.onClick();
            mobileCallback && mobileCallback();
          }}
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
  isAdmin: boolean;
};

/**
 * Main nav
 * Contains External and internal links
 * On mobile appear as a sliding panel and includes other items
 */
export default withRouter(function Header({
  isAuthenticated,
  isAdmin,
  location,
}: RouteComponentProps & HeaderProps) {
  const { REACT_APP_API_ENDPOINT } = process.env;
  const [menuHidden, toggleMenu] = useState(true);

  const isMobile = useMedia({ maxWidth: MEDIA_QUERIES.handHeld });
  const closeMobileMenu = () => isMobile && toggleMenu(true);
  const matchAccount = matchPath(location.pathname, {
    path: routes.account.index,
    exact: false,
    strict: false,
  });
  const matchDashboard = matchPath(location.pathname, {
    path: routes.dashboard.index,
    exact: false,
    strict: false,
  });

  const menuClass = menuHidden && isMobile ? styles.headerNavHidden : "";

  // Catching siret from url when not available from props (just after login)
  const currentSiret = matchDashboard?.params["siret"];
  const menuEntries = getMenuEntries(isAuthenticated, isAdmin, currentSiret);

  const mobileNav = () => {
    if (!isAuthenticated || !isMobile) {
      return null;
    }
    return !!matchAccount ? (
      <AccountMenuContent mobileCallback={() => closeMobileMenu()} />
    ) : (
      <MobileSubNav
        currentSiret={currentSiret}
        onClick={() => closeMobileMenu()}
      />
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
                  action={`${REACT_APP_API_ENDPOINT}/logout`}
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
                      trackEvent("navbar", "login");
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
                      trackEvent("navbar", "login");
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
});
