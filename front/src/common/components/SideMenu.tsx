import React, { FunctionComponent, useState, useEffect } from "react";

import useWindowSize from "src/common/hooks/use-window-size";

import { MEDIA_QUERIES } from "src/common/config";

const SideMenu: FunctionComponent = ({ children }) => {
  const windowSize = useWindowSize();
  const [isHandHeld, setIsHandHeld] = useState(false);

  useEffect(() => {
    setIsHandHeld(windowSize.width < MEDIA_QUERIES.handHeld);
  }, [windowSize]);
  if (isHandHeld) {
    return null;
  }
  return (
    <aside className="sidebar" role="navigation">
      {children}
    </aside>
  );
};

export default SideMenu;
