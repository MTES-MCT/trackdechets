import * as React from "react";
import { Field, useFormikContext } from "formik";
import {
  EmitterType,
  Form,
  QuantityType,
  SignEmissionFormInput
} from "@td/codegen-ui";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm
} from "../../../../../common/components";
import NumberInput from "../../../../../form/common/components/custom-inputs/NumberInput";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import { getFormWasteDetailsADRMention } from "@td/constants";
import { isDefined } from "../../../../../common/helper";
import PackagingList from "../../../../../form/bsdd/components/packagings/PackagingList";

interface FormWasteEmissionSummaryProps {
  form: Form;
}

type FormValues = Pick<
  SignEmissionFormInput,
  "onuCode" | "packagingInfos" | "quantity" | "transporterNumberPlate"
>;
type FormKeys = keyof FormValues;

const EDITABLE_FIELDS: Record<FormKeys, () => JSX.Element> = {
  quantity: () => (
    <div className="form__row">
      <label>
        Poids (en tonnes)
        <Field component={NumberInput} name="quantity" className="td-input" />
      </label>
    </div>
  ),
  onuCode: () => (
    <div className="form__row">
      <label>
        Mention ADR
        <Field name="onuCode" className="td-input" />
      </label>
    </div>
  ),
  packagingInfos: () => (
    <div className="form__row">
      <h6 className="fr-h6">Conditionnement</h6>
      <PackagingList fieldName="packagingInfos" />
    </div>
  ),
  transporterNumberPlate: () => (
    <div className="form__row">
      <label>
        Plaque d'immatriculation{" "}
        <Field name="transporterNumberPlate" className="td-input" />
      </label>
    </div>
  )
};

export function FormWasteEmissionSummary({
  form
}: FormWasteEmissionSummaryProps) {
  const { values } = useFormikContext<FormValues>();

  const [fields, setFields] = React.useState<FormKeys[]>([]);
  const addField = (name: FormKeys) =>
    setFields(currentFields =>
      currentFields
        .concat([name])
        .filter((name, index, fields) => fields.indexOf(name) === index)
    );

  return (
    <>
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
            {values.quantity}{" "}
            {form.wasteDetails?.quantityType === QuantityType.Estimated
              ? "(estimé)"
              : ""}
            <button
              type="button"
              onClick={() => addField("quantity")}
              className="tw-ml-2"
            >
              <IconPaperWrite color="blue" />
            </button>
          </DataListDescription>
        </DataListItem>
        <DataListItem>
          <DataListTerm>Contenant(s)</DataListTerm>
          <DataListDescription>
            {values.packagingInfos
              ?.map(packaging =>
                packaging?.type
                  ? `${packaging.quantity} ${packaging.type}(s)`
                  : ""
              )
              .join(", ")}

            <button
              type="button"
              onClick={() => addField("packagingInfos")}
              className="tw-ml-2"
            >
              <IconPaperWrite color="blue" />
            </button>
          </DataListDescription>
        </DataListItem>
        {form.emitter?.type !== EmitterType.Appendix1Producer && (
          <DataListItem>
            <DataListTerm>Mention ADR</DataListTerm>
            <DataListDescription>
              {getFormWasteDetailsADRMention({
                ...form.wasteDetails,
                ...values
              })}

              {/* Enable editing ADR only if:
              - BSD is explicictely subject to ADR (isSubjectToADR)
              - BSD is legacy (isSubjectToADR is not defined) */}
              {(!isDefined(form.wasteDetails?.isSubjectToADR) ||
                form.wasteDetails?.isSubjectToADR === true) && (
                <button
                  type="button"
                  onClick={() => addField("onuCode")}
                  className="tw-ml-2"
                >
                  <IconPaperWrite color="blue" />
                </button>
              )}
            </DataListDescription>
          </DataListItem>
        )}
        {form.emitter?.type !== EmitterType.Appendix1Producer && (
          <DataListItem>
            <DataListTerm>Plaque d'immatriculation</DataListTerm>
            <DataListDescription>
              {values.transporterNumberPlate}

              <button
                type="button"
                onClick={() => addField("transporterNumberPlate")}
                className="tw-ml-2"
              >
                <IconPaperWrite color="blue" />
              </button>
            </DataListDescription>
          </DataListItem>
        )}
      </DataList>
      {fields.length > 0 && (
        <div className="tw-mb-4">
          {fields.map(name => {
            const Component = EDITABLE_FIELDS[name];
            return <Component key={name} />;
          })}
        </div>
      )}
    </>
  );
}
