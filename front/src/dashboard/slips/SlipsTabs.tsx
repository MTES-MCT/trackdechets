import React from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import { NavTab } from "react-router-tabs";
import "./SlipsTabs.scss";
import ActTab from "./tabs/ActTab";
import DraftsTab from "./tabs/DraftsTab";
import FollowTab from "./tabs/FollowTab";
import HistoryTab from "./tabs/HistoryTab";

type Props = { siret: string };

export default function SlipsTabs({ siret }: Props) {
  const { url, path } = useRouteMatch();

  return (
    <div>
      <div className="nav-tabs">
        <NavTab to={`${url}/drafts`}>Mes brouillons</NavTab>
        <NavTab to={`${url}/act`}>Agir sur mes bordereaux</NavTab>
        <NavTab to={`${url}/follow`}>Suivre mes bordereaux</NavTab>
        <NavTab to={`${url}/history`}>Mes bordereaux archivés</NavTab>
      </div>

      <Switch>
        <Route
          exact
          path={url}
          render={() => <Redirect to={`./slips/drafts`} />}
        />

        <Route
          path={`${path}/drafts`}
          render={() => <DraftsTab siret={siret} />}
        />
        <Route path={`${path}/act`} render={() => <ActTab siret={siret} />} />
        <Route
          path={`${path}/follow`}
          render={() => <FollowTab siret={siret} />}
        />
        <Route
          path={`${path}/history`}
          render={() => <HistoryTab siret={siret} />}
        />
      </Switch>
    </div>
  );
}
