import { useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Query, RegistryImportType } from "@td/codegen-ui";
import { format, subDays } from "date-fns";
import React, { useState } from "react";
import { InlineLoader } from "../../../Apps/common/Components/Loader/Loaders";
import { GET_CHANGE_AGGREGATES } from "../shared";
import { Stat } from "./Stat";
import { FileImportsTable } from "./FileImportsTable";
import { ChangeAggregatesTable } from "./ChangeAggregatesTable";

type Props = { source: "API" | "FILE"; siret: string | undefined };

export function StatsTab({ source, siret }: Props) {
  const [window, setWindow] = useState(1);

  const { loading, error, data } = useQuery<
    Pick<Query, "registryChangeAggregates">
  >(GET_CHANGE_AGGREGATES, {
    variables: {
      siret,
      window,
      source
    }
  });

  const stats = data?.registryChangeAggregates?.reduce(
    (sum, aggregate) => {
      return {
        ssd:
          aggregate.type === RegistryImportType.Ssd
            ? sum.ssd + aggregate.numberOfInsertions
            : sum.ssd,
        incomingWaste:
          aggregate.type === RegistryImportType.IncomingWaste
            ? sum.incomingWaste + aggregate.numberOfInsertions
            : sum.incomingWaste,
        outgoingWaste:
          aggregate.type === RegistryImportType.OutgoingWaste
            ? sum.outgoingWaste + aggregate.numberOfInsertions
            : sum.outgoingWaste,
        incomingTexs:
          aggregate.type === RegistryImportType.IncomingTexs
            ? sum.incomingTexs + aggregate.numberOfInsertions
            : sum.incomingTexs,
        outgoingTexs:
          aggregate.type === RegistryImportType.OutgoingTexs
            ? sum.outgoingTexs + aggregate.numberOfInsertions
            : sum.outgoingTexs,
        transported:
          aggregate.type === RegistryImportType.Transported
            ? sum.transported + aggregate.numberOfInsertions
            : sum.transported,
        managed:
          aggregate.type === RegistryImportType.Managed
            ? sum.managed + aggregate.numberOfInsertions
            : sum.managed,
        inserted: sum.inserted + aggregate.numberOfInsertions,
        edited: sum.edited + aggregate.numberOfEdits,
        cancelled: sum.cancelled + aggregate.numberOfCancellations
      };
    },
    {
      inserted: 0,
      edited: 0,
      cancelled: 0,
      ssd: 0,
      incomingWaste: 0,
      outgoingWaste: 0,
      incomingTexs: 0,
      outgoingTexs: 0,
      transported: 0,
      managed: 0
    }
  );

  return (
    <div>
      <CallOut title="">
        <SegmentedControl
          legend={`Statistiques des déclarations par ${
            source === "API" ? "API" : "fichier"
          }`}
          hintText={generatePeriodText(window)}
          segments={[
            {
              label: "24 heures",
              iconId: "fr-icon-calendar-event-line",
              nativeInputProps: {
                defaultChecked: true,
                value: 1,
                onChange: v => setWindow(parseInt(v.currentTarget.value, 10))
              }
            },
            {
              label: "7 jours",
              iconId: "fr-icon-calendar-event-line",
              nativeInputProps: {
                value: 7,
                onChange: v => setWindow(parseInt(v.currentTarget.value, 10))
              }
            },
            {
              label: "30 jours",
              iconId: "fr-icon-calendar-event-line",
              nativeInputProps: {
                value: 30,
                onChange: v => setWindow(parseInt(v.currentTarget.value, 10))
              }
            }
          ]}
        />

        <div className="fr-mt-3w">
          {loading && <InlineLoader />}
          {error && (
            <Alert
              closable
              description={error.message}
              severity="error"
              title="Erreur lors du chargement"
            />
          )}

          <div className="tw-flex">
            <Stat value={stats?.inserted} label="Nouvelles" />
            <Stat value={stats?.edited} label="Corrigées" />
            <Stat value={stats?.cancelled} label="Annulées" />
          </div>
          <div className="tw-flex">
            <Stat value={stats?.ssd} label="SSD" />
            <Stat value={stats?.incomingWaste} label="D et ND entrants" />
            <Stat value={stats?.outgoingWaste} label="D et ND sortants" />
            <Stat value={stats?.incomingTexs} label="TEXS entrants" />
            <Stat value={stats?.outgoingTexs} label="TEXS sortants" />
            <Stat value={stats?.transported} label="Transportés" />
            <Stat value={stats?.managed} label="Gérés" />
          </div>
        </div>
      </CallOut>

      {siret && source === "FILE" && <FileImportsTable siret={siret} />}

      {siret && data?.registryChangeAggregates && source === "API" && (
        <ChangeAggregatesTable
          aggregates={data.registryChangeAggregates}
          siret={siret}
        />
      )}
    </div>
  );
}

function generatePeriodText(window: number) {
  const now = new Date();
  const startDate = subDays(now, window);

  const formattedStartDate = format(startDate, "dd/MM/yyyy HH:mm");
  const formattedEndDate = format(now, "dd/MM/yyyy HH:mm");

  return `Période : du ${formattedStartDate} au ${formattedEndDate}`;
}
