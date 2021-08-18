import * as React from "react";
import { Bsff } from "generated/graphql/types";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription,
} from "common/components";

interface BsffJourneySummaryProps {
  bsff: Bsff;
}

export function BsffJourneySummary({ bsff }: BsffJourneySummaryProps) {
  return (
    <Journey>
      <JourneyStop
        variant={bsff.emitter?.emission?.signature ? "complete" : "active"}
      >
        <JourneyStopName>Émetteur</JourneyStopName>
        <JourneyStopDescription>
          {bsff.emitter?.company?.name} ({bsff.emitter?.company?.siret})<br />
          {bsff.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop
        variant={
          bsff.transporter?.transport?.signature
            ? "complete"
            : bsff.emitter?.emission?.signature
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Transporteur</JourneyStopName>
        <JourneyStopDescription>
          {bsff.transporter?.company?.name} ({bsff.transporter?.company?.siret})
          <br />
          {bsff.transporter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop
        variant={
          bsff.destination?.operation?.signature
            ? "complete"
            : bsff.transporter?.transport?.signature
            ? "active"
            : "incomplete"
        }
      >
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
