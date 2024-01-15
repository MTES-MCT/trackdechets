import * as React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription
} from "../../../../../common/components";

interface Props {
  bsvhu: Bsvhu;
}

export function BsvhuJourneySummary({ bsvhu }: Props) {
  return (
    <Journey>
      <JourneyStop
        variant={bsvhu.emitter?.emission?.signature ? "complete" : "active"}
      >
        <JourneyStopName>Émetteur</JourneyStopName>
        <JourneyStopDescription>
          {bsvhu.emitter?.company?.name} ({bsvhu.emitter?.company?.siret})<br />
          {bsvhu.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop
        variant={
          bsvhu.transporter?.transport?.signature
            ? "complete"
            : bsvhu.emitter?.emission?.signature
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Transporteur</JourneyStopName>
        <JourneyStopDescription>
          {bsvhu.transporter?.company?.name} (
          {bsvhu.transporter?.company?.orgId})
          <br />
          {bsvhu.transporter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      <JourneyStop
        variant={
          bsvhu.destination?.operation?.signature
            ? "complete"
            : bsvhu.transporter?.transport?.signature
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Destinataire</JourneyStopName>
        <JourneyStopDescription>
          {bsvhu.destination?.company?.name} (
          {bsvhu.destination?.company?.siret})
          <br />
          {bsvhu.destination?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
    </Journey>
  );
}
