import * as React from "react";
import { Bsff, BsffStatus } from "@td/codegen-ui";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription,
  JourneyStopVariant
} from "../../../../../common/components";

interface BsffJourneySummaryProps {
  bsff: Bsff;
}

export function BsffJourneySummary({ bsff }: BsffJourneySummaryProps) {
  const signedByEmitter = Boolean(bsff.emitter?.emission?.signature?.date);

  let destinationStopVariant: JourneyStopVariant = "incomplete";

  if (
    [
      BsffStatus.Processed,
      BsffStatus.IntermediatelyProcessed,
      BsffStatus.Refused
    ].includes(bsff.status)
  ) {
    destinationStopVariant = "complete";
  } else if (
    (bsff.transporters ?? []).every(t => Boolean(t?.transport?.signature?.date))
  ) {
    destinationStopVariant = "active";
  }

  return (
    <Journey>
      <JourneyStop variant={signedByEmitter ? "complete" : "active"}>
        <JourneyStopName>Émetteur</JourneyStopName>
        <JourneyStopDescription>
          {bsff.emitter?.company?.name} ({bsff.emitter?.company?.siret})<br />
          {bsff.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      {bsff.transporters.map((transporter, idx) => {
        let variant: JourneyStopVariant = "incomplete";
        if (transporter?.transport?.signature?.date) {
          variant = "complete";
        } else if (
          (idx > 0 && bsff.transporters[idx - 1].transport?.signature?.date) ||
          (idx === 0 && signedByEmitter)
        ) {
          // Le transporteur est considéré actif s'il est le premier
          // dans la liste des transporteurs à ne pas encore avoir pris
          // en charge le déchet après la signature émetteur
          variant = "active";
        }

        return (
          <JourneyStop key={transporter.id} variant={variant}>
            <JourneyStopName>
              Transporteur
              {bsff.transporters.length > 1 ? ` n° ${idx + 1}` : ""}
            </JourneyStopName>

            <JourneyStopDescription>
              {transporter?.company?.name} ({transporter?.company?.orgId})
              <br />
              {transporter?.company?.address}
            </JourneyStopDescription>
          </JourneyStop>
        );
      })}
      <JourneyStop variant={destinationStopVariant}>
        <JourneyStopName>Destinataire</JourneyStopName>
        <JourneyStopDescription>
          {bsff.destination?.company?.name} ({bsff.destination?.company?.siret})
          <br />
          {bsff.destination?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
    </Journey>
  );
}
