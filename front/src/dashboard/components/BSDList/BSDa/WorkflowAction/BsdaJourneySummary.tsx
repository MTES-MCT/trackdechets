import * as React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription
} from "../../../../../common/components";

interface Props {
  bsda: Bsda;
}

export function BsdaJourneySummary({ bsda }: Props) {
  const signedByEmitter = Boolean(bsda.emitter?.emission?.signature?.date);
  const workerIsDisabled = bsda.worker?.isDisabled;
  const signedByWorker = Boolean(bsda.worker?.work?.signature?.date);

  return (
    <Journey>
      <JourneyStop variant={signedByEmitter ? "complete" : "active"}>
        <JourneyStopName>Émetteur</JourneyStopName>
        <JourneyStopDescription>
          {bsda.emitter?.company?.name} (
          {bsda.emitter?.company?.siret || "particulier"})<br />
          {bsda.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      {!workerIsDisabled && bsda.worker?.company?.siret && (
        <JourneyStop
          variant={
            signedByWorker
              ? "complete"
              : signedByEmitter
              ? "active"
              : "incomplete"
          }
        >
          <JourneyStopName>Entreprise de travaux</JourneyStopName>
          <JourneyStopDescription>
            {bsda.worker?.company?.name} ({bsda.worker?.company?.siret})
            <br />
            {bsda.worker?.company?.address}
          </JourneyStopDescription>
        </JourneyStop>
      )}
      {bsda.transporters.map((transporter, idx) => {
        return (
          <JourneyStop
            key={idx}
            variant={
              transporter?.transport?.signature?.date
                ? "complete"
                : // Le transporteur est considéré actif s'il est le premier
                // dans la liste des transporteurs à ne pas encore avoir pris
                // en charge le déchet après la signature émetteur
                (idx > 0 &&
                    bsda.transporters[idx - 1].transport?.signature?.date) ||
                  (idx === 0 &&
                    signedByEmitter &&
                    (workerIsDisabled || signedByWorker))
                ? "active"
                : "incomplete"
            }
          >
            <JourneyStopName>
              Transporteur{bsda.transporters.length > 1 ? ` n° ${idx + 1}` : ""}
            </JourneyStopName>

            <JourneyStopDescription>
              {transporter?.company?.name} ({transporter?.company?.orgId})
              <br />
              {transporter?.company?.address}
            </JourneyStopDescription>
          </JourneyStop>
        );
      })}
      <JourneyStop
        variant={
          bsda.destination?.operation?.signature
            ? "complete"
            : (bsda.transporters ?? []).every(t =>
                Boolean(t?.transport?.signature?.date)
              )
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Destinataire</JourneyStopName>
        <JourneyStopDescription>
          {bsda.destination?.company?.name} ({bsda.destination?.company?.siret})
          <br />
          {bsda.destination?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
    </Journey>
  );
}
