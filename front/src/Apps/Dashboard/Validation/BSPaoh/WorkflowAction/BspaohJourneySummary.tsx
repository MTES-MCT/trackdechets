import * as React from "react";
import { Bspaoh } from "@td/codegen-ui";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription
} from "../../../../../common/components";

interface BspaohJourneySummaryProps {
  bspaoh: Bspaoh;
}

export function BspaohJourneySummary({
  bspaoh
}: Readonly<BspaohJourneySummaryProps>) {
  const steps = {
    INITIAL: ["active", "incomplete", "incomplete"],
    SIGNED_BY_PRODUCER: ["complete", "active", "incomplete"],
    SENT: ["complete", "complete", "incomplete"],
    RECEIVED: ["complete", "complete", "active"],
    PROCESSED: ["complete", "complete", "complete"],
    REFUSED: ["complete", "complete", "complete"],
    PARTIALLY_REFUSED: ["complete", "complete", "complete"]
  };
  const status = bspaoh["bspaohStatus"];

  if (status === "PROCESSED") {
    return null;
  }
  return (
    <Journey>
      <JourneyStop variant={steps[status][0]}>
        <JourneyStopName>Producteur</JourneyStopName>
        <JourneyStopDescription>
          {bspaoh.emitter?.company?.name} ({bspaoh.emitter?.company?.siret})
          <br />
          {bspaoh.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop variant={steps[status][1]}>
        <JourneyStopName>Transporteur</JourneyStopName>
        <JourneyStopDescription>
          {bspaoh.transporter?.company?.name} (
          {bspaoh.transporter?.company?.orgId})
          <br />
          {bspaoh.transporter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop variant={steps[status][2]}>
        <JourneyStopName>Crématorium</JourneyStopName>
        <JourneyStopDescription>
          {bspaoh.destination?.company?.name} (
          {bspaoh.destination?.company?.siret})
          <br />
          {bspaoh.destination?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
    </Journey>
  );
}
