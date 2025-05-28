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
} from "../../../../common/components";
import { isDefined } from "../../../../common/helper";
import { getFormWasteDetailsADRMention } from "@td/constants";
import { WASTE_NAME_LABEL } from "../../../common/wordings/wordingsCommon";

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
        <DataListTerm>{WASTE_NAME_LABEL}</DataListTerm>
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
        <DataListTerm>Mention ADR</DataListTerm>
        <DataListDescription>
          {getFormWasteDetailsADRMention(form.wasteDetails)}
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
  if (isDefined(form.stateSummary?.quantity)) {
    return {
      quantity: form.stateSummary.quantity,
      isEstimated: form.stateSummary.quantityType === QuantityType.Estimated
    };
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
        <DsfrDataListTerm>{WASTE_NAME_LABEL}</DsfrDataListTerm>
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
        <DsfrDataListTerm>
          {isEstimated ? "Poids estimé" : "Poids réel"}
        </DsfrDataListTerm>
        <DsfrDataListDescription>{`${quantity}t`}</DsfrDataListDescription>
      </DsfrDataListItem>
    </DsfrDataList>
  );
}
