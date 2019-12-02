import React from "react";

import AccountMenu from "./AccountMenu";
import AccountContent from "./AccountContent";

export default function Account() {
  return (
    <div id="account" className="account dashboard">
      <AccountMenu />
      <div className="dashboard-content">
        <AccountContent />
      </div>
    </div>
  );
}
