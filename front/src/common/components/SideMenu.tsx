import React, { FunctionComponent, useState, useEffect } from "react";

import useWindowSize from "../hooks/use-window-size";
 
import { MEDIA_QUERIES } from "../config";

 
const SideMenu: FunctionComponent = ({ children }) => {
  const windowSize = useWindowSize();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
 

  useEffect(() => {
    setIsMobileDevice(windowSize.width < MEDIA_QUERIES.handHeld);
  }, [windowSize]);

  return (
    <aside className="sidebar" role="navigation">
      {!isMobileDevice  && children}
    </aside>
  );
};

export default SideMenu;
