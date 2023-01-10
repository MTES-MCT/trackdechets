import { useMutation, gql } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Field, Form as FormikForm, Formik } from "formik";
import React, { useState } from "react";
import * as yup from "yup";
import { boolean, date, object, string, StringSchema } from "yup";
import { companySchema } from "common/validation/schema";
import {
  Mutation,
  MutationPrepareSegmentArgs,
  TransportMode,
} from "generated/graphql/types";
import { segmentFragment } from "common/fragments";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";
import { NotificationError } from "common/components/Error";
import { IconBusTransfer } from "common/components/Icons";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { WorkflowActionProps } from "../WorkflowAction";
import TdSwitch from "common/components/Switch";
import { GET_BSDS, GET_DETAIL_FORM } from "common/queries";
import {
  Loader,
  FieldTransportModeSelect,
  RedErrorMessage,
} from "common/components";

const PREPARE_SEGMENT = gql`
  mutation prepareSegment(
    $id: ID!
    $siret: String!
    $nextSegmentInfo: NextSegmentInfoInput!
  ) {
    prepareSegment(id: $id, siret: $siret, nextSegmentInfo: $nextSegmentInfo) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

/**
 * TEMP Transporter schema, to be merged with "form/bsdd/utils/schema"
 * when TransportSegment supports foreign companies
 */
export const transporterSchema = object().shape({
  isExemptedOfReceipt: boolean().nullable(true),
  receipt: string().when(
    "isExemptedOfReceipt",
    (isExemptedOfReceipt: boolean, schema: StringSchema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema
            .ensure()
            .required(
              "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
            )
  ),
  department: string().when(
    "isExemptedOfReceipt",
    (isExemptedOfReceipt: boolean, schema: StringSchema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required("Le département du transporteur est obligatoire")
  ),
  validityLimit: date().nullable(true),
  numberPlate: string().nullable(true),
  company: companySchema, // TransportSegment DOES NOT supports foreign companies
});

const validationSchema = yup.object({ transporter: transporterSchema });

export function PrepareSegment({ form, siret }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prepareSegment, { loading, error }] = useMutation<
    Pick<Mutation, "prepareSegment">,
    MutationPrepareSegmentArgs
  >(PREPARE_SEGMENT, {
    refetchQueries: [GET_BSDS, GET_DETAIL_FORM],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("Le segment a été créé", {
        hideAfter: 5,
      });
    },
    onError: () => {
      // The error is handled in the UI
    },
  });

  const initialValues = {
    transporter: {
      company: {
        siret: "",
        name: "",
        address: "",
        contact: "",
        mail: "",
        phone: "",
        vatNumber: "",
      },
      isExemptedOfReceipt: false,
      receipt: "",
      department: "",
      validityLimit: new Date().toISOString(),
      numberPlate: "",
    },

    mode: "ROAD" as TransportMode,
  };

  return (
    <>
      <ActionButton
        icon={<IconBusTransfer size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Préparer le transfert à un autre transporteur (multimodal)
      </ActionButton>
      {isOpen && (
        <TdModal
          isOpen={isOpen}
          ariaLabel="Préparer un segment multimodal"
          onClose={() => setIsOpen(false)}
          wide={true}
        >
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={values => {
              const { transporter, ...rst } = values;
              const { validityLimit } = transporter;
              // prevent empty strings to be sent for validityLimit
              prepareSegment({
                variables: {
                  id: form.id,
                  siret,
                  nextSegmentInfo: {
                    transporter: {
                      ...transporter,
                      customInfo: null,
                      validityLimit: validityLimit || null,
                    },
                    ...rst,
                  },
                },
              });
            }}
          >
            {({ values, setFieldValue }) => (
              <FormikForm>
                <h3 className="h3">Préparer un transfert multimodal</h3>
                <div className="notification success tw-mt-3">
                  À compléter uniquement en cas de transport multimodal. En cas
                  de transport simple, vous n'avez rien à faire, c'est à
                  l'installation de destination ou d'entreposage provisoire de
                  valider la réception.
                </div>
                <h4 className="form__section-heading">Transporteur</h4>
                <label htmlFor="id_mode">Mode de transport</label>
                <Field
                  id="id_mode"
                  name="mode"
                  component={FieldTransportModeSelect}
                ></Field>
                <h4 className="form__section-heading">Siret</h4>
                <CompanySelector
                  name="transporter.company"
                  allowForeignCompanies={false}
                  registeredOnlyCompanies={true}
                  initialAutoSelectFirstCompany={false}
                  onCompanySelected={transporter => {
                    if (transporter.transporterReceipt) {
                      setFieldValue(
                        "transporter.receipt",
                        transporter.transporterReceipt.receiptNumber
                      );
                      setFieldValue(
                        "transporter.validityLimit",
                        transporter.transporterReceipt.validityLimit
                      );
                      setFieldValue(
                        "transporter.department",
                        transporter.transporterReceipt.department
                      );
                    } else {
                      setFieldValue("transporter.receipt", "");
                      setFieldValue("transporter.validityLimit", null);
                      setFieldValue("transporter.department", "");
                    }
                  }}
                />
                <h4 className="form__section-heading">Autorisations</h4>

                <div className="form__row">
                  <TdSwitch
                    checked={!!values.transporter.isExemptedOfReceipt}
                    onChange={() =>
                      setFieldValue(
                        "transporter.isExemptedOfReceipt",
                        !values.transporter.isExemptedOfReceipt
                      )
                    }
                    label="Le transporteur déclare être exempté de récépissé conformément
                    aux dispositions de l'article R.541-50 du code de
                    l'environnement."
                  />
                </div>
                {!values.transporter.isExemptedOfReceipt && (
                  <div className="form__row">
                    <label htmlFor="id_receipt">Numéro de récépissé</label>
                    <Field
                      type="text"
                      name="transporter.receipt"
                      id="id_receipt"
                      className="td-input"
                    />
                    <RedErrorMessage name="transporter.receipt" />
                    <label htmlFor="id_department">Département</label>
                    <Field
                      type="text"
                      name="transporter.department"
                      id="id_department"
                      className="td-input"
                    />
                    <RedErrorMessage name="transporter.department" />
                    <label htmlFor="id_validityLimit">
                      Limite de validité (optionnel)
                    </label>
                    <Field
                      name="transporter.validityLimit"
                      component={DateInput}
                      id="id_validityLimit"
                      className="td-input"
                    />
                    <RedErrorMessage name="transporter.validityLimit" />
                    <label htmlFor="id_numberPlate">
                      Immatriculation (optionnel)
                    </label>
                    <Field
                      type="text"
                      name="transporter.numberPlate"
                      id="id_numberPlate"
                      className="td-input"
                    />
                    <RedErrorMessage name="transporter.numberPlate" />
                  </div>
                )}
                {error && <NotificationError apolloError={error} />}

                <div className="form__actions">
                  <button
                    type="button"
                    className="btn btn--outline-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    Annuler
                  </button>
                  <button className="btn btn--primary" type="submit">
                    Valider
                  </button>
                </div>
              </FormikForm>
            )}
          </Formik>
          {loading && <Loader />}
        </TdModal>
      )}
    </>
  );
}
