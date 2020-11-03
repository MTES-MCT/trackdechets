import React from "react";
import {
  Redirect,
  Route,
  Switch,
  generatePath,
  useParams,
} from "react-router-dom";

import routes from "common/routes";
import "./SlipsContent.scss";
import ActTab from "./tabs/ActTab";
import DraftsTab from "./tabs/DraftsTab";
import FollowTab from "./tabs/FollowTab";
import HistoryTab from "./tabs/HistoryTab";
import SlipDetail from "../slip/SlipDetail";

export default function SlipsContent() {
  const { siret } = useParams<{ siret: string }>();

  return (
    <div>
      <Switch>
        <Route path={routes.dashboard.slips.view}>
          <SlipDetail />
        </Route>
        <Route path={routes.dashboard.slips.drafts}>
          <DraftsTab />
        </Route>
        <Route path={routes.dashboard.slips.act}>
          <ActTab />
        </Route>
        <Route path={routes.dashboard.slips.follow}>
          <FollowTab />
        </Route>
        <Route path={routes.dashboard.slips.history}>
          <HistoryTab />
        </Route>
        <Redirect
          to={generatePath(routes.dashboard.slips.drafts, {
            siret,
          })}
        />
      </Switch>
    </div>
  );
}
