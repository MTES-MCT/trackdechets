import React, { useState, useEffect } from "react";
import { Me } from "../login/model";
import "./DashboardMenu.scss";
import { NavLink, match } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import useWindowSize from "../utils/use-window-size";
import { FaBars } from "react-icons/fa";

interface IProps {
  me: Me;
  match: match<{}>;
  setActiveSiret: (s: string) => void;
}

const MEDIA_QUERIES = {
  mobile: 480
};

export default function DashboardMenu({ me, match, setActiveSiret }: IProps) {
  const windowSize = useWindowSize();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    setIsMobileDevice(windowSize.width < MEDIA_QUERIES.mobile);
  }, [windowSize]);

  return (
    <aside className="dashboard-menu side-menu" role="navigation">
      {isMobileDevice && (
        <div
          className="side-menu__mobile-trigger"
          onClick={() => setIsOpened(!isOpened)}
        >
          <FaBars /> Menu
        </div>
      )}
      {(!isMobileDevice || isOpened) && (
        <>
          <div className="company-title">
            <h3>{me.name}</h3>
            <p>{me.email}</p>
            <CompanySelector me={me} setActiveSiret={setActiveSiret} />
          </div>
          <ul>
            <li>
              <NavLink to={`${match.url}/slips`} activeClassName="active">
                Mes bordereaux
              </NavLink>
            </li>
            {me.userType.indexOf("TRANSPORTER") > -1 && (
              <li>
                <NavLink to={`${match.url}/transport`} activeClassName="active">
                  Transport
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to={`${match.url}/account`} activeClassName="active">
                Mon compte
              </NavLink>
            </li>
            <li>
              <NavLink to={`${match.url}/exports`} activeClassName="active">
                Registre
              </NavLink>
            </li>
          </ul>
        </>
      )}
    </aside>
  );
}
