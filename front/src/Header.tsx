import React from "react";
import { NavLink, Link, withRouter } from "react-router-dom";
import { localAuthService } from "./login/auth.service";
import { trackEvent } from "./tracker";
import { FaPowerOff } from "react-icons/fa";
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
                className="highlighted-button"
                onClick={() => trackEvent("navbar", "faq")}
              >
                FAQ
              </NavLink>
            </li>
            <li className="nav__item">
              <NavLink
                to="/stats"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "stats")}
              >
                Stats
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
            {/* <li className="nav__item">
              <NavLink
                to="/search"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "check-presta")}
              >
                Vérification prestataire
              </NavLink>
            </li> */}
            {localAuthService.isAuthenticated ? (
              <React.Fragment>
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
                  <a
                    title="Se déconnecter"
                    onClick={() => {
                      localAuthService.locallySignOut();
                      history.push("/");
                    }}
                  >
                    <FaPowerOff />
                  </a>
                </li>
              </React.Fragment>
            ) : (
              <li className="nav__item">
                <NavLink
                  to="/login"
                  activeClassName="active"
                  onClick={() => trackEvent("navbar", "login")}
                >
                  Me connecter
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
});
