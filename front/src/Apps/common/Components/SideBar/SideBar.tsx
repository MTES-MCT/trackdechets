import React from "react";
import "./sidebar.scss";

interface SideBarProps {
  children: React.ReactNode;
}

const SideBar = ({ children }: SideBarProps) => {
  return (
    <aside id="td-sidebar" className="sidebarv2">
      {children}
    </aside>
  );
};
export default React.memo(SideBar);
