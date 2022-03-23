import * as React from "react";
import { Field, useFormikContext } from "formik";
import {
  Form,
  QuantityType,
  SignTransportFormInput,
} from "generated/graphql/types";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm,
} from "common/components";
import { IconPaperWrite } from "common/components/Icons";

interface FormWasteTransportSummaryProps {
  form: Form;
}

type FormValues = Pick<SignTransportFormInput, "transporterNumberPlate">;
type FormKeys = keyof FormValues;

const EDITABLE_FIELDS: Record<FormKeys, () => JSX.Element> = {
  transporterNumberPlate: () => (
    <div className="form__row">
      <label>
        Plaque d'immatriculation{" "}
        <Field name="transporterNumberPlate" className="td-input" />
      </label>
    </div>
  ),
};

export function FormWasteTransportSummary({
  form,
}: FormWasteTransportSummaryProps) {
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
