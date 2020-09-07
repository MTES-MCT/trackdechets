import React from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
 
import "./SlipsTabs.scss";
import ActTab from "./tabs/ActTab";
import DraftsTab from "./tabs/DraftsTab";
import FollowTab from "./tabs/FollowTab";
import HistoryTab from "./tabs/HistoryTab";
 

 

export default function SlipsTabs( ) {
  const { url, path,   } = useRouteMatch();
 
  return (
    <div>
      {/* <div className="nav-tabs">
        <NavTab to={`${url}/drafts`}>Mes brouillons</NavTab>
        <NavTab to={`${url}/act`}>Agir sur mes bordereaux</NavTab>
        <NavTab to={`${url}/follow`}>Suivre mes bordereaux</NavTab>
        <NavTab to={`${url}/history`}>Mes bordereaux archivés</NavTab>
      </div> */}

      <Switch>
        <Route
          exact
          path={url}
          render={() => <Redirect to={`./slips/drafts`} />}
        />

        <Route path={`${path}/drafts`} render={() => <DraftsTab />} />
        <Route path={`${path}/act`} render={() => <ActTab />} />
        <Route path={`${path}/follow`} render={() => <FollowTab />} />
        <Route path={`${path}/history`} render={() => <HistoryTab />} />
      </Switch>
    </div>
  );
}
