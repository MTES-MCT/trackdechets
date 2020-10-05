import React from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";

import "./SlipsContent.scss";
import ActTab from "./tabs/ActTab";
import DraftsTab from "./tabs/DraftsTab";
import FollowTab from "./tabs/FollowTab";
import HistoryTab from "./tabs/HistoryTab";
import SlipDetail from "../slip/SlipDetail";

export default function SlipsContent() {
  const { url, path } = useRouteMatch();

  return (
    <div>
      <Switch>
        <Route
          exact
          path={url}
          render={() => <Redirect to={`./slips/drafts`} />}
        />

        <Route path={`${path}/view/:id`} render={() => <SlipDetail />} />
        <Route path={`${path}/drafts`} render={() => <DraftsTab />} />
        <Route path={`${path}/act`} render={() => <ActTab />} />
        <Route path={`${path}/follow`} render={() => <FollowTab />} />
        <Route path={`${path}/history`} render={() => <HistoryTab />} />
      </Switch>
    </div>
  );
}
