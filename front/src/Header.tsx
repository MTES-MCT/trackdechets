import React from "react";
import { NavLink, Link, withRouter } from "react-router-dom";
import { localAuthService } from "./login/auth.service";
import { trackEvent } from "./tracker";
import "./Header.scss";

export default withRouter(function Header({ history }) {
  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <Link className="navbar__home" to="/">
          <img
            className="navbar__logo"
            src="/marianne.svg"
            alt="trackdechets.data.gouv.fr"
          />
          Trackdéchets
        </Link>

        <nav>
          <ul className="nav__links">
            <li className="nav__item">
              <NavLink
                to="/faq"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "faq")}
              >
                FAQ
              </NavLink>
            </li>
            <li className="nav__item">
              <NavLink
                to="/partners"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "partners")}
              >
                Partenaires
              </NavLink>
            </li>
            <li className="nav__item" role="separator">
              |
            </li>
            {localAuthService.isAuthenticated ? (
              <>
                <li className="nav__item">
                  <NavLink
                    to="/dashboard/slips"
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "mon-espace")}
                  >
                    Mon espace
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink
                    activeClassName="active"
                    to="/account/info"
                    onClick={() => trackEvent("navbar", "mon-compte")}
                  >
                    Mon compte
                  </NavLink>
                </li>
                <li className="nav__item logout">
                  <a
                    onClick={() => {
                      localAuthService.locallySignOut();
                      history.push("/");
                    }}
                  >
                    Se déconnecter
                  </a>
                </li>
              </>
            ) : (
              <>
                <li className="nav__item">
                  <NavLink
                    to="/signup"
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "signup")}
                  >
                    S'inscrire
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink
                    to="/login"
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "login")}
                  >
                    Se connecter
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
});
