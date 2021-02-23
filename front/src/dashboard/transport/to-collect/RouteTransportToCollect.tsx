import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  FormRole,
  FormStatus,
  Query,
  QueryFormsArgs,
} from "generated/graphql/types";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import Loader from "common/components/Loaders";
import { BSDList, COLUMNS } from "../../components/BSDList";
import { GET_TRANSPORT_SLIPS } from "../queries";

const TO_COLLECT_COLUMNS = [
  COLUMNS.readableId,
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.quantity,
  COLUMNS.transporterCustomInfo,
  COLUMNS.transporterNumberPlate,
];

export function RouteTransportToCollect() {
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
    if (form.status === "SEALED") {
      return form.transporter?.company?.siret === siret;
    }

    if (form.status === "RESEALED") {
      return form.temporaryStorageDetail?.transporter?.company?.siret === siret;
    }

    if (form.status === "SENT") {
      const segments = form.transportSegments ?? [];
      return segments.some(
        segment =>
          segment.readyToTakeOver &&
          !segment.takenOverAt &&
          segment.transporter?.company?.siret === siret
      );
    }

    return false;
  });

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Transport</BreadcrumbItem>
        <BreadcrumbItem>À collecter</BreadcrumbItem>
      </Breadcrumb>

      {loading ? (
        <Loader />
      ) : (
        <BSDList
          siret={siret}
          forms={filteredForms}
          loading={loading}
          fetchMore={fetchMore}
          columns={TO_COLLECT_COLUMNS}
        />
      )}
    </>
  );
}
