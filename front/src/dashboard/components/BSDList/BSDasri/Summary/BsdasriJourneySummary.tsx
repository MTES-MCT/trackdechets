import * as React from "react";
import { Bsdasri } from "generated/graphql/types";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription,
} from "common/components";

interface BsdasriJourneySummaryProps {
  bsdasri: Bsdasri;
}

export function BsdasriJourneySummary({ bsdasri }: BsdasriJourneySummaryProps) {
  const steps = {
    INITIAL: ["active", "incomplete", "incomplete"],
    SIGNED_BY_PRODUCER: ["complete", "active", "incomplete"],
    SENT: ["complete", "active", "incomplete"],
    RECEIVED: ["complete", "complete", "active"],
    PROCESSED: ["complete", "complete", "complete"],
  };
  const status = bsdasri["bsdasriStatus"];

  return (
    <Journey>
      <JourneyStop variant={steps[status][0]}>
        <JourneyStopName>Producteur</JourneyStopName>
        <JourneyStopDescription>
          {bsdasri.emitter?.company?.name} ({bsdasri.emitter?.company?.siret})
          <br />
          {bsdasri.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop variant={steps[status][1]}>
        <JourneyStopName>Transporteur</JourneyStopName>
        <JourneyStopDescription>
          {bsdasri.transporter?.company?.name} (
          {bsdasri.transporter?.company?.siret})
          <br />
          {bsdasri.transporter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop variant={steps[status][2]}>
        <JourneyStopName>Destinataire</JourneyStopName>
        <JourneyStopDescription>
          {bsdasri.destination?.company?.name} (
          {bsdasri.destination?.company?.siret})
          <br />
          {bsdasri.destination?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
    </Journey>
  );
}
