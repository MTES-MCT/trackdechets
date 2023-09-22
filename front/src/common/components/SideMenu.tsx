import React, { FunctionComponent, PropsWithChildren } from "react";
import { useMedia } from "../use-media";
import { MEDIA_QUERIES } from "../config";
import "./SideMenu.scss";

const SideMenu: FunctionComponent<PropsWithChildren<{}>> = ({ children }) => {
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  if (isMobile) {
    return null;
  }
  return (
    <aside className="sidebar" role="navigation">
      {children}
    </aside>
  );
};

export default SideMenu;
