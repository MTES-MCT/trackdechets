import * as React from "react";
import { Bspaoh } from "@td/codegen-ui";
import {
  DsfrJourney,
  DsfrJourneyStop,
  DsfrJourneyStopName,
  DsfrJourneyStopDescription
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
    <DsfrJourney>
      <DsfrJourneyStop variant={steps[status][0]}>
        <DsfrJourneyStopName>Producteur</DsfrJourneyStopName>
        <DsfrJourneyStopDescription>
          {bspaoh.emitter?.company?.name} ({bspaoh.emitter?.company?.siret})
          <br />
          {bspaoh.emitter?.company?.address}
        </DsfrJourneyStopDescription>
      </DsfrJourneyStop>
      <DsfrJourneyStop variant={steps[status][1]}>
        <DsfrJourneyStopName>Transporteur</DsfrJourneyStopName>
        <DsfrJourneyStopDescription>
          {bspaoh.transporter?.company?.name} (
          {bspaoh.transporter?.company?.orgId})
          <br />
          {bspaoh.transporter?.company?.address}
        </DsfrJourneyStopDescription>
      </DsfrJourneyStop>
      <DsfrJourneyStop variant={steps[status][2]}>
        <DsfrJourneyStopName>Crématorium</DsfrJourneyStopName>
        <DsfrJourneyStopDescription>
          {bspaoh.destination?.company?.name} (
          {bspaoh.destination?.company?.siret})
          <br />
          {bspaoh.destination?.company?.address}
        </DsfrJourneyStopDescription>
      </DsfrJourneyStop>
    </DsfrJourney>
  );
}
