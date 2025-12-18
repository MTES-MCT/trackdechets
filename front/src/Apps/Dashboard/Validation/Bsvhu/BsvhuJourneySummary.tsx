import * as React from "react";
import { Bsvhu, Query, QueryCompanyPrivateInfosArgs } from "@td/codegen-ui";
import {
  Journey,
  JourneyStop,
  JourneyStopName,
  JourneyStopDescription
} from "../../../../common/components";
import { mapBsvhu } from "../../bsdMapper";
import { isBsvhuSign } from "../../dashboardServices";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../../common/queries/company/query";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

interface Props {
  bsvhu: Bsvhu;
}

export function BsvhuJourneySummary({ bsvhu }: Props) {
  const { data: dataEmitterRegistered } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS, {
    variables: { clue: bsvhu.emitter?.company?.siret! }
  });
  const { siret } = useParams<{ siret: string }>();

  const isEmitterRegistered =
    dataEmitterRegistered?.companyPrivateInfos?.isRegistered;
  const formattedBsvhuAsBsdDisplay = mapBsvhu(bsvhu);

  const canIrregularSituationSign = isBsvhuSign(
    formattedBsvhuAsBsdDisplay,
    siret!,
    isEmitterRegistered
  );

  return (
    <Journey>
      <JourneyStop
        variant={
          bsvhu.emitter?.emission?.signature || !canIrregularSituationSign
            ? "complete"
            : "active"
        }
      >
        <JourneyStopName>Producteur</JourneyStopName>
        <JourneyStopDescription>
          {bsvhu.emitter?.company?.name} ({bsvhu.emitter?.company?.siret})<br />
          {bsvhu.emitter?.company?.address}
        </JourneyStopDescription>
      </JourneyStop>
      {bsvhu.transporters.map((transporter, idx) => {
        return (
          <JourneyStop
            key={idx}
            variant={
              transporter?.transport?.signature?.date
                ? "complete"
                : // Le transporteur est considéré actif s'il est le premier
                // dans la liste des transporteurs à ne pas encore avoir pris
                // en charge le déchet après la signature émetteur
                idx > 0 &&
                  bsvhu.transporters[idx - 1].transport?.signature?.date
                ? "active"
                : "incomplete"
            }
          >
            <JourneyStopName>
              Transporteur
              {bsvhu.transporters.length > 1 ? ` n° ${idx + 1}` : ""}
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
          bsvhu.destination?.operation?.signature
            ? "complete"
            : (bsvhu.transporters ?? []).every(t =>
                Boolean(t?.transport?.signature?.date)
              )
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
