import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  FormRole,
  FormStatus,
  Query,
  QueryFormsArgs,
} from "generated/graphql/types";
import {
  Blankslate,
  BlankslateDescription,
  BlankslateImg,
  BlankslateTitle,
  Breadcrumb,
  BreadcrumbItem,
} from "common/components";
import { COLUMNS, BSDList } from "../../components/BSDList";
import { GET_TRANSPORT_SLIPS } from "../queries";
import illustration from "./assets/blankslateCollected.svg";

const COLLECTED_COLUMNS = [
  COLUMNS.readableId,
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.quantity,
  COLUMNS.transporterCustomInfo,
  COLUMNS.transporterNumberPlate,
];

export function RouteTransportCollected() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, fetchMore } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_TRANSPORT_SLIPS, {
    variables: {
      siret,
      roles: [FormRole.Transporter],
      status: [
        FormStatus.Sealed,
        FormStatus.Sent,
        FormStatus.Resealed,
        FormStatus.Resent,
      ],
    },
    notifyOnNetworkStatusChange: true,
  });
  const forms = data?.forms ?? [];
  const filteredForms = forms.filter(form => {
    if (form.status === "SENT") {
      return form.transporter?.company?.siret === siret;
    }

    if (form.status === "RESENT") {
      return form.temporaryStorageDetail?.transporter?.company?.siret === siret;
    }

    const segments = form.transportSegments ?? [];
    return segments.some(
      segment =>
        segment.takenOverAt && segment.transporter?.company?.siret === siret
    );
  });

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Transport</BreadcrumbItem>
        <BreadcrumbItem>
          Chargés, en attente de réception ou de transfert
        </BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        columns={COLLECTED_COLUMNS}
        forms={filteredForms}
        siret={siret}
        fetchMore={fetchMore}
        loading={loading}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>Il n'y a aucun bordereau collecté</BlankslateTitle>
            <BlankslateDescription>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
              cours de transport par votre entreprise.
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
