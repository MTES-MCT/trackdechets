import * as React from "react";
import { Consistence, Form, Maybe, QuantityType } from "@td/codegen-ui";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm,
  DsfrDataList,
  DsfrDataListItem,
  DsfrDataListTerm,
  DsfrDataListDescription
} from "../../../../../common/components";
import { notNullNorUndefined } from "../../../../../common/helper";

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

const getConsistenceLabel = (consistence: Maybe<Consistence> | undefined) => {
  switch (consistence) {
    case Consistence.Liquid:
      return "Liquide";
    case Consistence.Solid:
      return "Solide";
    case Consistence.Doughy:
      return "Pâteux";
    case Consistence.Gaseous:
      return "Gaseux";

    default:
      return "Non soumis";
  }
};

const getWasteQuantityAndIsEstimated = (
  form
): { quantity: number; isEstimated: boolean } => {
  if (notNullNorUndefined(form.quantityReceived)) {
    return { quantity: form.quantityReceived, isEstimated: false };
  }

  return {
    quantity: form.wasteDetails?.quantity,
    isEstimated: form.wasteDetails?.quantityType === QuantityType.Estimated
  };
};

export function DsfrFormWasteSummary({ form }: FormWasteSummaryProps) {
  const { quantity, isEstimated } = getWasteQuantityAndIsEstimated(form);

  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSDD n°</DsfrDataListTerm>
        <DsfrDataListDescription>{form.readableId}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
        <DsfrDataListDescription>
          {form.wasteDetails?.code}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Nom usuel</DsfrDataListTerm>
        <DsfrDataListDescription>
          {form.wasteDetails?.name}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Consistance</DsfrDataListTerm>
        <DsfrDataListDescription>
          {getConsistenceLabel(form.wasteDetails?.consistence)}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Conditionnement</DsfrDataListTerm>
        <DsfrDataListDescription>
          {form.wasteDetails?.packagingInfos
            ?.map(packaging => `${packaging.quantity} ${packaging.type}`)
            .join(", ")}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Poids estimé / réel</DsfrDataListTerm>
        <DsfrDataListDescription>
          {`${quantity}t${isEstimated ? " (estimé)" : ""}`}
        </DsfrDataListDescription>
      </DsfrDataListItem>
    </DsfrDataList>
  );
}
