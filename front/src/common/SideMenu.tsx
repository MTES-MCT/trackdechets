import React, { FunctionComponent, useState, useEffect } from "react";
import "./SideMenu.scss";
import useWindowSize from "../utils/use-window-size";
import { FaBars } from "react-icons/fa";

const MEDIA_QUERIES = {
  mobile: 480
};

/**
 * Side menu like https://template.data.gouv.fr/#dashboard
 * with responsive behavior: it shrinks to a burger icon
 * under a certain resolution
 */
const SideMenu: FunctionComponent = ({ children }) => {
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
      {(!isMobileDevice || isOpened) && children}
    </aside>
  );
};

export default SideMenu;
