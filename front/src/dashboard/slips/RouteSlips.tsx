import * as React from "react";
import {
  useParams,
  generatePath,
  Switch,
  Route,
  Redirect,
  useRouteMatch,
} from "react-router-dom";
import routes from "common/routes";
import { IconClose } from "common/components/Icons";
import ActTab from "./tabs/ActTab";
import DraftsTab from "./tabs/DraftsTab";
import FollowTab from "./tabs/FollowTab";
import HistoryTab from "./tabs/HistoryTab";
import SlipDetail from "../slip/SlipDetail";

// FIXME: add the "créer un bordereau" button
// btw, shouldn't it be included in the transport route too?
export default function RouteSlips() {
  const { siret } = useParams<{ siret: string }>();
  const draft = useRouteMatch(routes.dashboard.slips.drafts);
  const act = useRouteMatch(routes.dashboard.slips.act);
  const follow = useRouteMatch(routes.dashboard.slips.follow);
  const history = useRouteMatch(routes.dashboard.slips.history);
  const detail = useRouteMatch(routes.dashboard.slips.view);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const warningBannerShown = window.localStorage.getItem("td-warningbanner");
    if (!warningBannerShown) {
      setIsOpen(true);
    }
  }, []);

  return (
    <>
      <div style={{ padding: "1rem" }}>
        <div>
          <div className="title">
            <h2 className="h3 tw-mb-4">
              Mes Bordereaux{" "}
              <span>
                {"> "}
                {draft && "Brouillons"}
                {act && "Pour Action"}
                {follow && "Suivi"}
                {history && "Archives"}
                {detail && "Aperçu"}
              </span>
            </h2>
          </div>
        </div>
        {isOpen && (
          <div className="notification warning tw-flex tw-items-center">
            <p>
              Actuellement, Trackdéchets ne permet pas de prendre en compte les
              déchets d'amiante, les DASRI et les Fluides frigorigènes, ainsi
              que l'annexe 3 (Spécifique Véhicules Hors d'Usage) et le
              multimodal. Merci de votre compréhension
            </p>
            <button
              aria-label="Fermer"
              className="tw-border-none tw-bg-transparent"
              onClick={() => {
                window.localStorage.setItem("td-warningbanner", "HIDDEN");
                setIsOpen(false);
              }}
            >
              <IconClose className="tw-text-2xl tw-ml-1" />
            </button>
          </div>
        )}
      </div>
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
    </>
  );
}
