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
  return (
    <Journey>
      <JourneyStop
        variant={bsda.emitter?.emission?.signature ? "complete" : "active"}
      >
        <JourneyStopName>Émetteur</JourneyStopName>
        <JourneyStopDescription>
          {bsda.emitter?.company?.name} (
          {bsda.emitter?.company?.siret || "particulier"})<br />
          {bsda.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      {bsda.worker?.company?.name && (
        <JourneyStop
          variant={
            bsda.worker?.work?.signature
              ? "complete"
              : bsda.emitter?.emission?.signature
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
      {bsda.transporter?.company?.name && (
        <JourneyStop
          variant={
            bsda.transporter?.transport?.signature
              ? "complete"
              : bsda.worker?.work?.signature
              ? "active"
              : "incomplete"
          }
        >
          <JourneyStopName>Transporteur</JourneyStopName>
          <JourneyStopDescription>
            {bsda.transporter?.company?.name} (
            {bsda.transporter?.company?.orgId})
            <br />
            {bsda.transporter?.company?.address}
          </JourneyStopDescription>
        </JourneyStop>
      )}
      <JourneyStop
        variant={
          bsda.destination?.operation?.signature
            ? "complete"
            : bsda.transporter?.transport?.signature
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
