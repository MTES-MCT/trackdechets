import React from "react";
import {
  generatePath,
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from "react-router-dom";
import classNames from "classnames";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import { IconLayout2, IconLayoutModule1 } from "common/components/Icons";
import routes from "common/routes";
import ToCollectTab from "./tabs/ToCollectTab";
import CollectedTab from "./tabs/CollectedTab";

const DISPLAY_MODE_KEY = "display_mode";

export default function RouteTransport() {
  const { siret } = useParams<{ siret: string }>();
  const toCollect = useRouteMatch(routes.dashboard.transport.toCollect);
  const collected = useRouteMatch(routes.dashboard.transport.collected);

  const [displayMode, setDisplayMode] = React.useState<"TABLE" | "CARDS">(
    () => {
      // FIXME: not cross-environment proof (e.g SSR)
      // FIXME: the app would crash if localStorage doesn't work
      const preferredDisplayMode = window.localStorage.getItem(
        DISPLAY_MODE_KEY
      );
      return preferredDisplayMode &&
        ["TABLE", "CARDS"].includes(preferredDisplayMode)
        ? (preferredDisplayMode as "TABLE" | "CARDS")
        : "TABLE";
    }
  );

  React.useEffect(() => {
    // FIXME: the app would throw an error if localStorage doesn't work
    window.localStorage.setItem(DISPLAY_MODE_KEY, displayMode);
  }, [displayMode]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Transport</BreadcrumbItem>
        {toCollect && <BreadcrumbItem>À collecter</BreadcrumbItem>}
        {collected && (
          <BreadcrumbItem>
            Chargés, en attente de réception ou de transfert
          </BreadcrumbItem>
        )}
      </Breadcrumb>

      <div style={{ margin: "1rem" }}>
        <button
          type="button"
          className={classNames("btn btn--small btn--left", {
            "btn--primary": displayMode === "TABLE",
            "btn--outline-primary": displayMode === "CARDS",
          })}
          onClick={() => setDisplayMode("TABLE")}
        >
          <IconLayout2
            color={displayMode === "CARDS" ? "blueLight" : "white"}
            size="16px"
          />{" "}
          <span>Tableau</span>
        </button>
        <button
          type="button"
          className={classNames("btn btn--small btn--right", {
            "btn--primary": displayMode === "CARDS",
            "btn--outline-primary": displayMode === "TABLE",
          })}
          onClick={() => setDisplayMode("CARDS")}
        >
          <IconLayoutModule1
            color={displayMode === "TABLE" ? "blueLight" : "white"}
            size="16px"
          />{" "}
          <span>Cartes</span>
        </button>
      </div>
      <Switch>
        <Route path={routes.dashboard.transport.toCollect}>
          <ToCollectTab />
        </Route>
        <Route path={routes.dashboard.transport.collected}>
          <CollectedTab />
        </Route>
        <Redirect
          to={generatePath(routes.dashboard.transport.toCollect, {
            siret,
          })}
        />
      </Switch>
    </>
  );
}
