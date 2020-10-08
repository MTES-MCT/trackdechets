import React, { FunctionComponent  } from "react";

import useMedia from 'use-media';

import { MEDIA_QUERIES } from "src/common/config";

const SideMenu: FunctionComponent = ({ children }) => {
 
  const isMobile = useMedia({maxWidth: MEDIA_QUERIES.handHeld});
 
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
