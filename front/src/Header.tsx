import React, { useState } from "react";
import {
  NavLink,
  Link,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import { trackEvent } from "./tracker";
import "./Header.scss";
import { localAuthService } from "./login/auth.service";
import { currentSiretService } from "./dashboard/CompanySelector";
import { LogoutIcon, LoginIcon } from "./common/Icons";
type Props = {
  isAuthenticated: boolean;
};

export default withRouter(function Header2({
  isAuthenticated,
}: RouteComponentProps & Props) {
  const { REACT_APP_API_ENDPOINT, REACT_APP_DEVELOPERS_ENDPOINT } = process.env;
  const [menuOpened, toggleMenu] = useState(false);
  const menuClass = menuOpened ? "" : "header__nav-items--hidden";

  return (
    <nav id="header" className="header">
      <div className="header__toggle">
        <button onClick={() => toggleMenu(!menuOpened)}>
          <svg
            className="fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
          <span className="header__toggle-text">Menu</span>
        </button>
      </div>
      <div className="header__content">
        <div className="header__branding">
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

        <div className="header__nav">
          <ul className={`header__nav-items  ${menuClass}`}>
            <li className=" header__nav-item">
              <a
                className="header__nav-link"
                href="https://faq.trackdechets.fr/"
                onClick={() => trackEvent("navbar", "faq")}
              >
                Foire aux questions
              </a>
            </li>

            <li className="header__nav-item">
              <a
                className="header__nav-link"
                href={REACT_APP_DEVELOPERS_ENDPOINT}
              >
                Développeurs
              </a>
            </li>

            <li className="header__nav-item">
              <a
                className="header__nav-link"
                href="https://trackdechets.beta.gouv.fr/partners"
                onClick={() => trackEvent("navbar", "partners")}
              >
                Partenaires
              </a>
            </li>
            {isAuthenticated ? (
              <>
                <li className="header__nav-item">
                  <NavLink
                    to={`/dashboard/${currentSiretService.getSiret()}`}
                    activeClassName="header__nav-link--active"
                    className="header__nav-link"
                    onClick={() => {
                      toggleMenu(!menuOpened);
                      return trackEvent("navbar", "mon-espace");
                    }}
                  >
                    Mon espace
                  </NavLink>
                  <div className="header__nav-active"></div>
                </li>
                <li className="header__nav-item">
                  <NavLink
                    to="/account/info"
                    activeClassName="header__nav-link--active"
                    className="header__nav-link"
                    onClick={() => {
                      toggleMenu(!menuOpened);
                      return trackEvent("navbar", "mon-compte");
                    }}
                  >
                    Mon compte
                  </NavLink>
                  <div className="header__nav-active"></div>
                </li>
                <li className="header__nav-item">
                  <form
                    name="logout"
                    action={`${REACT_APP_API_ENDPOINT}/logout`}
                    method="post"
                  >
                    <button
                      className="header__connexion btn btn--primary"
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
              </>
            ) : (
              <>
                <li className="header__nav-item">
                  <NavLink
                    to="/signup"
                    className="header__nav-link"
                    activeClassName="header__nav-link--active"
                    onClick={() => trackEvent("navbar", "signup")}
                  >
                    S'inscrire
                  </NavLink>
                  <div className="header__nav-active"></div>
                </li>

                <li className="header__nav-item">
                  <NavLink
                    to="/login"
                    className="header__connexion btn btn--primary"
                    onClick={() => trackEvent("navbar", "login")}
                  >
                    <span>Se connecter</span>

                    <LoginIcon />
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <button
        className="header__logout-mobile "
        onClick={() => {
          localAuthService.locallySignOut();
          document.forms["logout"].submit();
          return false;
        }}
      >
        <LogoutIcon />
      </button>
    </nav>
  );
});
