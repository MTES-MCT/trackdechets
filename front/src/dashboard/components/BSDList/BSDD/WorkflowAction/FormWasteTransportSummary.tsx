import * as React from "react";
import { Form, QuantityType } from "generated/graphql/types";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm,
} from "common/components";

interface FormWasteTransportSummaryProps {
  form: Form;
}

export function FormWasteTransportSummary({
  form,
}: FormWasteTransportSummaryProps) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSDD n°</DataListTerm>
        <DataListDescription>{form.readableId}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Déchet</DataListTerm>
        <DataListDescription>
          {form.wasteDetails?.code} {form.wasteDetails?.name}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Poids en tonnes</DataListTerm>
        <DataListDescription>
          {form.wasteDetails?.quantity}{" "}
          {form.wasteDetails?.quantityType === QuantityType.Estimated
            ? "(estimé)"
            : ""}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Contenant(s)</DataListTerm>
        <DataListDescription>
          {form.wasteDetails?.packagingInfos
            ?.map(packaging => `${packaging.quantity} ${packaging.type}`)
            .join(", ")}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code ADR (ONU)</DataListTerm>
        <DataListDescription>
          {form.wasteDetails?.onuCode ?? "Non soumis"}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Plaque d'immatriculation</DataListTerm>
        <DataListDescription>
          {form.stateSummary?.transporterNumberPlate}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
