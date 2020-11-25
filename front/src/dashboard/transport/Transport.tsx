import { useQuery, NetworkStatus } from "@apollo/client";
import Loader, { RefreshLoader } from "common/components/Loaders";
import React from "react";
import { MEDIA_QUERIES, COLORS } from "common/config";
import {
  Form,
  FormRole,
  FormStatus,
  Query,
  QueryFormsArgs,
} from "generated/graphql/types";
import {
  RefreshIcon,
  Layout2Icon,
  LayoutModule1Icon,
} from "common/components/Icons";
import routes from "common/routes";

import { GET_TRANSPORT_SLIPS } from "./queries";
import useLocalStorage from "common/hooks/useLocalStorage";
import { useMedia } from "use-media";

import { TransportTable } from "./TransportTable";
import { TransportCards } from "./TransportCards";
import {
  generatePath,
  Redirect,
  Route,
  Switch,
  useParams,
} from "react-router-dom";

import styles from "./Transport.module.scss";

const TRANSPORTER_FILTER_STORAGE_KEY = "td-transporter-filter";
const DISPLAY_TYPE_STORAGE_KEY = "td-display-type";

export default function Transport() {
  const { siret } = useParams<{ siret: string }>();

  return (
    <div>
      <Switch>
        <Route path={routes.dashboard.transport.toCollect}>
          <TransportContent formType="TO_TAKE_OVER" />
        </Route>
        <Route path={routes.dashboard.transport.collected}>
          <TransportContent formType="TAKEN_OVER" />
        </Route>
        <Redirect
          to={generatePath(routes.dashboard.transport.toCollect, {
            siret,
          })}
        />
      </Switch>
    </div>
  );
}

/**
 * Render Transporter forms either as table or cards according to
 * user preferences (stored in local storage)
 * @param param0
 */
export function TransportContent({ formType }) {
  const { siret } = useParams<{ siret: string }>();

  const [persistentFilter, setPersistentFilter] = useLocalStorage(
    TRANSPORTER_FILTER_STORAGE_KEY
  );
  const [displayAsCards, setDisplayAsCards] = useLocalStorage(
    DISPLAY_TYPE_STORAGE_KEY
  );
  const isMobile = useMedia({ maxWidth: MEDIA_QUERIES.handHeld });

  const DisplayComponent =
    isMobile || displayAsCards ? TransportCards : TransportTable;
  const refetchQuery = {
    query: GET_TRANSPORT_SLIPS,
    variables: {
      siret: siret,
      roles: [FormRole.Transporter],
      status: [
        FormStatus.Sealed,
        FormStatus.Sent,
        FormStatus.Resealed,
        FormStatus.Resent,
      ],
    },
  };

  const { error, data, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(refetchQuery.query, {
    variables: refetchQuery.variables,
    notifyOnNetworkStatusChange: true,
  });

  if (networkStatus === NetworkStatus.loading) return <Loader />;
  if (error) return <div>error</div>;

  const filterAgainstPersistentFilter = (field, filterParam) => {
    field = !field ? "" : field;
    return field.toLowerCase().indexOf(filterParam.toLowerCase()) > -1;
  };

  const filtering = (form: Form): boolean => {
    const statuses = {
      TO_TAKE_OVER: ["SEALED", "RESEALED"],
      TAKEN_OVER: ["SENT", "RESENT"],
    }[formType];

    const segmentsToTakeOver =
      form.transportSegments?.filter(
        segment =>
          segment.readyToTakeOver &&
          !segment.takenOverAt &&
          segment.transporter?.company?.siret === siret
      ) ?? [];

    const hasTakenOverASegment =
      form.transportSegments?.filter(
        segment =>
          segment.transporter?.company?.siret === siret && !!segment.takenOverAt
      ) ?? [];

    return (
      (statuses.includes(form.status) &&
        form.transporter?.company?.siret === siret) ||
      (formType === "TO_TAKE_OVER" &&
        form.status === "SENT" &&
        !!segmentsToTakeOver.length) ||
      (formType === "TAKEN_OVER" &&
        form.status === "SENT" &&
        !!hasTakenOverASegment.length)
    );
  };

  // filter forms by status and concatenate waste code and name to ease searching
  const filteredForms = data
    ? data.forms
        .filter(
          f =>
            filtering(f) &&
            filterAgainstPersistentFilter(
              f.stateSummary?.transporterCustomInfo,
              persistentFilter
            )
        )
        .map(f => ({
          ...f,
          wasteDetails: {
            ...f.wasteDetails,
            name: `${f.wasteDetails?.code} ${f.wasteDetails?.name} `,
          },
        }))
    : [];
  return (
    <div>
      <div className={styles.headerContent}>
        <h2 className={`${styles.headerTitle} h2 tw-mb-4`}>
          Transport {"> "}
          {formType === "TAKEN_OVER"
            ? "Chargés, en attente de réception ou de transfert"
            : "À collecter"}
        </h2>
      </div>
      <div className={styles.chooseLayout}>
        <button
          className={`btn btn--small btn--left ${
            !displayAsCards ? "btn--primary" : "btn--outline-primary"
          }`}
          onClick={() => setDisplayAsCards(false)}
        >
          <Layout2Icon
            color={displayAsCards ? COLORS.blueLight : COLORS.white}
            size={16}
          />{" "}
          <span>Tableau</span>
        </button>
        <button
          className={`btn btn--small btn--right ${
            displayAsCards ? "btn--primary" : "btn--outline-primary"
          }`}
          onClick={() => setDisplayAsCards(true)}
        >
          <LayoutModule1Icon
            color={!displayAsCards ? COLORS.blueLight : COLORS.white}
            size={16}
          />{" "}
          <span>Cartes</span>
        </button>
      </div>
      <div className={styles.transportMenu}>
        <div className="transporter-permanent-filter  ">
          <input
            type="text"
            className="td-input"
            placeholder="Filtrer…"
            value={persistentFilter}
            onChange={e => setPersistentFilter(e.target.value)}
          />
          {persistentFilter && (
            <button
              className="btn btn--outline-danger"
              onClick={e => setPersistentFilter("")}
            >
              Afficher tous les bordereaux
            </button>
          )}
        </div>
        <button
          className="btn btn--primary tw-ml-auto tw-mr-1"
          onClick={() => refetch()}
        >
          <span>Rafraîchir</span> <RefreshIcon />
        </button>
      </div>
      <RefreshLoader networkStatus={networkStatus} />
      <DisplayComponent
        forms={filteredForms}
        userSiret={siret}
        refetchQuery={refetchQuery}
      />
    </div>
  );
}
