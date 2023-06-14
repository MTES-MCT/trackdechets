import * as React from "react";
import { Field, useFormikContext } from "formik";
import {
  EmitterType,
  Form,
  FormStatus,
  QuantityType,
  SignTransportFormInput,
  WasteDetailsInput,
} from "generated/graphql/types";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm,
  RedErrorMessage,
} from "common/components";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { IconPaperWrite } from "common/components/Icons";
import Packagings from "form/bsdd/components/packagings/Packagings";
import { useEffect } from "react";

interface FormWasteTransportSummaryProps {
  form: Form;
}

type FormValues = Pick<SignTransportFormInput, "transporterNumberPlate"> & {
  update: Pick<
    WasteDetailsInput,
    "quantity" | "packagingInfos" | "sampleNumber"
  >;
};
type FormKeys = "transporterNumberPlate" | keyof FormValues["update"];

const SAMPLE_NUMBER_WASTE_CODES = [
  "13 02 04*",
  "13 02 05*",
  "13 02 06*",
  "13 02 07*",
  "13 02 08*",
];
const EDITABLE_FIELDS: Record<FormKeys, () => JSX.Element> = {
  transporterNumberPlate: () => (
    <div className="form__row">
      <label>
        Plaque d'immatriculation{" "}
        <Field name="transporterNumberPlate" className="td-input" />
      </label>
      <RedErrorMessage name="transporterNumberPlate" />
    </div>
  ),
  quantity: () => (
    <div className="form__row">
      <label>
        Poids (en tonnes)
        <Field
          component={NumberInput}
          name="update.quantity"
          className="td-input"
        />
      </label>
    </div>
  ),
  packagingInfos: () => (
    <div className="form__row">
      <label>
        Conditionnement(s)
        <Field name="update.packagingInfos" component={Packagings} />
      </label>
    </div>
  ),
  sampleNumber: () => (
    <div className="form__row">
      <label>
        Numéro d'échantillon
        <Field name="update.sampleNumber" type="text" className="td-input" />
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

  useEffect(() => {
    if (!form.transporter?.numberPlate) {
      addField("transporterNumberPlate");
    }
  }, [form]);

  const { temporaryStorageDetail } = form;

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

          {form.status === FormStatus.SignedByTempStorer ? (
            <DataListDescription>
              {temporaryStorageDetail?.wasteDetails?.quantity}{" "}
              {temporaryStorageDetail?.wasteDetails?.quantityType ===
              QuantityType.Estimated
                ? "(estimé)"
                : ""}
            </DataListDescription>
          ) : (
            <>
              <DataListDescription>
                {form.wasteDetails?.quantity}{" "}
                {form.wasteDetails?.quantityType === QuantityType.Estimated
                  ? "(estimé)"
                  : ""}
              </DataListDescription>{" "}
              {form.emitter?.type === EmitterType.Appendix1Producer && (
                <button
                  type="button"
                  onClick={() => addField("quantity")}
                  className="tw-ml-2"
                >
                  <IconPaperWrite color="blue" />
                </button>
              )}
            </>
          )}
        </DataListItem>
        <DataListItem>
          <DataListTerm>Contenant(s)</DataListTerm>
          {form.status === FormStatus.SignedByTempStorer ? (
            <DataListDescription>
              {temporaryStorageDetail?.wasteDetails?.packagingInfos
                ?.map(packaging => `${packaging.quantity} ${packaging.type}`)
                .join(", ")}
            </DataListDescription>
          ) : (
            <>
              <DataListDescription>
                {form.wasteDetails?.packagingInfos
                  ?.map(packaging => `${packaging.quantity} ${packaging.type}`)
                  .join(", ")}
              </DataListDescription>

              {form.emitter?.type === EmitterType.Appendix1Producer && (
                <button
                  type="button"
                  onClick={() => addField("packagingInfos")}
                  className="tw-ml-2"
                >
                  <IconPaperWrite color="blue" />
                </button>
              )}
            </>
          )}
        </DataListItem>
        <DataListItem>
          <DataListTerm>Code ADR (ONU)</DataListTerm>
          {form.status === FormStatus.SignedByTempStorer ? (
            <DataListDescription>
              {temporaryStorageDetail?.wasteDetails?.onuCode ?? "Non soumis"}
            </DataListDescription>
          ) : (
            <DataListDescription>
              {form.wasteDetails?.onuCode ?? "Non soumis"}
            </DataListDescription>
          )}
        </DataListItem>
        {form.emitter?.type === EmitterType.Appendix1Producer &&
          form.wasteDetails?.code &&
          SAMPLE_NUMBER_WASTE_CODES.includes(form.wasteDetails.code) && (
            <DataListItem>
              <DataListTerm>Numéro d'échantillon</DataListTerm>

              <DataListDescription>
                {form.wasteDetails?.sampleNumber}

                <button
                  type="button"
                  onClick={() => addField("sampleNumber")}
                  className="tw-ml-2"
                >
                  <IconPaperWrite color="blue" />
                </button>
              </DataListDescription>
            </DataListItem>
          )}
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
