import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
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
import { WorkflowActionProps } from "./WorkflowAction";
import TdSwitch from "common/components/Switch";
import { GET_BSDS, GET_DETAIL_FORM } from "common/queries";
import { Loader, FieldTransportModeSelect } from "common/components";

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

export default function PrepareSegment({ form, siret }: WorkflowActionProps) {
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
                  allowForeignCompanies={true}
                  registeredOnlyCompanies={true}
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
                    <label htmlFor="id_department">Département</label>
                    <Field
                      type="text"
                      name="transporter.department"
                      id="id_department"
                      className="td-input"
                    />
                    <label htmlFor="id_validityLimit">Limite de validité</label>
                    <Field
                      name="transporter.validityLimit"
                      component={DateInput}
                      id="id_validityLimit"
                      className="td-input"
                    />
                    <label htmlFor="id_numberPlate">Immatriculation</label>
                    <Field
                      type="text"
                      name="transporter.numberPlate"
                      id="id_numberPlate"
                      className="td-input"
                    />
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
