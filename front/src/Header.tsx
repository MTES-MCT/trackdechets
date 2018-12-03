import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <a className="navbar__home" href="index.html">
          Track Déchets
        </a>

        <nav>
          <ul className="nav__links">
            <li className="nav__item">
              <Link to="/dashboard/slips">Mon espace</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
