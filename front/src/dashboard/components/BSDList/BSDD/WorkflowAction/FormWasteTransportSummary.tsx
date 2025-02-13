import * as React from "react";
import { Field, useFormikContext } from "formik";
import {
  EmitterType,
  Form,
  FormStatus,
  QuantityType,
  SignTransportFormInput,
  TransportMode,
  WasteDetailsInput
} from "@td/codegen-ui";
import {
  DataList,
  DataListDescription,
  DataListItem,
  DataListTerm,
  FieldTransportModeSelect,
  RedErrorMessage
} from "../../../../../common/components";
import NumberInput from "../../../../../form/common/components/custom-inputs/NumberInput";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import { useEffect } from "react";
import { getTransportModeLabel } from "../../../../constants";
import { getFormWasteDetailsADRMention } from "@td/constants";
import FormikPackagingList from "../../../../../Apps/Forms/Components/PackagingList/FormikPackagingList";
import { emptyPackaging } from "../../../../../Apps/Forms/Components/PackagingList/helpers";

interface FormWasteTransportSummaryProps {
  form: Form;
}

type FormValues = Pick<
  SignTransportFormInput,
  "transporterNumberPlate" | "transporterTransportMode"
> & {
  update: Pick<
    WasteDetailsInput,
    "quantity" | "packagingInfos" | "sampleNumber"
  >;
};
type FormKeys =
  | "transporterNumberPlate"
  | "transporterTransportMode"
  | keyof FormValues["update"];

const SAMPLE_NUMBER_WASTE_CODES = [
  "13 02 05*",
  "13 02 06*",
  "13 02 07*",
  "13 02 08*",
  "13 01 10*",
  "13 01 11*",
  "13 01 12*",
  "13 01 13*"
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
  transporterTransportMode: () => (
    <div className="form__row">
      <label>
        Mode de transport{" "}
        <Field
          id="id_mode"
          name="transporterTransportMode"
          component={FieldTransportModeSelect}
        ></Field>
      </label>
      <RedErrorMessage name="transporterTransportMode" />
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
      <h6 className="fr-h6">Conditionnement</h6>
      <FormikPackagingList fieldName="update.packagingInfos" />
    </div>
  ),
  sampleNumber: () => (
    <div className="form__row">
      <label>
        Numéro d'échantillon
        <Field name="update.sampleNumber" type="text" className="td-input" />
      </label>
    </div>
  )
};

export function FormWasteTransportSummary({
  form
}: FormWasteTransportSummaryProps) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const [fields, setFields] = React.useState<FormKeys[]>([]);
  const addField = (name: FormKeys) =>
    setFields(currentFields =>
      currentFields
        .concat([name])
        .filter((name, index, fields) => fields.indexOf(name) === index)
    );

  const showTransportModeInput = () => {
    addField("transporterTransportMode");
    setFieldValue(
      "transporterTransportMode",
      values.transporterTransportMode ?? TransportMode.Road
    );
    addField("transporterNumberPlate");
  };

  useEffect(() => {
    if (
      form.transporter?.mode === "ROAD" ||
      values.transporterTransportMode === "ROAD"
    ) {
      addField("transporterNumberPlate");
    }

    if (!form.transporter?.mode && !values.transporterTransportMode) {
      showTransportModeInput();
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
                  onClick={() => {
                    addField("packagingInfos");
                    setFieldValue(
                      "update.packagingInfos",
                      form.wasteDetails?.packagingInfos?.length
                        ? form.wasteDetails?.packagingInfos
                        : [emptyPackaging]
                    );
                  }}
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
              {getFormWasteDetailsADRMention(
                temporaryStorageDetail?.wasteDetails
              )}
            </DataListDescription>
          ) : (
            <DataListDescription>
              {getFormWasteDetailsADRMention(form?.wasteDetails)}
            </DataListDescription>
          )}
        </DataListItem>
        {form.wasteDetails?.code &&
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
          <DataListTerm>Mode de transport</DataListTerm>
          <DataListDescription>
            {getTransportModeLabel(values.transporterTransportMode)}
            <button
              type="button"
              onClick={() => {
                showTransportModeInput();
              }}
              className="tw-ml-2"
            >
              <IconPaperWrite color="blue" />
            </button>
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
