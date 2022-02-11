import * as React from "react";
import { Form } from "generated/graphql/types";
import {
  Journey,
  JourneyStop,
  JourneyStopDescription,
  JourneyStopName,
} from "common/components";

interface FormJourneySummaryProps {
  form: Form;
}

export function FormJourneySummary({ form }: FormJourneySummaryProps) {
  const finalRecipient = form.temporaryStorageDetail
    ? {
        isComplete: Boolean(form.receivedAt),
        isActive: Boolean(form.temporaryStorageDetail.takenOverAt),
        company: form.temporaryStorageDetail.destination?.company,
      }
    : {
        isComplete: Boolean(form.receivedAt),
        isActive: Boolean(form.takenOverAt),
        company: form.recipient?.company,
      };
  return (
    <Journey>
      <JourneyStop variant={form.emittedAt ? "complete" : "active"}>
        <JourneyStopName>Émetteur</JourneyStopName>
        {form.emitter?.company && (
          <JourneyStopDescription>
            {form.emitter.company.name} ({form.emitter.company.siret})<br />
            {form.emitter.company.address}
          </JourneyStopDescription>
        )}
      </JourneyStop>
      <JourneyStop
        variant={
          form.takenOverAt
            ? "complete"
            : form.emittedAt
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Transporteur</JourneyStopName>
        {form.transporter?.company && (
          <JourneyStopDescription>
            {form.transporter.company.name} ({form.transporter.company.siret})
            <br />
            {form.transporter.company.address}
          </JourneyStopDescription>
        )}
      </JourneyStop>
      {form.temporaryStorageDetail && (
        <>
          <JourneyStop
            variant={
              form.temporaryStorageDetail.emittedAt
                ? "complete"
                : form.takenOverAt
                ? "active"
                : "incomplete"
            }
          >
            <JourneyStopName>Entreposage provisoire</JourneyStopName>
            {form.recipient?.company && (
              <JourneyStopDescription>
                {form.recipient.company.name} ({form.recipient.company.siret})
                <br />
                {form.recipient.company.address}
              </JourneyStopDescription>
            )}
          </JourneyStop>
          <JourneyStop
            variant={
              form.temporaryStorageDetail.takenOverAt
                ? "complete"
                : form.temporaryStorageDetail.emittedAt
                ? "active"
                : "incomplete"
            }
          >
            <JourneyStopName>Transporteur</JourneyStopName>
            {form.temporaryStorageDetail.transporter?.company && (
              <JourneyStopDescription>
                {form.temporaryStorageDetail.transporter.company.name} (
                {form.temporaryStorageDetail.transporter.company.siret})
                <br />
                {form.temporaryStorageDetail.transporter.company.address}
              </JourneyStopDescription>
            )}
          </JourneyStop>
        </>
      )}
      <JourneyStop
        variant={
          finalRecipient.isComplete
            ? "complete"
            : finalRecipient.isActive
            ? "active"
            : "incomplete"
        }
      >
        <JourneyStopName>Destinataire</JourneyStopName>
        {finalRecipient.company && (
          <JourneyStopDescription>
            {finalRecipient.company.name} ({finalRecipient.company.siret})
            <br />
            {finalRecipient.company.address}
          </JourneyStopDescription>
        )}
      </JourneyStop>
    </Journey>
  );
}
