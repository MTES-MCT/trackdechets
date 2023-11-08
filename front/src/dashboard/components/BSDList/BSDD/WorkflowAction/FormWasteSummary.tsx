import * as React from "react";
import { Form, QuantityType } from "codegen-ui";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm
} from "../../../../../common/components";

interface FormWasteSummaryProps {
  form: Form;
}

export function FormWasteSummary({ form }: FormWasteSummaryProps) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSDD n°</DataListTerm>
        <DataListDescription>{form.readableId}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{form.wasteDetails?.code}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Appellation du déchet</DataListTerm>
        <DataListDescription>{form.wasteDetails?.name}</DataListDescription>
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
    </DataList>
  );
}
